import type { NQL_Union, NQL_Operation, NQL_QueryMeta, NQL_Part, NQL_Rule, NQL_Intersection, NQL_Node, NQL_AnyQuery } from './nql.schema';
import type { BucketReference } from '~/engine/transaction/trx_engine';

import type { $BucketModelField } from '../model/bucket_model.schema';
import { $BucketModel } from '../model/bucket_model.schema';
import { colored } from '~/engine/util/string';
import { Daemon } from '~/engine/daemon';
import { Tag } from '~/engine/dependency';
import type { AnyTrxNode} from '~/engine/transaction/trx_node';
import { TrxNode } from '~/engine/transaction/trx_node';
import { MemoryNQLRunner } from '../adapters/memory.nql';

// Intermediate Types

type ParsedKey = {
    type: 'sort' | 'and' | 'or' | 'graphlink' | 'querymodelpath',
    
    link?: string
    linkBucket?: $Bucket
    
    or?: boolean
    querymodelpath?: string
    not?: boolean
    case_i?: boolean
    op?: NQL_Operation
}

/**
 * @category NQL
 * */
export class NQL_RuleTree {

    private static OpByType: Record<$BucketModelFieldType, NQL_Operation[]> = {
        'boolean': ['==', 'in', 'present'],
        'date': ['<', '<=', '==', '>', '>=', 'in', 'present'],
        'datetime': ['<', '<=', '==', '>', '>=', 'in', 'present'],
        'duration': ['<', '<=', '==', '>', '>=', 'in', 'present'],
        'decimal': ['<', '<=', '==', '>', '>=', 'in', 'present'],
        'dict': ['==', 'contains', 'contains_any', 'in', 'present'],
        'enum': ['==', 'contains', 'contains_any', 'in', 'present'],
        'file': [],
        'float': ['<', '<=', '==', '>', '>=', 'in', 'present', 'contains'],
        'int': ['<', '<=', '==', '>', '>=', 'in', 'present', 'contains'],
        'string': ['==', 'contains', 'contains_any', 'in', 'present'],
        'literal': ['==', 'contains', 'contains_any', 'in', 'present'],
        'obj': ['contains_any', 'in', 'present'],
        'list': ['contains', 'contains_any', 'present'],
        'union': [],
        'unknown': ['==', 'contains', 'contains_any', 'in', 'present']
    }

    public root!: NQL_Union
    public memory_only = true;

    constructor(
        private trx: AnyTrxNode,
        private tag: Tag,
        private query: NQL_AnyQuery,
        private scope_by_tag = false,
        private tenancy = false
    ) {
    }
    
    public async parse() {
        const module = TrxNode.getModule(this.trx);
        const bucketRef = await Daemon.getBucketReference(module.name, module.daemon!, this.tag);

        bucketRef.query.scope = this.scope_by_tag ? this.tag.full : bucketRef.query.scope;
        
        this.root = await this.parseUnion(bucketRef, this.query, undefined, this.tenancy);
        if (process.env.NESOI_NQL_DEBUG_ORIGINAL === 'true') {
            console.log('original\n', this.describe());
        }
        
        this.simplify();
        this._addDebugId()
        if (process.env.NESOI_NQL_DEBUG === 'true') {
            console.log('simplified\n', this.describe());
        }
    }

    // Parse NQL
    private getTenancyQuery(
        schema: $Bucket
    ) {
        if (!schema.tenancy) return;
        const match = TrxNode.getFirstUserMatch(this.trx, schema.tenancy)
        if (!match) return;
        return schema.tenancy[match.provider]?.(match!.user);
    }

