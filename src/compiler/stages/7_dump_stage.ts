import type { Compiler } from '../compiler';
import type { CompilerModule } from '../module';

import * as fs from 'fs';
import path from 'path';
import { Log } from '~/engine/util/log';
import type { AnySpace} from '~/engine/space';
import { Space } from '~/engine/space';

/* @nesoi:browser ignore-start */
import type { ProgressiveBuildCache } from '../progressive';
import { ProgressiveBuild } from '../progressive';
import { SpaceTypeCompiler } from '../types/space.type_compiler';
import { ModuleTypeCompiler } from '../types/module.type_compiler';
import { TypeNamespace } from '../types/type_compiler';
/* @nesoi:browser ignore-end */

/**
 * [Compiler Stage #7]
 * Dump the element schemas and types to the .nesoi folder.
 * 
 * @category Compiler
 * @subcategory Stages
 */
export class DumpStage {

    private cache!: ProgressiveBuildCache
    private hash!: ProgressiveBuildCache['hash']

    private spaceName: string;

    constructor(
        public compiler: Compiler
    ) {
        this.spaceName = (this.compiler.space as any)._name as AnySpace['_name'];
    }

    public async run() {
        Log.info('compiler', 'stage.dump', 'Dumping Schemas and Types...');
        const t0 = new Date().getTime();

        /* @nesoi:browser ignore-start */
        this.cache = await ProgressiveBuild.cache(this.compiler);
        this.hash = await ProgressiveBuild.hash(this.compiler);
        /* @nesoi:browser ignore-end */

        /* @nesoi:browser add
        this.cache = {
            nesoidir: Space.path(this.compiler.space, '.nesoi'),
            hash: {
                $: 'old',
                files: {},
                modules: {},
                space: 'old'
            },
            files: {},
            modules: {},
            types: {
                space: {},
                modules: {},
                elements: {}
            }
        }
        this.hash = 'new';
        */

        this.dumpSpace();
        
        for (const name in this.compiler.modules) {
            const module = this.compiler.modules[name];
            this.dumpModule(module);
        }

        /* @nesoi:browser ignore-start */
        // await ProgressiveBuild.save(this.compiler.space, this.cache, this.hash);
        /* @nesoi:browser ignore-end */
        
        const t = new Date().getTime();
        Log.debug('compiler', 'stage.dump', `[t: ${(t-t0)/1000} ms]`);
    }

    /* Space */

    private dumpSpace() {
        const type = new SpaceTypeCompiler(this.compiler);
        const _interface = type.compile();
        
        const spaceFile: string[] = [];
        spaceFile.push('declare global {')
        spaceFile.push('')
        spaceFile.push(_interface.dump(this.spaceName, ''))
        spaceFile.push('')
        spaceFile.push('}')
        spaceFile.push('')
        spaceFile.push('export {}')

        const dumpDir = Space.mkdir(this.compiler.space, '.nesoi', '.types');
        const spaceFilepath = path.resolve(dumpDir, 'space.d.ts');

        fs.writeFileSync(spaceFilepath, spaceFile.join('\n'));

        return type;
    }


    /* Module */

    private dumpModule(module: CompilerModule) {
        const dumpModuleDir = Space.mkdir(this.compiler.space, '.nesoi', module.lowName);
        this.dumpModuleSchemas(module, dumpModuleDir);
        
        const dumpModuleTypeDir = Space.mkdir(this.compiler.space, '.nesoi', '.types');
        this.dumpModuleType(module, dumpModuleTypeDir);
    }
    
    private dumpModuleSchemas(module: CompilerModule, dumpDir: string) {
        const nesoiPath = this.compiler.config?.nesoiPath ?? 'nesoi';
        module.elements.forEach((element) => {
            if (
                element.schema.$t === 'constants'
                || element.schema.$t === 'externals'
                || (this.hash.modules[element.schema.module].nodes[element.tag.full]
                    !== this.cache.hash.modules[element.schema.module]?.nodes[element.tag.full])
            ) {
                const filename =  path.basename(element.filepath());
                const elPath = path.resolve(dumpDir, filename);
                fs.writeFileSync(elPath, element.dumpSchema(nesoiPath));
            }
        });
    }

