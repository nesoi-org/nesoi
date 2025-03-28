import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { NQLRunner } from '~/elements/entities/bucket/query/nql_engine';
import { NQL_Intersection, NQL_Part, NQL_Rule, NQL_Union } from '~/elements/entities/bucket/query/nql.schema';
import postgres from 'postgres';
import { Trx } from '~/engine/transaction/trx';
import { PostgresBucketAdapter } from './postgres.bucket_adapter';
import { Log } from '~/engine/util/log';

type Obj = Record<string, any>
type Objs = Record<string, Obj>

export class PostgresNQLRunner extends NQLRunner {
    
    protected sql?: postgres.Sql<any>

    constructor(
    ) {
        super();
    }

    async run(trx: AnyTrxNode, part: NQL_Part, params: Obj) {
        const sql = Trx.get<postgres.Sql<any>>(trx, 'sql');
        const tableName = PostgresBucketAdapter.getTableName(trx, part.union.meta);

        const sql_params: any[] = [];

        // console.log(NQL_RuleTree.describe(part.union));

        const _sql = (part: NQL_Part) => {
            let where = _union(part.union);
            if (where) {
                where = 'WHERE ' + where;
            }   
            const sql_str = `SELECT * FROM ${tableName} ${where}`;
            return sql.unsafe(sql_str, sql_params).catch(e => {
                Log.error('bucket', 'postgres', e.toString(), e);
                throw new Error('Database error.');
            });
        }
        const _union = (union: NQL_Union): string => {
            const inters = union.inters.map(
                i => _inter(i)
            ).filter(r => !!r).join(' OR ');
            if (!inters) return '';
            return `(${inters})`;
        }
        const _inter = (inter: NQL_Intersection): string => {
            const rules = inter.rules.map(
                r => (('value' in r) ? _rule(r) : _union(r))
            ).filter(r => !!r).join(' OR ');
            if (!rules) return '';
            return `(${rules})`;
        }
        const _rule = (rule: NQL_Rule): string => {

            // Replace '.' of fieldpath with '->' (JSONB compatible)
            let column = rule.fieldpath.replace(/\./g, '->');

            // TODO: handle '.*'

            // Special case: "present" operation
            if (rule.op === 'present') {
                if (rule.not) {
                    return `"${column}" IS NULL`
                }
                else {
                    return `"${column}" IS NOT NULL`
                }
            }

            // Fetch value
            let value;
            if ('static' in rule.value) {
                value = rule.value.static;
            }
            else if ('param' in rule.value) {
                value = params[rule.value.param as string] // TODO: deal with param[]
            }
            else {
                throw new Error('Sub-queries not implemented yet.') // TODO: subquery
            }

            // Don't add condition if value is null
            if (value === undefined) { return ''; }

            // Translate operation
            let op = {
                '==': '=',
                '<': '<',
                '>': '>',
                '<=': '<=',
                '>=': '>=',
                'in': 'IN',
                'contains': 'LIKE',
                'contains_any': '' // TODO
            }[rule.op];

            // Apply case insensitive modifier
            if (rule.case_i) {
                if (rule.op === '==') {
                    column = `LOWER(${column})`
                }
                else if (rule.op === 'contains') {
                    op = 'ILIKE';
                }
            }

            // Special case: "contains" operation
            if (rule.op === 'contains') {
                value = `%${value}%`;
            }

            sql_params.push(value);
            return `${rule.not ? 'NOT ' : ''} "${column}" ${op} $${sql_params.length}`
        }

        // Debug
        // const str = await _sql(part).describe().catch(e => {
        //     Log.error('postgres' as any, 'nql', e.query, e);
        // })
        // console.log((str as any).string);
        // End of Debug

        const out = await _sql(part);

        return Object.values(out) as any;
    }

}