    private async parseUnion(bucketRef: BucketReference, query: NQL_AnyQuery, select?: string, tenancy = false): Promise<NQL_Union> {

        if (!(bucketRef.query.runner instanceof MemoryNQLRunner)) {
            this.memory_only = false;
        }

        let union: NQL_Union = {
            meta: {
                ...bucketRef.query,
                schema: bucketRef.schema,
                avgTime: 0
            },
            inters: [
                { meta: {} as any, rules: [] }
            ]
        }

        for (const key in query) {
            const value = query[key];
            const parsedKey = await this.parseKey(bucketRef, key);

            // QueryModelpath term -> Condition
            if (parsedKey.type === 'querymodelpath') {
                const parsed = await this.parseValue(value, parsedKey, bucketRef.query, select)
                
                const rule: NQL_Rule | NQL_Union =
                    ('subquery' in parsed)
                        ? parsed.subquery.union
                        : {
                            meta: { ...bucketRef.query, schema: bucketRef.schema },
                            select,
                            querymodelpath: parsedKey.querymodelpath!,
                            querymodelpath_is_deep: parsedKey.querymodelpath!.includes('.'),
                            value: parsed,
                            op: parsedKey.op!,
                            case_i: parsedKey.case_i!,
                            not: parsedKey.not!
                        }

                // console.log({ parsedKey, parsed, rule })

                if (!parsedKey.or) {
                    union.inters[0].rules.push(rule);
                }
                else {
                    union.inters.push({ meta: {} as any, rules: [rule] });
                }
            }
            // TODO: Pre-parse graph link into subquery
            // Graph Link term -> Condition
            else if (parsedKey.type === 'graphlink') {
                // // const parsed = this.parseValue(value, parsedKey, meta, select)
                // this.parseSubQuery({
                //     [`@${parsedKey.linkBucket!.name}.${}`]
                // }, parsedKey, meta, select)
                // parsedValue = this.parseExpression(parsedKey.linkBucket!, value)
                throw new Error('Graph Link not supported yet')
            }
            else if (parsedKey.type === 'and') {
                const subInter = await this.parseUnion(bucketRef, value, select, tenancy)
                union.inters[0].rules.push(subInter);
            }
            else if (parsedKey.type === 'or') {
                const subInter = await this.parseUnion(bucketRef, value, select, tenancy)
                union.inters.push({ meta: {} as any, rules: [subInter] });
            }
            else if (parsedKey.type === 'sort') {
                union.sort = await this.parseSort(bucketRef, value)
            }

        }

        if (!union.inters[0]?.rules.length) {
            union.inters.splice(0,1);
        }

        if (tenancy) {
            const tenancyQuery = this.getTenancyQuery(bucketRef.schema);
            if (tenancyQuery) {
                const tenancyUnion = await this.parseUnion(bucketRef, tenancyQuery, undefined, false)
                union = {
                    ...union,
                    inters: [
                        { meta: {} as any, rules: [ tenancyUnion ] },
                        { meta: {} as any, rules: [ union ] },
                    ]
                }
            }
        }

        return union
    }
    
    private parseSort(meta: BucketReference, value: any): NQL_Union['sort'] {

        if (!Array.isArray(value)) value = [value];

        if ((value as any[]).some(v => typeof v !== 'string')) {
            throw new Error('Invalid sort parameter. Should be a string or array of strings.');
        }

        const sort: {
            key: string,
            key_is_deep: boolean,
            dir: ('asc'|'desc')
        }[] = [];

        for (const v of value) {

            let key, vdir;
            if (v.endsWith('@asc')) {
                key = v.split('@asc')[0];
                vdir = 'asc' as const;
            }
            else if (v.endsWith('@desc')) {
                key = v.split('@desc')[0];
                vdir = 'desc' as const;
            }
            else {
                throw new Error(`Invalid query sort direction '${key}', string must end with '@asc' or '@desc'`);
            }

            const is_metadata_field = Object.values(meta.meta).includes(key);
            if (!is_metadata_field) {
                const fields = $BucketModel.getFields(meta.schema.model, key);
                if (!fields.length) {
                    throw new Error(`Field '${key}' not found on bucket '${meta.schema.name}'`);
                }
                for (const field of fields) {
                    if (![
                        'date', 'datetime', 'duration', 'decimal', 'enum', 'float', 'int', 'string', 'literal', 'boolean', 'unknown'
                    ].includes(field.type)) {
                        throw new Error(`Field '${key}' is not sortable`);
                    }
                }
            }

            sort.push({
                key,
                key_is_deep: key.includes('.'),
                dir: vdir
            })
        }

        return sort
    }
    
