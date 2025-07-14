import { $Bucket } from '~/elements';
import { NQL_AnyQuery, NQL_Union, NQL_Operation, NQL_QueryMeta, NQL_Part, NQL_Rule, NQL_Intersection, NQL_Node } from './nql.schema';
import { $BucketModel, $BucketModelField, $BucketModelFieldType } from '../model/bucket_model.schema';
import { colored } from '~/engine/util/string';
import { AnyModule } from '~/engine/module';
import { AnyBucket } from '../bucket';

// Intermediate Types

type ParsedKey = {
    type: 'order' | 'and' | 'or' | 'graphlink' | 'fieldpath',
    
    link?: string
    linkBucket?: $Bucket
    
    or?: boolean
    fieldpath?: string
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
        'float': ['<', '<=', '==', '>', '>=', 'in', 'present'],
        'int': ['<', '<=', '==', '>', '>=', 'in', 'present'],
        'string': ['==', 'contains', 'contains_any', 'in', 'present'],
        'obj': ['contains_any', 'in', 'present'],
        'list': ['contains', 'contains_any', 'present'],
        'union': [],
        'unknown': ['present']
    }

    public root: NQL_Union

    constructor(
        private module: AnyModule,
        private bucketName: string,
        private query: NQL_AnyQuery,
        private debug = false
    ) {
        const bucket = module.buckets[this.bucketName] as AnyBucket;

        this.root = this.parseUnion(bucket, query)
        if (debug) {
            console.log(this.describe());
        }
        
        this.simplify();
        this._addDebugId()
        if (debug) {
            console.log(this.describe());
        }
    }

    // Parse NQL

    private parseUnion(bucket: AnyBucket, query: NQL_AnyQuery, select?: string): NQL_Union {
        const meta = bucket.getQueryMeta()
        const union: NQL_Union = {
            meta: {
                ...meta,
                avgTime: 0
            },
            inters: [
                { meta: {} as any, rules: [] }
            ]
        }

        for (const key in query) {
            const value = query[key];
            const parsedKey = this.parseKey(bucket, key);

            // Fieldpath term -> Condition
            if (parsedKey.type === 'fieldpath') {
                const parsed = this.parseValue(value, parsedKey, meta, select)
                
                const rule: NQL_Rule | NQL_Union =
                    ('subquery' in parsed)
                        ? parsed.subquery
                        : {
                            meta: { ...meta },
                            select,
                            fieldpath: parsedKey.fieldpath!,
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
            // else if (parsedKey.type === 'graphlink') {
            //     parsedValue = this.parseExpression(parsedKey.linkBucket!, value)
            // }
            else if (parsedKey.type === 'and') {
                const subInter = this.parseUnion(bucket, value, select)
                union.inters[0].rules.push(subInter);
            }
            else if (parsedKey.type === 'or') {
                const subInter = this.parseUnion(bucket, value, select)
                union.inters.push({ meta: {} as any, rules: [subInter] });
            }
            else if (parsedKey.type === 'order') {
                union.order = this.parseOrder(bucket, value)
            }

        }

        if (!union.inters[0]?.rules.length) {
            union.inters.splice(0,1);
        }

        return union
    }
    
    private parseOrder(bucket: AnyBucket, value: any): NQL_Union['order'] {

        let by = value['by'];
        if (by) {
            for (const key of by) {
                const fields = $BucketModel.getField(bucket.schema.model, key);
                if (!fields.length) {
                    throw new Error(`Field '${key}' not found on bucket '${bucket.schema.name}'`);
                }
                for (const field of fields) {
                    if (![
                        'date', 'datetime', 'duration', 'decimal', 'enum', 'float', 'int', 'string'
                    ].includes(field.type)) {
                        throw new Error(`Field '${key}' is not sortable`);
                    }
                }
            }
        }
        else {
            by = [];
        }

        let dir = value['dir'];
        if (dir) {
            for (const key of dir) {
                if (key !== 'asc' && key !== 'desc') {
                    throw new Error(`Invalid query order direction '${key}', expected 'asc'|'desc'`);
                }
            }
        }
        else {
            dir = [];
        }
        
        return { by, dir: dir }
    }
    
    private parseKey(bucket: AnyBucket, key: string): ParsedKey {
        if (key === '#order') {
            return  { type: 'order' }
        }
        else if (key.startsWith('#and')) {
            return  { type: 'and' }
        }
        else if (key.startsWith('#or')) {
            return  { type: 'or' }
        }
        else if (key.startsWith('*')) {
            const linkName = key.slice(1);
            const link = bucket.schema.graph.links[linkName];
            if (!link) {
                throw new Error(`Graph Link '${link}' doesn't exist on the bucket ${bucket}`);
            }
            const linkBucket = this.module.buckets[link.bucket.refName].schema as $Bucket;
            if (!linkBucket) {
                throw new Error(`Graph Link '${link}' points to a bucket '${link.bucket}' not found on the module ${this.module.name}`);
            }

            return  { type: 'graphlink', link: link.name, linkBucket }
        }
        else {
            const term = key.match(/^(or )?([\w|.|*]+)( not)? ?(~)?(.*)$/);
            if (!term) {
                throw new Error(`Invalid term '${key}'`);
            }
            const [_, or, fieldpath, not, case_i, op] = term;
            const fields = $BucketModel.getField(bucket.schema.model, fieldpath);
            if (!fields.length) {
                throw new Error(`Field '${fieldpath}' not found on bucket '${bucket.schema.name}'`);
            }
            const _op = this.parseOp(bucket.schema.name, fields, op);

            return  { type: 'fieldpath', or: !!or, fieldpath, not: !!not, case_i: !!case_i, op: _op as any }
        }
    }

    private parseOp(bucketName: string, fields: $BucketModelField[], op: string): NQL_Operation {
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

    private parseValue(value: any, parsedKey: ParsedKey, meta: NQL_QueryMeta, select?: string): NQL_Rule['value'] {

        if (typeof value === 'object') {
            // Array
            if (Array.isArray(value)) {
                const statyc: any[] = []
                const params: string[] = []

                for (const item of value) {
                    const parsed = this.parseValue(item, parsedKey, meta, select);
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
                    return { param: params }
                }
                else {
                    return { static: statyc }
                }
            }
            else {
                // Parameter
                if ('.' in value) {
                    return { param: value['.'] }
                }
                // Sub-Query
                return { subquery: this.parseSubQuery(value, parsedKey, meta, select) };
            }
        }

        // Static value
        else {
            return { static: value };
        }
    }

    private parseSubQuery(value: Record<string, any>, parsedKey: ParsedKey, meta: NQL_QueryMeta, select?: string): NQL_Union  {

        const union: NQL_Union = {
            meta: {} as any,
            inters: [
                { meta: {} as any, rules: [] }
            ]
        }

        for (const key in value) {
            if (key.startsWith('@') || key.startsWith('or @')) {
                const refField = key.match(/(or )?@(\w+)\.(.*)/);
                if (!refField) {
                    throw new Error(`Invalid bucket field '${key}'`);
                }
                const [_, or, refBucket, fieldpath] = refField;
                
                const bucket = this.module.buckets[refBucket] as AnyBucket;
                if (!bucket) {
                    throw new Error(`Bucket '${bucket}' not found on module`);
                }
                const field = $BucketModel.getField(bucket.schema.model, fieldpath);
                if (!field) {
                    throw new Error(`Field '${fieldpath}' not found on bucket '${bucket.schema.name}'`);
                }

                const refInter = this.parseUnion(bucket, value[key], fieldpath);

                const rule: NQL_Rule = {
                    meta: { ...meta },
                    select,
                    fieldpath: parsedKey.fieldpath!,
                    case_i: parsedKey.case_i!,
                    not: parsedKey.not!,
                    op: parsedKey.op!,
                    value: {
                        subquery: refInter
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


        return union
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
                    continue;
                }
                // Union has a single child and a parent, should be collapsed
                if (node[0].inters.length == 1 && parent) {
                    // Parent is a Intersection
                    if ('rules' in parent[0]) {
                        const inter = node[0].inters[0];
                        parent[0].rules.splice(parent[1], 1, ...inter.rules);
                        stack.pop();
                        stack.push([inter,-1]);
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
                    const next = node[0].value.subquery;
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
                    addIndex(node.value['subquery'])
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
                + (node.order ? ` order by ${node.order.by} ${node.order.dir}` : '')
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
                + `@${node.meta.bucket?.name}.${node.fieldpath}${node.not ? ' not' : ''} ${node.case_i ? '~':''}${node.op}`
                + (
                    ('static' in node.value) ? ` ${node.value.static}`
                        : ('param' in node.value) ? ` ->${node.value.param}`
                            : ' ▼'
                )
                + '\n';
            if ('subquery' in node.value) {
                str += this.describe(node.value['subquery'], d+1)
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

    public static build(module: AnyModule, bucketName: string, query: NQL_AnyQuery) {
        const tree = new NQL_RuleTree(module, bucketName, query);
        return this.buildUnion(tree.root);
    }

    public static buildUnion(union: NQL_Union): NQL_CompiledQuery {

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
                            next.value.subquery.inters.sort((a,b) => a.meta.avgTime - b.meta.avgTime);
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
                    const union = rule.value.subquery;
                    if (rule.meta.scope !== union.meta.scope) {
                        
                        // Start new Part
                        const newPart: NQL_Part = {
                            i: parts.length,
                            many: (rule.op === 'in' || rule.op === 'contains_any'),
                            union: {
                                ...union,
                                inters: Array.from(Array(union.inters.length), _ => ({})) as any
                            },
                            parent: partStack.at(-1)
                        }

                        // debugLog.push('+ [part] ' + newPart.i);

                        parts.push(newPart);
                        partStack.push(newPart);

                        // Make part the one being built
                        Object.assign(buildNode, {
                            ...rule,
                            value: { subquery: newPart.union }
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
                        rebuild.value = { subquery: {} as any };
                    }
                    Object.assign(buildNode, rebuild);
                }

                // Iterate
                if ('subquery' in rule.value && node[1] < 0) {
                    node[1]++;
                    const next = rule.value.subquery;
                    const secNext = (buildNode.value as any)?.subquery;

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
                        buildNode.value = { param: `%__${rule.part}__%`}

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

        return new NQL_CompiledQuery([...orderedParts, parts[0]]);
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
        parts: NQL_Part[]
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