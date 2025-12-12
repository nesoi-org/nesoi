import { NesoiRegex } from '~/engine/util/regex';
import type { ObjTypeNode, TypeCompiler, TypeNode } from './type_compiler';
import { t } from './type_compiler';
import type { Tag, $Bucket, $BucketModelFields, $BucketModelField, $BucketView, $BucketViewFields, $BucketViewField, $BucketViewFieldOp } from 'index';

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
        return this.buildViewObj(bucket, view.fields, root, current, value);
    }

    private buildViewObj(bucket: $Bucket, fields: $BucketViewFields, root: ObjTypeNode, current: ObjTypeNode, value: TypeNode) {
        const children: Record<string, TypeNode> = {};

        if ('__inject' in fields) {
            const field = fields['__inject'];
            if (field.meta.inject!.path === 0) {
                Object.assign(children, root.children);
            }
            else if (field.meta.inject!.path === -1) {
                Object.assign(children, current.children);
            }
            else if (field.meta.inject!.path === 'value') {
                if (value.kind !== 'obj') throw 'Only object values can be injected';
                Object.assign(children, value.children);
            }
        }

        for (const key in fields) {
            if (key === '__inject') continue;
            children[key] = this.buildViewField(bucket, fields[key], root, current);
        }

        return t.obj(children);

    }

    private buildViewField(bucket: $Bucket, field: $BucketViewField, root: ObjTypeNode, current: ObjTypeNode): TypeNode {
        let next = current;
        
        let type: TypeNode;
        if (field.type === 'model') {
            const path = field.meta.model!.path;
            type = this.getModelpath(current, path);
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
                    throw `Invalid graph link ${field.meta.query!.link} when building type`
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
            type = this.buildViewObj(bucket, view.fields, root, current, current);
        }

        type = this.applyOps(bucket, field.ops, root, next, type!);

        return type;
    }
    
    private getModelpath(obj: ObjTypeNode, path: string): TypeNode {
        const split = path.split('.');
        let spread = false;

        let ptrs: TypeNode[] = [obj];
        for (let i = 0; i < split.length; i++) {
            const next: TypeNode[] = [];
            
            for (const ptr of ptrs) {
                if (ptr.kind === 'union') {
                    next.push(...ptr.options);
                    continue;
                }

                const p = split[i];
    
                if (p === '*') {
                    spread = true;
                    if (ptr.kind === 'dict') {
                        next.push(ptr.item);
                    }
                    else if (ptr.kind === 'list') {
                        next.push(ptr.item);
                    }
                    else if (ptr.kind === 'obj') {
                        const items = Object.values(ptr.children);
                        next.push(...items);                        
                    }
                    else {
                        throw `Invalid modelpath ${path} when building type`
                    }
                }
                else {
                    if (ptr.kind === 'dict') {
                        next.push(ptr.item);
                    }
                    if (ptr.kind !== 'obj') {
                        throw `Invalid modelpath ${path} when building type`
                    }
                    next.push(ptr.children[p]);
                }

            }

            ptrs = next;            
        }

        if (!ptrs.length) {
            throw `Invalid modelpath ${path} when building type`
        }

        if (ptrs.length === 1) {
            if (spread) return t.list(ptrs[0]);
            return ptrs[0]
        }

        if (spread) return t.list(t.union(ptrs));
        return t.union(ptrs);
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