    private async parseKey(meta: BucketReference, key: string): Promise<ParsedKey> {
        if (key === '#sort') {
            return  { type: 'sort' }
        }
        else if (key.startsWith('#and')) {
            return  { type: 'and' }
        }
        else if (key.startsWith('#or')) {
            return  { type: 'or' }
        }
        else if (key.startsWith('*')) {
            const linkName = key.slice(1);
            const link = meta.schema.graph.links[linkName];
            if (!link) {
                throw new Error(`Graph Link '${linkName}' doesn't exist on the bucket ${meta}`);
            }
            const module = TrxNode.getModule(this.trx);
            const linkBucketRef = await Daemon.getBucketReference(module.name, module.daemon!, link.bucket);

            return  { type: 'graphlink', link: link.name, linkBucket: linkBucketRef.schema }
        }
        else {
            const term = key.match(/^(or )?([\w|.|*]+)( not)? ?(~)?(.*)$/);
            if (!term) {
                throw new Error(`Invalid term '${key}'`);
            }
            const [_, or, querymodelpath, not, case_i, op] = term;

            if (Object.values(meta.meta).includes(querymodelpath)) {
                const _op = this.parseOp([{ type: 'datetime', name: querymodelpath } as any], op);
                return  { type: 'querymodelpath', or: !!or, querymodelpath, not: !!not, case_i: !!case_i, op: _op as any }
            }

            const fields = $BucketModel.getFields(meta.schema.model, querymodelpath);
            if (!fields.length) {
                throw new Error(`Field '${querymodelpath}' not found on bucket '${meta.schema.name}'`);
            }
            const _op = this.parseOp(fields, op);

            return  { type: 'querymodelpath', or: !!or, querymodelpath, not: !!not, case_i: !!case_i, op: _op as any }
        }
    }

    private parseOp(fields: $BucketModelField[], op: string): NQL_Operation {
        const _op = (op === '' ? '==' : op) as NQL_Operation;

        for (const field of fields) {
            if (![
                '==' , '>', '<', '>=', '<=',
                'in', 'contains', 'contains_any' , 'present'
            ].includes(_op)) {
                throw new Error(`Invalid operation '${_op}'`);
            }

            let allowedOps;
            // If field is a union, use the intersection of allowed operations
            if (field.type === 'union') {
                const children = Object.values(field.children!);
                const opsUnion = children
                    .map(f => NQL_RuleTree.OpByType[f.type])
                    .flat(1);
                const dict: Record<string, number> = {};
                for (const op of opsUnion) {
                    dict[op] ??= 0;
                    dict[op]++;
                }
                allowedOps = Object.entries(dict)
                    .filter(([k,v]) => v === children.length)
                    .map(([k]) => k);
            }
            // If not, use the field allowed operations
            else {
                allowedOps = NQL_RuleTree.OpByType[field.type];
            }

            if (!allowedOps.includes(_op)) {
                throw new Error(`Field '${field.name}' of type '${field.type}' doesn't support operation '${_op}'`);
            }
        }

        return _op;
    }

    private async parseValue(value: any, parsedKey: ParsedKey, meta: NQL_QueryMeta, select?: string): Promise<NQL_Rule['value']> {

        if (typeof value === 'object') {
            // Array
            if (Array.isArray(value)) {
                const statyc: any[] = []
                const params: string[] = []

                for (const item of value) {
                    const parsed = await this.parseValue(item, parsedKey, meta, select);
                    if ('static' in parsed) {
                        statyc.push(parsed.static)
                    }
                    else if ('param' in parsed) {
                        params.push(parsed.param as string)
                    }
                    else if ('subquery' in parsed) {
                        throw new Error(`Subqueries not accepted inside array value [${value}]`);
                    }
                }
                if (statyc.length > 0 && params.length > 0) {
                    throw new Error(`Cannot mix static and parameter values inside array value [${value}]`);
                }
                if (params.length > 0) {
                    return { param: params, param_is_deep: params.some(p => p.includes('.')) }
                }
                else {
                    return { static: statyc }
                }
            }
            else {
                // Parameter
                if ('.' in value) {
                    return { param: value['.'], param_is_deep: value['.'].includes('.') }
                }
                // Path Parameter
                else if ('$' in value) {
                    return { param_with_$: value['$'] }
                }
                // Sub-Query
                return { subquery: await this.parseSubQuery(value, parsedKey, meta, select) };
            }
        }

        // Static value
        else {
            return { static: value };
        }
    }

