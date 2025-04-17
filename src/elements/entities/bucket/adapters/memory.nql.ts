import { NQLRunner } from '../query/nql_engine';
import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { NQL_Intersection, NQL_Pagination, NQL_Part, NQL_Rule, NQL_Union } from '../query/nql.schema';
import { Tree } from '~/engine/data/tree';
import { AnyMemoryBucketAdapter } from './memory.bucket_adapter';

type Obj = Record<string, any>
type Objs = Record<string, Obj>

export class MemoryNQLRunner extends NQLRunner {
    
    protected adapter?: AnyMemoryBucketAdapter

    constructor(
    ) {
        super();
    }

    public bind(adapter: AnyMemoryBucketAdapter) {
        this.adapter = adapter;
    }

    async run(trx: AnyTrxNode, part: NQL_Part, params: Obj, pagination?: NQL_Pagination) {
        if (!this.adapter) {
            throw new Error('No adapter bound to NQL Runner')
        }
        const data = this.adapter.data;

        let response;
        // Empty query, don't filter data
        if (part.union.inters.length === 0) {
            response = data;
        }
        // Non-empty query
        else {
            response = await this.filter(part, data, params);
        }

        let output = Object.values(response);

        if (part.union.order) {
            const k = part.union.order.dir || this.adapter.config.meta.updated_at;
            if (part.union.order.dir === 'asc') {
                output.sort((a,b) => a[k]-b[k])
            }
            else {
                output.sort((a,b) => b[k]-a[k])
            }
        }

        let count: number|undefined = undefined;
        if (pagination) {
            if (pagination.count) {
                count = output.length;
            }
            if (pagination.page || pagination.perPage) {
                const a = ((pagination.page || 1)-1) * (pagination.perPage || 10);
                const b = a + (pagination.perPage || 10);
                output = output.slice(a, b);
            }
        }

        return {
            data: output,
            count,
            page: pagination?.page,
            perPage: pagination?.perPage
        }
    }

