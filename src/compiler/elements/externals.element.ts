import { Element } from './element';
import { SchemaDumper } from '../schema';
import { t } from '../types/type_compiler';
export class ExternalsElement extends Element<$Externals> {

    // Schema

    public dumpSchema() {
        return `const ${this.interface.name} = ${SchemaDumper.dump(this.schema)}\n`
           + `export default ${this.interface.name}`;
    }

    // Interface

    public buildInterfaces() {
        this.interface
            .extends('$Externals')
            .set({
                module: t.literal(this.module),
                name: t.literal(this.schema.name),
                values: t.obj(Object.fromEntries(
                    Object.keys(this.schema.values).map(k => [k, t.tag()])
                )),
                enums: t.obj(Object.fromEntries(
                    Object.keys(this.schema.enums).map(k => [k, t.tag()])
                )),
                buckets: t.obj(Object.fromEntries(
                    Object.keys(this.schema.buckets).map(k => [k, t.tag()])
                )),
                messages: t.obj(Object.fromEntries(
                    Object.keys(this.schema.messages).map(k => [k, t.tag()])
                )),
                jobs: t.obj(Object.fromEntries(
                    Object.keys(this.schema.jobs).map(k => [k, t.tag()])
                )),
                machines: t.obj(Object.fromEntries(
                    Object.keys(this.schema.machines).map(k => [k, t.tag()])
                )),
            })
    }

    public getModuleDependencies() {
        const externalModules: Set<string> = new Set();

        Object.values(this.schema.buckets).forEach(ref => {
            externalModules.add(ref.module);
        })
        Object.values(this.schema.messages).forEach(ref => {
            externalModules.add(ref.module);
        })
        Object.values(this.schema.jobs).forEach(ref => {
            externalModules.add(ref.module);
        })

        // Add imports for external elements
        this.compiler.modules[this.module].elements.forEach(el => {
            el.dependencies.forEach(dep => {
                if (dep.tag.module !== this.tag.module) {
                    externalModules.add(dep.tag.module);
                }
            })
        })

        return Array.from(externalModules);
    }

}