    private async parseSubQuery(value: Record<string, any>, parsedKey: ParsedKey, meta: NQL_QueryMeta, select?: string, tenancy = false) {

        const union: NQL_Union = {
            meta: {} as any,
            inters: [
                { meta: {} as any, rules: [] }
            ]
        }
        
        for (const key in value) {
            if (key.startsWith('@') || key.startsWith('or @')) {
                const refField = key.match(/(or )?@([\w:]+)\.(.*)/);
                if (!refField) {
                    throw new Error(`Invalid bucket field '${key}'`);
                }
                const [_, or, refBucket, querymodelpath] = refField;
                
                
                const module = TrxNode.getModule(this.trx);
                const subBucketTag = Tag.fromNameOrShort(module.name, 'bucket', refBucket);
                const subBucketRef = await Daemon.getBucketReference(module.name, module.daemon!, subBucketTag);
                if (!subBucketRef) {
                    throw new Error(`Bucket '${subBucketRef}' not found on module`);
                }
                subBucketRef.query.scope = this.scope_by_tag ? this.tag.full : subBucketRef.query.scope;

                const field = $BucketModel.getFields(subBucketRef.schema.model, querymodelpath);
                if (!field) {
                    throw new Error(`Field '${querymodelpath}' not found on bucket '${subBucketRef.schema.name}'`);
                }

                // The union belongs to the sub scope.
                const refInter = await this.parseUnion(subBucketRef, value[key], querymodelpath, tenancy);

                const rule: NQL_Rule = {
                    // This rule belongs to the parent scope.
                    meta: { ...meta },
                    select,
                    querymodelpath: parsedKey.querymodelpath!,
                    querymodelpath_is_deep: parsedKey.querymodelpath!.includes('.'),
                    case_i: parsedKey.case_i!,
                    not: parsedKey.not!,
                    op: parsedKey.op!,
                    value: {
                        subquery: { union: refInter, bucket: subBucketRef.schema, select: querymodelpath }
                    }
                }

                if (!or) {
                    union.inters[0].rules.push(rule);
                }
                else {
                    union.inters.push({ meta: {} as any, rules: [rule] });
                }
            }
        }

        if (!union.inters[0]?.rules.length) {
            union.inters.splice(0,1);
        }

        // // Regroup inter rules by scope
        // // Also, transfer "select" from subquery to scope rule
        // for (const inter of union.inters) {
        //     const rulesByScope: Record<string, NQL_Rule[]> = {}
        //     for (const rule of inter.rules) {
        //         const union = (rule as any).value.subquery as NQL_Union;
        //         rulesByScope[union.meta.scope!] ??= []
        //         rulesByScope[union.meta.scope!].push(rule as NQL_Rule);
        //     }
            
        //     inter.rules = Object.values(rulesByScope).map(rules => {
        //         const rule = rules[0];
                
        //         return {
        //             ...rule,
        //             value: {
        //                 subquery: {
        //                     meta: { ...(rule.value as any).subquery.meta },
        //                     inters: rules.map(c =>
        //                         (c.value as any).subquery.inters
        //                     ).flat(1)
        //                 }
        //             }
        //         }
        //     })
            
        // }


        return { union, bucket: undefined as any, select: undefined as any }
    }

    // Cleanup

    /**
     * Depth-first search on the tree:
     * - Collapses single-child Unions
     * - Accumulate avgTime over tree nodes, for building multi-tree
     */
    private simplify() {

        const stack: [NQL_Node, number][] = [[this.root,-1]];

        
        while (stack.length) {
            const node = stack.at(-1)!;
            const parent = stack.at(-2) as [NQL_Intersection|NQL_Rule, number] | undefined;
        
            // Union
            if ('inters' in node[0]) {
                // Union has no child and a parent, should be removed
                if (node[0].inters.length == 0 && parent) {
                    (parent[0] as any).rules.splice(parent[1], 1); // TODO: investigate 'as any'
                    stack.pop();
                    parent[1]--;
                    continue;
                }
                // Union has a single child and a parent, should be collapsed
                if (node[0].inters.length == 1 && parent) {
                    // Parent is a Intersection
                    if ('rules' in parent[0]) {
                        const inter = node[0].inters[0];
                        parent[0].rules.splice(parent[1], 1, ...inter.rules);
                        stack.pop();
                        parent[1]--;
                        continue;
                    }
                }
                // Iterate
                node[1]++;
                const next = node[0].inters[node[1]];
                if (next) stack.push([next, -1]);
                else {
                    if (parent) {
                        // Add union time to parent
                        parent![0].meta.avgTime = (parent![0].meta.avgTime || 0) + node[0].meta.avgTime;
                    }
                    stack.pop();
                }
                continue;
            }
            // Intersection
            else if ('rules' in node[0]) {
                // Intersection has no rule and a parent, should be removed
                if (node[0].rules.length == 0 && parent) {
                    (parent[0] as any).inters.splice(parent[1], 1); // TODO: investigate 'as any'
                    stack.pop();
                    parent[1]--;
                    continue;
                }
                // Iterate
                node[1]++;
                const next = node[0].rules[node[1]];
                if (next) stack.push([next, -1]);
                else {
                    // Add inter time to union
                    parent![0].meta.avgTime = (parent![0].meta.avgTime || 0) + node[0].meta.avgTime;
                    stack.pop();
                }
                continue;
            }
            // Rule
            else {
                // Iterate
                if ('subquery' in node[0].value && node[1] < 0) {
                    node[1]++;
                    const next = node[0].value.subquery.union;
                    stack.push([next, -1]);
                }
                else {
                    // Add rule time to inter
                    parent![0].meta.avgTime = (parent![0].meta.avgTime || 0) + node[0].meta.avgTime;
                    stack.pop();
                }
                continue;
            }
        }

    }
    
