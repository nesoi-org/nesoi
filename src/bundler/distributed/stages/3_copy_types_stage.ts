import * as fs from 'fs';
import * as path from 'path';
import { AnySpace, Space } from '~/engine/space';
import { Log } from '~/engine/util/log';
import { NameHelpers } from '~/engine/util/name_helpers';
import { App } from '~/engine/app/app';
import { DistributedApp } from '~/engine/app/native/distributed.app';
import { DistributedBundler } from '../distributed.bundler';
import { DistributedNodeApp } from '~/engine/app/native/distributed_node.app';

/**
 * [distributed Compiler Stage #3]
 * Copy type declarations to build/types folder
 * 
 * @category distributed Compiler
 * @subcategory Stages
 */
export class CopyTypesStage {
    
    public constructor(
        private bundler: DistributedBundler,
        private app: DistributedApp<any, any>
    ) {}

    public async run() {
        
        const { compiler, dirs: _dirs } = this.bundler;
        
        for (const name in this.app.nodes) {
            Log.info('compiler', 'distributed', `[${name}] Copying module and space types from .nesoi to build/types folder...`)

            const node = (this.app.nodes as any)[name] as DistributedNodeApp<any, any, any, any>;
            const dirs = _dirs.nodes[name];
            const info = App.getInfo(node);

            // Copy module types to types folder
            for (const name of info.spaceModules) {
                const module = compiler.modules[name as string];
                const from = Space.path(compiler.space, '.nesoi', module.lowName + '.module.ts')
                const to = path.resolve(dirs.build_types, module.lowName+'.module.ts')
                Log.debug('compiler', 'distributed', `Copying module types from ${from} to ${to}`)
                fs.cpSync(from, to, { recursive: true })
            }
    
            // Copy space type to types folder
            {
                const space = (compiler.space as any)._name as AnySpace['_name'];
                const spaceLow = NameHelpers.nameHighToLow(space);
                const from = Space.path(compiler.space, '.nesoi', spaceLow + '.ts')
                const to = path.resolve(dirs.build_types, spaceLow + '.ts')
                Log.debug('compiler', 'distributed', `Copying space types from ${from} to ${to}`)
                fs.cpSync(from, to, { recursive: true })
            }

        }

    }
    
}