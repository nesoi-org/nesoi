
import { t, TypeCompiler, TypeInterface } from '../types/type_compiler';
import { Tag } from '~/engine/dependency';
import type { AnySpace } from '~/engine/space';
import type { Compiler } from '../compiler';
import { NameHelpers } from '~/engine/util/name_helpers';

export class SpaceTypeCompiler {
  

    private name: string;

    constructor(
        private compiler: Compiler
    ) {
        this.name = (this.compiler.space as any)._name as AnySpace['_name'];
    }

    public compile() {

        
        const users = this.makeUsers();
        const modules = this.makeModules();

        return new TypeInterface(this.name)
            .extends('$Space')
            .set({
                users,
                modules
            })
    }

    private makeUsers() {
        const users = t.obj({});

        const types = new TypeCompiler(this.compiler.tree);
        const _authn = (this.compiler.space as any)._authn as AnySpace['_authn'];
        Object.entries(_authn)
            .forEach(([name, model]) => {
                const tag = new Tag('__nesoi', 'bucket', 'user');
                types.bucket.compile(tag, { model, fields: {} } as any)
                users.children[name] = types.bucket.models[tag.short];
            });

        return users;
    }

    private makeModules() {
        const modules = t.obj({});

        Object.keys(this.compiler.modules)
            .forEach(name => {
                const highName = NameHelpers.nameLowToHigh(name);
                modules.children[name] = t.ref(this.name+'.'+highName+'.Module');
            });

        return modules;
    }

}