    // Pretty Print

    public _addDebugId() {
        let id = 0; 
        const addIndex = (node: NQL_Node) => {
            node._debug_id = id++;

            if ('inters' in node) {
                node.inters.forEach(inter => {
                    addIndex(inter)
                })
            }
            else if ('rules' in node) {
                node.rules.forEach(rule => {
                    addIndex(rule)
                })
            }
            else if ('value' in node) {
                if ('subquery' in node.value) {
                    addIndex(node.value['subquery'].union)
                }
            }
        }
        addIndex(this.root);
    }

    public describeNQL() {
        let str = '';
        str += colored('◆ NQL:\n', 'lightblue')
        str += colored(JSON.stringify(this.query, undefined, 2), 'darkgray')
        return str;
    }

    public describe() {
        return NQL_RuleTree.describe(this.root);
    }

    public static describe(node: NQL_Node, d=0) {
        let str = '';
        
        // Union
        if ('inters' in node) {
            str += Array(d).fill('  ').join('') 
                + colored(`└ ${node._debug_id || ''}[OR] `, 'lightpurple')
                + colored(`${node.meta.scope || ''} ${node.meta.avgTime || '?'}ms `, 'black')
                + (node.sort ? ` sort by ${node.sort?.map(s => s.key+'@'+s.dir)}` : '')
                + '\n';
            node.inters.forEach(inter => {
                str += this.describe(inter, d+1)
            })
        }
        // Intersection
        else if ('rules' in node) {
            str += Array(d).fill('  ').join('')
                + colored(`└ ${node._debug_id || ''}[AND] `, 'lightblue')
                + colored(`${node.meta.scope || ''} ${node.meta.avgTime || '?'}ms `, 'black')
                + '\n';
            node.rules.forEach(rule => {
                str += this.describe(rule, d+1)
            })
        }
        // Rule
        else if ('value' in node) {
            str += Array(d).fill('  ').join('') 
                + colored(`└ ${node._debug_id || ''}[if] `, 'lightcyan')
                + colored(node.select ? '(⊹ '+node.select+') ': '', 'brown')
                + colored(`${node.meta.scope || ''} ${node.meta.avgTime || '?'}ms `, 'black')
                + `@${node.meta.schema?.name}.${node.querymodelpath}${node.not ? ' not' : ''} ${node.case_i ? '~':''}${node.op}`
                + (
                    ('static' in node.value) ? ` ${node.value.static}`
                        : ('param' in node.value) ? ` ->${node.value.param}`
                            : ('param_with_$' in node.value) ? ` ->>${node.value.param_with_$}`
                                : ' ▼ '+colored('('+node.value.subquery.bucket.name+'.'+node.value.subquery.select+')', 'brown')
                )
                + '\n';
            if ('subquery' in node.value) {
                str += this.describe(node.value['subquery'].union, d+1)
            }
        }

        return str;
    }
}

/**
 * Builds a NQL_CompiledQuery by splitting it into multiple parts
 */
/**
 * @category NQL
 * */
export class NQL_Compiler {

    public static async build(
        trx: AnyTrxNode,
        bucket: Tag,
        query: NQL_AnyQuery,
        tenancy?: boolean,
        scope_by_tag = false
    ) {
        const tree = new NQL_RuleTree(trx, bucket, query, scope_by_tag, tenancy);
        return this.buildTree(tree);
    }

