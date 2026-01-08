import { NesoiRegex } from '~/engine/util/regex';
import type { ObjTypeNode, TypeCompiler, TypeNode } from './type_compiler';
import { t } from './type_compiler';

export class BucketTypeCompiler {

    public models: Record<string, ObjTypeNode> = {};
    public views: Record<string, ObjTypeNode> = {};

    constructor(
        private types: TypeCompiler
    ) {}

    async compile(tag: Tag, schema: $Bucket) {
            
        const modelType = this.buildModel(schema.model.fields);
        this.models[tag.short] = modelType;
        
        for (const name in schema.views) {
            const view = schema.views[name];
            this.views[tag.short+'#'+name] = await this.buildView(schema, view, modelType, modelType, modelType);
        }
    }

    private buildModel(fields: $BucketModelFields): ObjTypeNode {
        const children: Record<string, TypeNode> = {};
        for (const key in fields) {
            children[key] = this.buildModelField(fields[key]);
        }
        return t.obj(children);
    }

    private buildModelField(field: $BucketModelField) {
        let type = t.unknown();
    
        if (field.type === 'boolean') {
            type = t.boolean();
        }
        else if (field.type === 'date') {
            type = t.date();
        }
        else if (field.type === 'datetime') {
            type = t.datetime();
        }
        else if (field.type === 'duration') {
            type = t.duration();
        }
        else if (field.type === 'decimal') {
            type = t.decimal();
        }
        else if (field.type === 'enum') {
            const options = field.meta!.enum!.options as string[];
            if (Array.isArray(options)) {
                type = t.union(options.map(opt => t.literal(opt)))
            }
            else if (typeof options === 'object') {
                type = t.union(Object.keys(options).map(opt => t.literal(opt)))
            }
        }
        else if (field.type === 'file') {
            type = t.file();
        }
        else if (field.type === 'float') {
            type = t.number();
        }
        else if (field.type === 'int') {
            type = t.number();
        }
        else if (field.type === 'string') {
            type = t.string();
        }
        else if (field.type === 'literal') {
            const regex = field.meta!.literal!.template.toString();
            const rtype = NesoiRegex.toTemplateString(regex);
            type = t.literal(`\`${rtype}\``);
        }
        else if (field.type === 'obj') {
            type = t.obj(this.buildModel(field.children!).children);
        }
        else if (field.type === 'unknown') {
            type = t.unknown();
        }
        else if (field.type === 'dict') {
            type = t.dict(this.buildModelField(field.children!['#']))
        }
        else if (field.type === 'list') {
            type = t.list(this.buildModelField(field.children!['#']))
        }
        else if (field.type === 'union') {
            type = t.union(Object.values(field.children!).map(field => this.buildModelField(field)));
        }
        if (!field.required) {
            type = t.union([
                t.undefined(),
                type
            ]);
        }
        return type;
    }

    private buildView(bucket: $Bucket, view: $BucketView, root: ObjTypeNode, current: ObjTypeNode, value: TypeNode): ObjTypeNode {
        return this.buildViewObj(bucket, view.fields, root, current, value) as ObjTypeNode;
    }

    private buildViewObj(bucket: $Bucket, fields: $BucketViewFields, root: ObjTypeNode, current: ObjTypeNode, value: TypeNode) {
        let options: ObjTypeNode[] = [];

        if ('__inject' in fields) {
            const field = fields['__inject'];
            if (field.meta.inject!.path === 0) {
                options = [t.obj({ ...root.children })];
            }
            else if (field.meta.inject!.path === -1) {
                options = [t.obj({ ...current.children })];
            }
            else if (field.meta.inject!.path === 'value') {
                if (value.kind === 'union') {
                    if (value.options.some(opt => opt.kind !== 'obj')) {
                        throw new Error('Union contains non-object options, therefore cannot be injected');
                    }
                    options = value.options.map(opt => t.obj({ ...(opt as ObjTypeNode).children }));
                }
                else {
                    if (value.kind !== 'obj') throw new Error('Only object values can be injected');
                    options = [t.obj({ ...value.children })];
                }
            }
        }
        else {
            options = [t.obj({})]
        }

        for (const key in fields) {
            if (key === '__inject') continue;
            const child = this.buildViewField(bucket, fields[key], root, current, value);
            for (const opt of options) {
                opt.children[key] = child;
            }
        }

        if (options.length === 1) {
            return options[0];
        }
        else return t.union(options);

    }

    private buildViewField(bucket: $Bucket, field: $BucketViewField, root: ObjTypeNode, current: ObjTypeNode, value: TypeNode): TypeNode {
        let next = current;
        
        let type: TypeNode;
        if (field.type === 'model') {
            const path = field.meta.model!.path;
            type = this.getViewModelpath(current, path);
        }
        else if (field.type === 'computed') {
            // TODO
            type = t.unknown()
        }
        else if (field.type === 'query') {
            let tag;
            let many = false;
            if ('link' in field.meta.query!) {
                const link = bucket.graph.links[field.meta.query!.link];
                if (!link) {
                    throw new Error(`Invalid graph link ${field.meta.query!.link} when building type`)
                }
                tag = link.bucket;
                many = link.many;
            }
            else {
                tag = field.meta.query!.bucket;
                many = true;
            }
            
            type = t.bucket(tag, field.meta.query!.view);

            if (field.meta.query!.view) {
                next = this.views[`${tag.short}#${field.meta.query!.view}`];
            }
            else {
                next = this.models[tag.short];
            }

            if (many) {
                type = t.list(type)
            } 
        }
        else if (field.type === 'drive') {
            type = t.string()
        }
        else if (field.type === 'obj') {
            type = current
            // This is filled by the operations
        }
        else if (field.type === 'inject') {
            // previously processed
        }
        else if (field.type === 'view') {
            const view = bucket.views[field.meta!.view!.view];
            type = this.buildViewObj(bucket, view.fields, root, current, value);
        }

        type = this.applyOps(bucket, field.ops, root, next, type!);

        return type;
    }
    
