import { Element } from './element';
import type { Compiler } from '../compiler';
import type { ResolvedBuilderNode } from '~/engine/dependency';
import type { ObjTypeNode, TypeCompiler} from '../types/type_compiler';
import { t, TypeInterface } from '../types/type_compiler';
import { NameHelpers } from '~/engine/util/name_helpers';
import type { $Bucket, $BucketGraphLinks, $BucketViews, $BucketViewFields, $BucketViewFieldOp } from 'index';

export class BucketElement extends Element<$Bucket> {


    constructor(
        protected compiler: Compiler,
        protected types: TypeCompiler,
        protected module: string,
        public $t: string,
        public files: string[],
        public schema: $Bucket,
        public dependencies: ResolvedBuilderNode[],
        public inlineRoot?: ResolvedBuilderNode,
        public bridge?: ResolvedBuilderNode['bridge']
    ) {
        super(compiler, module, $t, files, schema, dependencies, inlineRoot, bridge);
    }

    // Schema

    protected prepare() {
        this.schema['#data'] = Element.Never;
        this.schema['#composition'] = Element.Never;
        this.schema['#defaults'] = Element.Never;
        this.prepareGraph(this.schema.graph.links);
        this.prepareViews(this.schema.views);
    }

    private prepareGraph(links: $BucketGraphLinks) {
        Object.values(links).forEach(field => {
            field['#bucket'] = Element.Never;
            field['#many'] = Element.Never;
        });
    }

    private prepareViews(views: $BucketViews) {
        Object.values(views).forEach(view => {
            view['#data'] = Element.Never;
            this.prepareViewFields(view.fields);
        });
    }

    private prepareViewFields(fields: $BucketViewFields) {
        Object.values(fields).forEach(field => {
            field['#data'] = Element.Never;
            this.prepareViewOps(field.ops);
        });
    }

    private prepareViewOps(ops: $BucketViewFieldOp[]) {
        Object.values(ops).forEach(op => {
            if (op.type === 'subview') {
                this.prepareViewFields(op.children);
            }
            else if (op.type === 'map') {
                this.prepareViewOps(op.ops);
            }
        });
    }

    protected customSchemaImports(nesoiPath: string) {
        // TODO: only include this import if there are computed fields or transform ops
        return `import { $BucketViewFieldFn } from '${nesoiPath}/lib/elements/entities/bucket/view/bucket_view.schema';\n`
    }

    // Interfaces

    protected buildInterfaces() {

        const model = this.types.bucket.models[this.tag.short];
        this.child_interfaces = [
            new TypeInterface(this.highName)
                .set(model.children)
        ]

        const composition = this.makeComposition();
        const defaults = this.makeDefaults();
        const graph = this.makeGraph();
        const views = this.makeViews();

        this.child_interfaces.push(graph.interface);
        this.child_interfaces.push(...views.interfaces);

        this.interface
            .extends('$Bucket')
            .set({
                '#data': t.ref(this.highName),
                '#composition': composition,
                '#defaults': defaults,
                graph: graph.type,
                views: views.type
            })
    }

    private makeComposition() {
        const type = t.obj({});
        Object.entries(this.schema.graph.links).forEach(([key, link]) => {
            if (link.rel !== 'composition') return;

            type.children[key] = t.obj({
                bucket: t.bucket(link.bucket),
                many: t.ref(link.many ? 'true' : 'false'),
                optional: t.ref(link.optional ? 'true' : 'false')
            })
        })
        return type;
    }
    
    private makeDefaults() {
        const type = t.obj({});
        Object.entries(this.schema.model.fields).forEach(([key, field]) => {
            if (!field.defaultValue) return;
            type.children[key] = t.dynamic(field.defaultValue)
        })
        return type;
    }
    
    private makeGraph() {
        const type = t.obj({
            links: t.obj({})
        });

        Object.entries(this.schema.graph.links).forEach(([key, link]) => {
            (type.children.links as ObjTypeNode).children[key] = t.obj({
                '#bucket': t.schema(link.bucket),
                '#many': t.dynamic(link.many),
                name: t.literal(link.name),
                rel: t.literal(link.rel),
                optional: t.dynamic(link.optional)
            })
        })

        const _interface = new TypeInterface(this.interface.name+'Graph')
            .extends('$BucketGraph')
            .set(type.children);

        return {
            interface: _interface,
            type: t.ref(_interface.name)
        }
    }
    
    private makeViews() {
        const interfaces: TypeInterface[] = [];
        const type = t.obj({});

        Object.entries(this.schema.views).map(([key, view]) => {
            const view_name = NameHelpers.nameLowToHigh(view.name);
            
            const _interface = new TypeInterface(`${this.highName}${view_name}View`)
                .extends('$BucketView')
                .set({
                    '#data': this.types.bucket.views[`${this.tag.short}#${view.name}`],
                    name: t.literal(view.name)
                })

            type.children[key] = t.ref(_interface.name);
            interfaces.push(_interface);
        })
        
        return { interfaces, type }
    }
    
    

}