    /**
     * Goes through each rule keeping a scoped white and black list to avoid
     * testing objects unnecessarily. Returns a dict of results by id.
     * @returns 
     */
    private filter(part: NQL_Part, objs: Objs, params: Obj) {

        const _union = (union: NQL_Union, objs: Objs, params: Obj) => {
            // console.log(`::UNION (objs: ${Object.keys(objs)})\n`)
            const out: Objs = {};
            for (const inter of union.inters) {
                // Pass `out` as blacklist: if already found, can be skipped
                const black = out;

                const interOut =_inter(inter, objs, params, black);
                Object.assign(out, interOut);
            }
            // console.log('    -> union out\n', out);
            return out;
        }

        const _inter = (inter: NQL_Intersection, objs: Objs, params: Obj, black: Objs = {}) => {
            // console.log(`::INTER (objs: ${Object.keys(objs)}, black: ${Object.keys(black)})\n`)
            
            // Create white set, which will be modified by rules running on this union
            const white = new Set(Object.keys(objs));

            let out: Objs = {};
            for (const rule of inter.rules) {

                // <Union>
                if ('inters' in rule) {
                    if (!_union(rule, objs, objs)) return false;
                }
                // <Rule>
                else {
                    const ruleOut =_rule(rule, objs, params, black, white);
                    out = ruleOut;
                }
                
                if (white.size == 0) break;

                // console.log(`    -> white: ${Array.from(white.values())}\n`)
            }
            // console.log(`    -> inter out: ${Object.keys(out)}\n`)
            return out;
        }

        const _rule = (rule: NQL_Rule, objs: Objs, params: Obj, black: Objs, white: Set<number|string>) => {
            // console.log(`::RULE (objs: ${Object.keys(objs)}, black: ${Object.keys(black)}, white: ${Array.from(white.values())})\n`)
            const out: Objs = {};
            
            for (const id in objs) {
                if (!white.has(id)) {
                    continue;
                }
                if (id in black) {
                    white.delete(id);
                    continue;
                }

                const obj = objs[id];
                let match =_obj(rule, obj, params);
                // console.log(`    -> match: ${match}\n`)

                if (rule.not) {
                    match = !match;
                }
                if (!match) {
                    white.delete(id);
                    continue;
                }

                if (obj !== undefined) {
                    if (rule.select) {
                        out[obj.id] = obj[rule.select];
                    }
                    else {
                        out[obj.id] = obj;
                    }
                }
            }
            // console.log(`    -> rule out: ${Object.keys(out)}\n`)
            return out;
        };

        const _obj = (rule: NQL_Rule, obj: Obj, params: Obj): boolean => {
            // console.log(`::OBJ (obj: ${obj.id})\n`)
            const fieldValue = Tree.get(obj, rule.fieldpath);
            
            // Value is undefined, only 'present' rule applies
            if (fieldValue === undefined) {
                if (rule.op === 'present') {
                    return false;
                }
                return false;
            }

            // Fieldpath is a spread, apply rule to each item
            if (rule.fieldpath.includes('.#')) {
                for (const item of fieldValue) {
                    if (_obj(rule, item, params)) return true;
                }
                return false;
            }
            
            let queryValue: any;
            // Value is a subquery, run union
            if ('subquery' in rule.value) {
                const subOut = _union((rule.value as any).subquery, objs, params);
                const subList = Object.values(subOut);
                // Subquery operator is for a list, filter
                if (rule.op === 'in' || rule.op === 'contains_any') {
                    queryValue = subList;
                }
                // Subquery operator is for a single item, pick first
                else {
                    queryValue = subList[0];
                }
            }
            else if ('param' in rule.value) {
                if (Array.isArray(rule.value.param)) {
                    queryValue = rule.value.param.map(p => params[p]);
                }
                else {
                    queryValue = params[rule.value.param];
                }
            }
            else if ('static' in rule.value) {
                queryValue = rule.value.static;
            }
            // console.log({fieldpath: rule.fieldpath, op: rule.op, fieldValue, queryValue});

            // Check each operation
            // (Compatible operations and types have already been validated)
            if (rule.op === '<') {
                return fieldValue < queryValue;
            }
            if (rule.op === '<=') {
                return fieldValue <= queryValue;
            }
            if (rule.op === '==') {
                if (rule.case_i) {
                    return fieldValue.toLowerCase() === queryValue.toLowerCase();
                }
                else {
                    return fieldValue === queryValue;
                }
            }
            if (rule.op === '>') {
                return fieldValue > queryValue;
            }
            if (rule.op === '>=') {
                return fieldValue >= queryValue;
            }
            if (rule.op === 'in') {
                if (typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
                    return fieldValue in queryValue;
                }
                else {
                    return queryValue.includes(fieldValue);
                }
            }
            if (rule.op === 'contains') {
                if (typeof fieldValue === 'string') {
                    if (rule.case_i) {
                        return fieldValue.toLowerCase().includes(queryValue.toLowerCase());
                    }
                    else {
                        return fieldValue.includes(queryValue);
                    }
                }
                else {
                    if (rule.case_i) {
                        return Object.keys(fieldValue).some(f => f.toLowerCase().includes(queryValue.toLowerCase()));
                    }
                    else {
                        return queryValue in fieldValue;
                    }
                }
            }
            if (rule.op === 'contains_any') {
                if (typeof fieldValue === 'string') {
                    if (rule.case_i) {
                        return (queryValue as any[]).some(q => fieldValue.toLowerCase().includes(q.toLowerCase()));
                    }
                    else {
                        return (queryValue as any[]).some(q => fieldValue.includes(q));
                    }
                }
                else {
                    if (rule.case_i) {
                        return (queryValue as any[]).some(q => 
                            Object.keys(q).some(k =>
                                fieldValue.toLowerCase().includes(q.toLowerCase())
                            )
                        );
                    }
                    else {
                        return (queryValue as any[]).some(q => q in fieldValue);
                    }
                }
            }
            if (rule.op === 'present') {
                return true;
            }

            return false;
        }

        return _union(part.union, objs, params);
    }
}