    // This method should treat a viewmodelpath containing a * as returning
    // an array of the final type
    
    private getViewModelpath(obj: ObjTypeNode, path: string): TypeNode {
        const split = path.split('.');
        
        let spread = false;

        let options: TypeNode[] = [obj];
        for (let i = 0; i < split.length; i++) {
            const p = split[i];

            const next_options: TypeNode[] = [];
            
            for (const opt of options) {
                if (opt.kind === 'union') {
                    options.push(...opt.options);
                    continue;
                }

                if (p === '*') {
                    spread = true;
                }

                if (p === '*' || p.startsWith('$')) {
                    if (opt.kind === 'dict' || opt.kind === 'list') {
                        next_options.push(opt.item);
                    }
                    else if (opt.kind === 'obj') {
                        const items = Object.values(opt.children);
                        next_options.push(...items);                        
                    }
                    else {
                        throw new Error(`Invalid view modelpath ${path} when building type`)
                    }
                }
                else {
                    if (opt.kind === 'dict' || opt.kind === 'list') {
                        next_options.push(opt.item);
                    }
                    if (opt.kind !== 'obj') {
                        throw new Error(`Invalid view modelpath ${path} when building type`)
                    }
                    next_options.push(opt.children[p]);
                }

            }

            options = next_options;   
        }

        if (!options.length) {
            throw new Error(`Invalid view modelpath ${path} when building type`)
        }

        let type = options.length === 1
            ? options[0]
            : t.union(options);
        
        if (spread) {
            type = t.list(type);
        }

        return type;
    }

    private applyOps(bucket: $Bucket, ops: $BucketViewFieldOp[], root: ObjTypeNode, current: ObjTypeNode, value: TypeNode): TypeNode {

        let type: TypeNode = value;

        for (let i = 0; i < ops.length; i++) {
            const next = this.applyOp(bucket, ops[i], root, current, type);
            type = next;
        }

        return type;

    }
    
    private applyOp(bucket: $Bucket, op: $BucketViewFieldOp, root: ObjTypeNode, current: ObjTypeNode, value: TypeNode) {

        let next: TypeNode = {...value};

        if (op.type === 'map') {
            const list_value = value as Extract<TypeNode, { kind: 'list'}>;
            next = t.list(this.applyOps(bucket, op.ops, root, current, list_value.item))
            return next
        }
        else if (op.type === 'prop') {
            switch(value.kind) {
            case 'obj':
                return value.children[op.prop] ?? t.unknown()
            case 'unknown':
                next = t.unknown(); break;
            case 'primitive':
                next = t.unknown(); break;
            case 'literal':
                next = t.unknown(); break;
            case 'list':
                return value.item;
            case 'dict':
                return value.item;
            case 'union':
                next = t.union(value.options.map(opt => this.applyOp(bucket, op, root, current, opt)));
                break;
            case 'nesoi':
                next = t.unknown(); break;
            case 'bucket':
                if (value.view) {
                    next = this.views[`${value.tag.short}#${value.view}`].children[op.prop] ?? t.unknown();
                }
                else {
                    next = this.models[value.tag.short].children[op.prop] ?? t.unknown();
                }
                break;
            }
            return next
        }
        else if (op.type === 'list') {
            switch(value.kind) {
            case 'unknown':
            case 'primitive':
            case 'literal':
            case 'list':
            case 'union':
            case 'nesoi':
            case 'bucket':
                next = t.unknown();
                break;
            case 'obj':
                next = t.list(t.union(Object.values(value.children)))
                break;
            case 'dict':
                next = t.list(value.item);
                break;
            }
            return next
        }
        else if (op.type === 'dict') {
            switch(value.kind) {
            case 'unknown':
            case 'primitive':
            case 'literal':
            case 'obj':
            case 'dict':
            case 'union':
            case 'nesoi':
            case 'bucket':
                next = t.unknown();
                break;
            case 'list':
                next = t.dict(value.item);
                break;
            }
            return next
        }
        else if (op.type === 'group') {
            switch(value.kind) {
            case 'unknown':
            case 'primitive':
            case 'literal':
            case 'obj':
            case 'dict':
            case 'union':
            case 'nesoi':
            case 'bucket':
                next = t.unknown();
                break;
            case 'list':
                next = t.dict(t.list(value.item));
                break;
            }
            return next
        }
        else if (op.type === 'transform') {
            // TODO
            next = t.unknown()
            return next
        }
        else if (op.type === 'subview') {
            next = this.buildViewObj(bucket, op.children, root, current, value);
            return next
        }

        return t.unknown();
    }
}