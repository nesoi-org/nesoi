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

    private guard(sql: postgres.Sql<any>) {
        return (template: TemplateStringsArray, ...params: readonly any[]) => {
            return sql.call(sql, template, ...params).catch(e => {
                Log.error('bucket', 'postgres', e.toString(), e);
                throw new Error('Database error.');
            }) as unknown as Obj[];
        }
    }

    async run(trx: AnyTrxNode, part: NQL_Part, params: Obj) {
        const sql = Trx.get<postgres.Sql<any>>(trx, 'sql');
        const tableName = PostgresBucketAdapter.getTableName(trx, part.union.meta);

        // console.log(NQL_RuleTree.describe(part.union));

        const _sql = (part: NQL_Part) => {
            return this.guard(sql)`SELECT * FROM ${sql(tableName)} WHERE ${sql.unsafe(_union(part.union))}`
        }
        const _union = (union: NQL_Union): string => {
            return `(${union.inters.map(
                i => _inter(i)
            ).join(' OR ')})`
        }
        const _inter = (inter: NQL_Intersection): string => {
            return `(${inter.rules.map(
                r => (('value' in r) ? _rule(r) : _union(r))
            ).join(' AND ')})`
        }
        const _rule = (rule: NQL_Rule): string => {

            // Replace '.' of fieldpath with '->' (JSONB compatible)
            // TODO: process '.*'
            const column = rule.fieldpath.replace(/\./g, '->');
            const op = {
                '==': '=',
                '<': '<',
                '>': '>',
                '<=': '<=',
                '>=': '>=',
                'in': 'in',
                'contains': 'like',
                'contains_any': 'like',
                'present': ''
            }[rule.op];

            let value;
            if ('static' in rule.value) value = rule.value.static;
            else if ('param' in rule.value) value = params[rule.value.param as string] // TODO: deal with param[]
            else {
                // TODO: subquery
                throw new Error('Sub-queries not implemented yet.')
            }

            return `${column} ${op} ${value}`
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