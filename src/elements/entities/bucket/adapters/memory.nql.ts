import type { AnyTrxNode } from '~/engine/transaction/trx_node';
import type { NQL_Intersection, NQL_Pagination, NQL_Part, NQL_Rule, NQL_Union } from '../query/nql.schema';

import { NQLRunner } from '../query/nql_engine';
import { Tree } from '~/engine/data/tree';
import { NesoiDatetime } from '~/engine/data/datetime';

type Obj = Record<string, any>
type Objs = Record<string, Obj>

/**
 * @category NQL
 * */
export class MemoryNQLRunner extends NQLRunner {
    
    constructor(
        protected data: Record<string, Obj> = {}
    ) {
        super();
    }

    public bind(data: Record<string, Obj>) {
        this.data = data;
    }

    async run(
        trx: AnyTrxNode,
        part: NQL_Part,
        params: Record<string, any>[],
        options: {
            pagination?: NQL_Pagination,
            param_templates?: Record<string, string>[],
            metadata_only?: boolean
        } = {}
    ) {
        if (!this.data) {
            throw new Error('No data bound to NQL Runner')
        }
        const data = this.data;

        let response;
        // Empty query, don't filter data
        if (part.union.inters.length === 0) {
            response = { ...data };
        }
        // Non-empty query
        else {
            response = await this.filter(part, data, params, options.param_templates ?? []);
        }

        let output = Object.values(response);

        if (part.union.sort?.length) {
            const sort = part.union.sort;

            output.sort((a,b) => {
                let fallback = 0;
                for (let i = 0; i < sort.length; i++) {
                    const s = sort[i];
                    const a_val = s.key_is_deep ? Tree.get(a, s.key) : a[s.key];
                    const b_val = s.key_is_deep ? Tree.get(b, s.key) : b[s.key];
                    if (a_val == null) {
                        if (b_val == null) return 0;
                        fallback = -1;
                        continue;
                    }
                    else if (b_val == null) {
                        if (a_val == null) return 0;
                        fallback = 1;
                        continue;
                    }
                    if (a_val instanceof NesoiDatetime) {
                        let d = 0;
                        if (b_val instanceof NesoiDatetime) d = a_val.epoch - b_val.epoch;
                        else if (typeof b_val === 'string') d = a_val.epoch - NesoiDatetime.fromISO(b_val).epoch;
                        else if (typeof b_val === 'number') d = a_val.epoch - b_val;
                        else throw new Error(`Cannot compare datetime and ${typeof b_val}`);
                        if (d !== 0) {
                            if (s.dir === 'desc') d *= -1;
                            return d;
                        }
                    }
                    else if (b_val instanceof NesoiDatetime) {
                        let d = 0;
                        if (a_val instanceof NesoiDatetime) d = a_val.epoch - b_val.epoch;
                        else if (typeof a_val === 'string') d = NesoiDatetime.fromISO(a_val).epoch - b_val.epoch;
                        else if (typeof a_val === 'number') d = a_val - b_val.epoch;
                        else throw new Error(`Cannot compare datetime and ${typeof a_val}`);
                        if (d !== 0) {
                            if (s.dir === 'desc') d *= -1;
                            return d;
                        }
                    }
                    else if (typeof a_val == 'number') {
                        if (typeof b_val !== 'number') throw new Error(`Cannot compare number and ${typeof b_val}`);
                        let d = a_val - b_val;
                        if (d !== 0) {
                            if (s.dir === 'desc') d *= -1;
                            return d;
                        }
                    }
                    else if (typeof a_val == 'string') {
                        if (typeof b_val !== 'string') throw new Error(`Cannot compare string and ${typeof b_val}`);
                        let d = (a_val as string).localeCompare(b_val);
                        if (d !== 0) {
                            if (s.dir === 'desc') d *= -1;
                            return d;
                        }
                    }
                }
                return fallback;
            })
        }

        let totalItems: number|undefined = undefined;
        if (options.pagination) {
            if (options.pagination.returnTotal) {
                totalItems = output.length;
            }
            if (options.pagination.page !== undefined || options.pagination.perPage !== undefined) {
                const a = ((options.pagination.page || 1)-1) * (options.pagination.perPage ?? 10);
                const b = a + (options.pagination.perPage ?? 10);
                output = output.slice(a, b);
            }
        }

        return {
            data: output,
            totalItems,
            page: options.pagination?.page,
            perPage: options.pagination?.perPage
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
        
        const _rule = (rule: NQL_Rule, objs: Objs, params: Obj[], param_templates: Obj[]) => {
            const out: Objs = {};
    
            for (let i = 0; i < params.length; i++) {
                const match = _index(rule, objs, params[i], param_templates[i] ?? {});
                if (match) {
                    Object.assign(out, match);
                    continue;
                }

                for (const id in objs) {
                    const obj = objs[id];
                    let match = _obj(rule, obj, params[i], param_templates[i] ?? {});
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
            }

            return out;
        };

        const _value = (rule: NQL_Rule, params: Obj, param_template: Record<string, string>): any => {
            
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
                    queryValue = rule.value.param_is_deep
                        ? rule.value.param.map(p => Tree.get(params,p))
                        : rule.value.param.map(p => params[p]);
                }
                else {
                    queryValue = rule.value.param_is_deep
                        ? Tree.get(params, rule.value.param)
                        : params[rule.value.param];
                }
            }
            else if ('param_with_$' in rule.value) {
                if (Object.keys(param_template).length) {
                    let path = rule.value.param_with_$;
                    for (const key in param_template) {
                        path = path.replace(new RegExp(key.replace('$','\\$'), 'g'), param_template[key]);
                    }
                    queryValue = Tree.get(params, path);
                }
                else {
                    queryValue = undefined;
                }
            }
            else if ('static' in rule.value) {
                queryValue = rule.value.static;
            }

            return queryValue;
        }

        const _index = (rule: NQL_Rule, objs: Objs, params: Obj, param_template: Record<string, string>): Objs | undefined => {
            if (rule.op !== '==') return undefined;
            if (rule.fieldpath !== 'id') return undefined;
            
            const queryValue = _value(rule, params, param_template);

            let out: Objs = {};
            if (rule.not) {
                out = Object.assign({},objs);
                delete out[queryValue];
            }
            else {
                const obj = objs[queryValue];
                if (obj) {
                    out[obj.id] = obj;
                }
            }
            
            for (const id in out) {
                if (rule.select) {
                    out[id] = out[id][rule.select];
                }
            }

            return out;
        }

        const _obj = (rule: NQL_Rule, obj: Obj, params: Obj, param_template: Record<string, string>): boolean => {
            const fieldValue = rule.fieldpath_is_deep
                ? Tree.get(obj, rule.fieldpath)
                : obj[rule.fieldpath];
            
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
            
            const queryValue = _value(rule, params, param_template);

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
                if (typeof fieldValue === 'number') {
                    if (rule.case_i) {
                        return fieldValue.toString().toLowerCase().includes(queryValue.toLowerCase());
                    }
                    else {
                        return fieldValue.toString().includes(queryValue);
                    }
                }
                else if (typeof fieldValue === 'string') {
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