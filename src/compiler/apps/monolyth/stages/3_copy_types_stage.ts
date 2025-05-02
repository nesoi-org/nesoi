import * as fs from 'fs';
import * as path from 'path';
import { AnySpace, Space } from '~/engine/space';
import { Log } from '~/engine/util/log';
import { MonolythApp } from '~/engine/apps/monolyth/monolyth.app';
import { MonolythCompiler } from '../monolyth_compiler';
import { NameHelpers } from '~/compiler/helpers/name_helpers';
import { App } from '~/engine/apps/app';

/**
 * [Monolyth Compiler Stage #3]
 * Copy type declarations to build/types folder
 * 
 * @category Monolyth Compiler
 * @subcategory Stages
 */
export class CopyTypesStage {
    
    public constructor(
        private monolyth: MonolythCompiler,
        private app: MonolythApp<any, any>
    ) {}

    public async run() {
        Log.info('compiler', 'monolyth', 'Copying module and space types from .nesoi to build/types folder...')

        const { compiler, dirs } = this.monolyth;

        const info = App.getInfo(this.app);

        // Copy module types to types folder
        for (const key of info.spaceModules) {
            const module = compiler.modules[key as string];
            const from = Space.path(compiler.space, '.nesoi', module.lowName + '.module.ts')
            const to = path.resolve(dirs.build_types, module.lowName+'.module.ts')
            Log.debug('compiler', 'monolyth', `Copying module types from ${from} to ${to}`)
            fs.cpSync(from, to, { recursive: true })
        }

        // Copy space type to types folder
        {
            const space = (compiler.space as any)._name as AnySpace['_name'];
            const spaceLow = NameHelpers.nameHighToLow(space);
            const from = Space.path(compiler.space, '.nesoi', spaceLow + '.ts')
            const to = path.resolve(dirs.build_types, spaceLow + '.ts')
            Log.debug('compiler', 'monolyth', `Copying space types from ${from} to ${to}`)
            fs.cpSync(from, to, { recursive: true })
        }
    }
    
}