    private dumpModuleType(module: CompilerModule, dumpDir: string) {
        const type = new ModuleTypeCompiler(module.module.schema);
        const _interface = type.compile(this.spaceName);
        
        const moduleFile: string[] = [];        
                
        const moduleNS = new TypeNamespace(module.highName)
            .add(_interface);
        const spaceNS = new TypeNamespace(this.spaceName)
            .add(moduleNS);
        

        // Add constants first
        for (const element of module.elements) {
            if (element.$t !== 'constants') continue;
            moduleNS.add(element.child_namespace!);
            moduleNS.add(element.interface);
        }
        
        for (const element of module.elements) {
            if (element.$t === 'constants') continue;
            if (element.$t === 'externals') continue;
            for (const child_interface of element.child_interfaces) {
                moduleNS.add(child_interface);
            }
            if (element.child_namespace) {
                moduleNS.add(element.child_namespace);
            }
            moduleNS.add(element.interface);
        }

        moduleFile.push('declare ' + spaceNS.dump(this.spaceName, module.lowName));

        // // Get external modules
        // const moduleDependencies = new Set<string>();
        // // Pre-populate from cache
        // if (this.cache) {
        //     this.cache.modules[module.lowName]?.dependencies.modules.forEach(module => {
        //         if (module in this.compiler.modules) {
        //             moduleDependencies.add(module);
        //         }
        //     })
        // }
        // // Extract from updated elements
        // const externalElement = module.elements
        //     .find(el => el.$t === 'externals');
        // if (externalElement) {
        //     for (const module of (externalElement as ExternalsElement).getModuleDependencies()) {
        //         moduleDependencies.add(module);
        //     }
        // }
        // // Dump external imports
        // moduleFile.push(
        //     ...Array.from(moduleDependencies)
        //         .map(module => 
        //             `import ${NameHelpers.nameLowToHigh(module)}Module from './${module}.module'`
        //         )
        // );
        // this.cache.modules[module.lowName] ??= {
        //     dependencies: {
        //         modules: []
        //     }
        // }
        // this.cache.modules[module.lowName].dependencies.modules = Array.from(moduleDependencies);

        // // Build module type (with all elements)
        // const type = this.makeModuleType(module);
        // this.cache.types.modules[module.lowName] = type;
                
        // // Dump module type
        // moduleFile.push('');
        // moduleFile.push('/**');
        // moduleFile.push(` *  ${module.typeName}`);
        // moduleFile.push(' */');
        // moduleFile.push('');

        // let moduleDump = `export default interface ${module.typeName} extends $Module `;
        // moduleDump += SchemaDumper.dumpType({
        //     // Constants should be unknown by default, since enum types
        //     // are validated across modules. The default type causes
        //     // the enum alias to be keyof ... & Record<string, ...>, which
        //     // invalidated the type assertion
        //     constants: 'Omit<$Constants, \'values\'|\'enums\'> & { values: {}, enums: {} }', 
        //     ...type as Record<string, any>
        // } as any);
        // moduleFile.push(moduleDump);
        // moduleFile.push('');
        // moduleFile.push('/* */');
        // moduleFile.push('');

        // // Dump authentication users
        // moduleFile.push(`type users = ${SchemaDumper.dumpType(spaceType.users)}`);          
        
        // // Dump other elements
        // module.elements
        //     .filter(el => el.$t !== 'externals')
        //     .forEach((element) => {
        //         const type = element.dumpTypeSchema(this.cache);
        //         this.cache.types.elements[element.tag.full] = type;
        //         moduleFile.push(this.cache.types.elements[element.tag.full])
        //     });   

        // Write to file
        const moduleFilename = `${module.lowName}.module`;
        const moduleFilepath = path.resolve(dumpDir, moduleFilename+'.d.ts');
        fs.writeFileSync(moduleFilepath, moduleFile.join('\n'));
    }


}