    public static async buildTree(tree: NQL_RuleTree): Promise<NQL_CompiledQuery> {
        await tree.parse();
        const union = tree.root;

        // const debugLog: string[] = [];

        // Create top-level part
        const parts: NQL_Part[] = [{
            i: 0,
            many: true,
            union: {} as any
        }];
        const orderedParts: NQL_Part[] = [];
        
        // Stacks used on process
        const stack: [NQL_Node, number][] = [[union,-1]];
        const buildStack: NQL_Node[] = [parts[0].union];
        const partStack: NQL_Part[] = [parts[0]];

        // Sort union children by avgTime before iterating
        union.inters.sort((a,b) => a.meta.avgTime - b.meta.avgTime);
        
        while (stack.length) {
            const node = stack.at(-1)!;
            // debugLog.push('⇢ ' + node[0]._debug_id);

            // Union
            if ('inters' in node[0]) {
                const union = node[0];

                // Rebuild union
                const buildNode = buildStack.at(-1) as NQL_Union;
                if (node[1] < 0) {
                    const build: NQL_Union = {
                        ...union,
                        inters: Array.from(Array(union.inters.length), _ => ({})) as any
                    };
                    Object.assign(buildNode, build);
                }
                
                // Iterate inter
                node[1]++;
                const next = union.inters[node[1]];
                const buildNext = buildNode.inters[node[1]];
                if (next) {
                    // Sort union children by avgTime before iterating
                    next.rules.sort((a,b) => a.meta.avgTime - b.meta.avgTime);
                    
                    // Union → Intersection
                    stack.push([next, -1]);
                    buildStack.push(buildNext);
                    continue;
                }
            }
            // Intersection
            else if ('rules' in node[0]) {
                const inter = node[0];

                // Rebuild inter
                const buildNode = buildStack.at(-1) as NQL_Intersection;
                if (node[1] < 0) {
                    const build: NQL_Intersection = {
                        ...inter,
                        rules: Array.from(Array(inter.rules.length), _ => ({})) as any
                    };
                    Object.assign(buildNode, build);
                }

                // Iterate
                node[1]++;
                const next = inter.rules[node[1]];
                const buildNext = buildNode.rules[node[1]];
                if (next) {
                    // Sort children by avgTime before iterating
                    if ('value' in next) {
                        if ('subquery' in next.value) {
                            next.value.subquery.union.inters.sort((a,b) => a.meta.avgTime - b.meta.avgTime);
                        }
                    }
                    else {
                        next.inters.sort((a,b) => a.meta.avgTime - b.meta.avgTime);
                    }

                    // Intersection → Condition
                    stack.push([next, -1]);           
                    buildStack.push(buildNext);
                    continue;
                }
            }
            // Rule
            else {
                const rule = node[0];
                const buildNode = buildStack.at(-1) as NQL_Rule;
                
                // Divergent Scope: A subquery scope doesn't match the
                // rule scope, create new Part and Replace with Parameter
                if (node[1] < 0 && 'subquery' in rule.value) {
                    const union = rule.value.subquery.union;
                    if (rule.meta.scope !== union.meta.scope) {
                        
                        // Start new Part
                        const newPart: NQL_Part = {
                            i: parts.length,
                            many: (rule.op === 'in' || rule.op === 'contains_any'),
                            union: {
                                ...union,
                                inters: Array.from(Array(union.inters.length), _ => ({})) as any
                            },
                            parent: partStack.at(-1),
                            select: rule.value.subquery.select
                        }

                        // debugLog.push('+ [part] ' + newPart.i);

                        parts.push(newPart);
                        partStack.push(newPart);

                        // Make part the one being built
                        Object.assign(buildNode, {
                            ...rule,
                            value: { subquery: { union: newPart.union, select: rule.value.subquery.select } }
                        });

                        // Add part to original rule, to remove it
                        // from the stack once we're done (&1)
                        rule.part = newPart.i;

                        // Also add part to built rule, for easier reference
                        // when running.
                        buildNode.part = newPart.i;
                    }
                    
                }

                // Rebuild rule, if not a divergent scope
                let rebuild: NQL_Rule | undefined = undefined;
                if (node[1] < 0 && !rule.part) {
                    rebuild = {
                        ...rule
                    };
                    if ('subquery' in rebuild.value) {
                        rebuild.value = { subquery: {
                            union: {} as any,
                            bucket: rebuild.value.subquery.bucket,
                            select: rebuild.value.subquery.select
                        }};
                    }
                    Object.assign(buildNode, rebuild);
                }

                // Iterate
                if ('subquery' in rule.value && node[1] < 0) {
                    node[1]++;
                    const next = rule.value.subquery.union;
                    const secNext = (buildNode.value as any)?.subquery.union;

                    // Sort children by avgTime before iterating
                    next.inters.sort((a,b) => a.meta.avgTime - b.meta.avgTime);

                    // Rule → Union
                    stack.push([next, -1]);         
                    buildStack.push(secNext);
                    continue;
                }
                else {
                    // Close part (&1)
                    if (rule.part) {
                        // Rebuild Union on original tree as Condition
                        buildNode.value = { param: `%__${rule.part}__%`, param_is_deep: false }

                        if (rule.part == partStack.at(-1)!.i) {
                            // debugLog.push('⊙ [part] ' + rule.part);
                            orderedParts.push(parts[rule.part])
                            partStack.pop();
                        }
                    }
                }
            }
            stack.pop();
            buildStack.pop();
            // debugLog.push('↑ ' + node[0]._debug_id);
        }

        return new NQL_CompiledQuery([...orderedParts, parts[0]], tree.memory_only);
    }

}

