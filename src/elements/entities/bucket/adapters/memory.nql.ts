import { NQLRunner } from '../query/nql_engine';
import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { NQL_Intersection, NQL_Pagination, NQL_Part, NQL_Rule, NQL_Union } from '../query/nql.schema';
import { Tree } from '~/engine/data/tree';
import { AnyMemoryBucketAdapter } from './memory.bucket_adapter';

type Obj = Record<string, any>
type Objs = Record<string, Obj>

/**
 * @category NQL
 * */
export class MemoryNQLRunner extends NQLRunner {
    
    protected adapter?: AnyMemoryBucketAdapter

    constructor(
    ) {
        super();
    }

    public bind(adapter: AnyMemoryBucketAdapter) {
        this.adapter = adapter;
    }

    async run(trx: AnyTrxNode, part: NQL_Part, params: Obj[], param_templates: Record<string, string>[], pagination?: NQL_Pagination) {
        if (!this.adapter) {
            throw new Error('No adapter bound to NQL Runner')
        }
        const data = this.adapter.data;

        let response;
        // Empty query, don't filter data
        if (part.union.inters.length === 0) {
            response = { ...data };
        }
        // Non-empty query
        else {
            response = await this.filter(part, data, params, param_templates);
        }

        let output = Object.values(response);

        if (part.union.sort?.length) {
            const sort = part.union.sort;

            output.sort((a,b) => {
                for (let i = 0; i < sort.length; i++) {
                    const s = sort[i];
                    const a_val = Tree.get(a, s.key);
                    const b_val = Tree.get(b, s.key);
                    if (typeof a_val == 'number') {
                        if (typeof b_val !== 'number') throw new Error(`Cannot compare number and ${typeof b_val}`);
                        let d = a_val - b_val;
                        if (d !== 0) {
                            if (s.dir === 'desc') {
                                d *= -1;
                            }
                            return d;
                        }
                    }
                    else if (typeof a_val == 'string') {
                        if (typeof b_val !== 'string') throw new Error(`Cannot compare string and ${typeof b_val}`);
                        let d = (a_val as string).localeCompare(b_val);
                        if (d !== 0) {
                            if (s.dir === 'desc') {
                                d *= -1;
                            }
                            return d;
                        }
                    }
                }
                return 0;
            })
        }

        let totalItems: number|undefined = undefined;
        if (pagination) {
            if (pagination.returnTotal) {
                totalItems = output.length;
            }
            if (pagination.page !== undefined || pagination.perPage !== undefined) {
                const a = ((pagination.page || 1)-1) * (pagination.perPage ?? 10);
                const b = a + (pagination.perPage ?? 10);
                output = output.slice(a, b);
            }
        }

        return {
            data: output,
            totalItems,
            page: pagination?.page,
            perPage: pagination?.perPage
        }
    }

    /**
     * Goes through each rule keeping a scoped white and black list to avoid
     * testing objects unnecessarily. Returns a dict of results by id.
     * @returns A dict of results by id
     */
    private filter(part: NQL_Part, objs: Objs, params: Obj[], param_templates: Record<string, string>[]) {

        // Accumulate results from n intersections,
        // avoiding a re-check of already matched objects.
        const _union = (union: NQL_Union, objs: Objs, params: Obj[], param_templates: Record<string, string>[]) => {
            const out: Objs = {};

            const remaining = { ...objs };
            for (const inter of union.inters) {
                if (Object.keys(remaining).length === 0) break;

                const interOut = _inter(inter, remaining, params, param_templates);
                
                Object.assign(out, interOut);
                for (const k in interOut) {
                    delete remaining[k];
                }
            }
            return out;
        }

        // Sieves results from n unions or rules,
        // avoiding a re-check of already filtered-out objects.
        const _inter = (inter: NQL_Intersection, objs: Objs, params: Obj[], param_templates: Record<string, string>[]) => {
            let out: Objs = {};
            const remaining = {...objs};
            for (const rule of inter.rules) {
                if (Object.keys(remaining).length === 0) break;

                // <Union>
                if ('inters' in rule) {
                    out = _union(rule, remaining, params, param_templates);
                }
                // <Rule>
                else {
                    out = _rule(rule, remaining, params, param_templates);
                }

                for (const k in remaining) {
                    if (!(k in out)) {
                        delete remaining[k];
                    }
                }
            }
            return out;
        }

        const _rule = (rule: NQL_Rule, objs: Objs, params: Obj[], param_templates: Record<string, string>[]) => {
            const out: Objs = {};
            for (const id in objs) {

                const obj = objs[id];
                let match = false;

                const combos: { params: Obj, param_template: Obj }[] = []
                for (const param of params) {
                    if (param_templates.length) {
                        for (const template of param_templates) {
                            combos.push({params: param, param_template: template});
                        }
                    }
                    else {
                        combos.push({params: param, param_template: {}});
                    }
                }

                
                for (const combo of combos) {
                    match = _obj(rule, obj, combo.params, combo.param_template);
                    if (match) break;
                }

                if (rule.not) {
                    match = !match;
                }

                if (match) {
                    if (rule.select) {
                        out[obj.id] = obj[rule.select];
                    }
                    else {
                        out[obj.id] = obj;
                    }
                }
            }
            return out;
        };

        const _obj = (rule: NQL_Rule, obj: Obj, params: Obj, param_template: Record<string, string>): boolean => {
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
                    if (_obj(rule, item, params, param_template)) return true;
                }
                return false;
            }
            
            let queryValue: any;
            // Value is a subquery, run union
            if ('subquery' in rule.value) {
                const subOut = _union(rule.value.subquery.union, objs, [params], Object.keys(param_template).length ? [param_template] : []);
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
                    queryValue = rule.value.param.map(p => Tree.get(params,p));
                }
                else {
                    queryValue = Tree.get(params, rule.value.param);
                }
            }
            else if ('param_with_$' in rule.value) {
                let path = rule.value.param_with_$;
                for (const key in param_template) {
                    path = path.replace(new RegExp(key.replace('$','\\$'), 'g'), param_template[key]);
                }
                queryValue = Tree.get(params, path);
            }
            else if ('static' in rule.value) {
                queryValue = rule.value.static;
            }

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
                    return fieldValue?.toLowerCase() === queryValue?.toLowerCase();
                }
                else {
                    return fieldValue?.toString() === queryValue?.toString();
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
                else if (Array.isArray(fieldValue)) {
                    if (rule.case_i) {
                        return fieldValue.some(f => f.toLowerCase().includes(queryValue.toLowerCase()));
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
                else if (Array.isArray(fieldValue)) {
                    if (rule.case_i) {
                        return (queryValue as any[]).some(q => 
                            fieldValue.some(f =>
                                f.toLowerCase().includes(q.toLowerCase())
                            )
                        );
                    }
                    else {
                        return (queryValue as any[]).some(q => fieldValue.includes(q));
                    }
                }
                else {
                    if (rule.case_i) {
                        return (queryValue as any[]).some(q => 
                            Object.keys(fieldValue).some(k =>
                                k.toLowerCase().includes(q.toLowerCase())
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

        return _union(part.union, objs, params, param_templates);
    }
}