/**
 * A query ready to be run by the NQL engine, which will call
 * each NQLRunner with a different adapter
 */
/**
 * @category NQL
 * */
export class NQL_CompiledQuery {
    
    public parts: Record<number, NQL_Part> = {}
    public execOrder: number[] = []
    
    constructor(
        parts: NQL_Part[],
        public memoryOnly: boolean
    ) {
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            this.execOrder.push(part.i);
            this.parts[part.i] = part;
        }
    }

    // Pretty Print   

    public describe() {
        let str = '';
        for (let i = 0; i < this.execOrder.length; i++) {
            const part = this.parts[this.execOrder[i]];

            str += colored(`- Part ${part.i}\n`, 'lightpurple')
            str += colored(part.many ? 'many ' : 'one ', 'green')
            str += part.parent ? colored(`[child of ${part.parent.i}]\n`, 'brown') : '\n'
            str += NQL_RuleTree.describe(part.union)
            str += '\n'
        }
        return str;
    }
}

export class NQL_Decompiler {
    public static decompile(part: NQL_Part, params: Record<string, any>[], param_templates: Record<string, string>[]) {

        const _union = (union: NQL_Union, param: Record<string, any>, param_template: Record<string, string>, target: NQL_AnyQuery) => {
            for (let i = 0; i < union.inters.length; i++) {
                const inter = union.inters[i];
    
                const key = '#or' + Array.from({ length: i }).map(i => ' ').join('');
                target[key] = {};
                target = target[key];
    
                for (let j = 0; j < inter.rules.length; j++) {
                    const rule = inter.rules[j];
                    if ('querymodelpath' in rule) {
                        const key = `${rule.querymodelpath} ${rule.not ? 'not ' : ''}${rule.op}`;
                        let value;
                        if ('static' in rule.value) {
                            value = rule.value.static
                        }
                        else if ('param' in rule.value) {
                            value = typeof rule.value.param === 'string'
                                ? param[rule.value.param]
                                : rule.value.param.map(p => param[p])
                        }
                        else if ('param_with_$' in rule.value) {
                            let path = rule.value.param_with_$
                            for (const key in param_template) {
                                path = path.replace(new RegExp(key.replace('$','\\$'), 'g'), param_template[key]);
                            }
                            value = param[path];
                        }
                        else if ('subquery' in rule.value) {
                            const sq = rule.value.subquery;
                            const subquery_key = `@${sq.bucket.module}::${sq.bucket.name}.${sq.select}`
                            
                            value = {
                                [subquery_key]: {}
                            }
                            _union(sq.union, param, param_template, value[subquery_key]);
                        }
                        target[key] = value;
                    }
                    else {
                        const key = '#and' + Array.from({ length: j }).map(i => ' ').join('');
                        target[key] = {}
                        _union(rule, param, param_template, target[key]);
                    }
                }
            }
        }
        const query: NQL_AnyQuery = {};
        let i = 0;
        for (const param of params) {
            for (const param_template of param_templates) {
                const q: NQL_AnyQuery = {};
                _union(part.union, param, param_template, q);
                const key = '#or' + Array.from({ length: i }).map(i => ' ').join('');
                query[key] = q;
                i++;
            }
        }

        return query;
    }
}