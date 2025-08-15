import * as fs from 'fs';
import path from 'path';
import { Compiler } from '../compiler';
import { ObjTypeAsObj } from '../elements/element';
import { CompilerModule } from '../module';
import { Log } from '~/engine/util/log';
import { NameHelpers } from '~/engine/util/name_helpers';
import { ExternalsElement } from '../elements/externals.element';
import { $Dependency } from '~/engine/dependency';
import { BucketElement } from '../elements/bucket.element';
import { DumpHelpers } from '../helpers/dump_helpers';
import { Space } from '~/engine/space';

/* @nesoi:browser ignore-start */
import { ProgressiveBuild, ProgressiveBuildCache } from '../progressive';
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

    constructor(
        public compiler: Compiler
    ) {}

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

        let spaceType;
        if (this.hash.$ !== this.cache.hash.$) {
            spaceType = this.dumpSpace();
            this.cache.types.space = spaceType;
        }
        else {
            spaceType = this.cache.types.space;
        }

        Object.values(this.compiler.modules).forEach(module => {
            if (this.hash!.modules[module.lowName]?.$ !== this.cache.hash.modules[module.lowName]?.$) {
                this.dumpModule(module, spaceType);
            }
        });

        /* @nesoi:browser ignore-start */
        await ProgressiveBuild.save(this.compiler.space, this.cache, this.hash);
        /* @nesoi:browser ignore-end */
        
        const t = new Date().getTime();
        Log.debug('compiler', 'stage.dump', `[t: ${(t-t0)/1000} ms]`);
    }

    /* Space */

    private dumpSpace() {
        const type: ObjTypeAsObj = {
            authnUsers: {},
            modules: {}
        };

        // Authentication users
        const _authn = (this.compiler.space as any)._authn as Space<any>['_authn'];
        Object.entries(_authn).forEach(([name, model]) => {
            type.authnUsers[name] = BucketElement.buildModelTypeFromSchema(model);
        });
        
        // Module imports
        let dump = '';
        dump += `import { $Space } from '${this.compiler.config?.nesoiPath ?? 'nesoi'}/lib/schema';\n`;
        Object.values(this.compiler.modules).forEach(module => {
            type.modules[module.lowName] = module.typeName;
            dump += `import ${module.typeName} from './${module.lowName}.module';\n`;
        });

        const name = (this.compiler.space as any)._name as Space<any>['_name'];
        dump += `\nexport default interface ${name} extends $Space `;
        dump += DumpHelpers.dumpType(type);

        // Create dir and write to file
        const dumpDir = Space.path(this.compiler.space, './.nesoi');
        if (!fs.existsSync(dumpDir)) {
            fs.mkdirSync(dumpDir, { recursive: true });
        }
        const spaceFilepath = path.resolve(dumpDir, NameHelpers.nameHighToLow(name)+'.ts');
        fs.writeFileSync(spaceFilepath, dump);

        return type;
    }


    /* Module */

    private dumpModule(module: CompilerModule, spaceType: ObjTypeAsObj) {
        const dumpDir = Space.path(this.compiler.space, `./.nesoi/${module.lowName}`);
        if (!fs.existsSync(dumpDir)) {
            fs.mkdirSync(dumpDir, { recursive: true });
        }
        this.dumpModuleType(module, spaceType, dumpDir);
        this.dumpModuleSchemas(module, dumpDir);
    }
    
    private dumpModuleSchemas(module: CompilerModule, dumpDir: string) {
        const nesoiPath = this.compiler.config?.nesoiPath ?? 'nesoi';
        module.elements.forEach((element) => {
            if (
                element.schema.$t === 'constants'
                || element.schema.$t === 'externals'
                || (this.hash.modules[element.schema.module].nodes[element.tag]
                    !== this.cache.hash.modules[element.schema.module]?.nodes[element.tag])
            ) {
                const filename =  path.basename(element.filepath());
                const elPath = path.resolve(dumpDir, filename);
                fs.writeFileSync(elPath, element.dumpFileSchema(nesoiPath));
            }
        });
    }

    private dumpModuleType(module: CompilerModule, spaceType: ObjTypeAsObj, dumpDir: string) {
        const nesoiPath = this.compiler.config?.nesoiPath ?? 'nesoi';
        const moduleFile: string[] = [];
        moduleFile.push(`import { $Module, $Constants, $Bucket, $Message, $Job, $Resource, $Machine, $Controller, $Queue, $Topic } from '${nesoiPath}/lib/elements';`)
        moduleFile.push(`import { NesoiDate } from '${nesoiPath}/lib/engine/data/date';`)
        moduleFile.push(`import { NesoiDatetime } from '${nesoiPath}/lib/engine/data/datetime';`)
        moduleFile.push(`import { NesoiDecimal } from '${nesoiPath}/lib/engine/data/decimal';`)
        moduleFile.push(`import { NesoiFile } from '${nesoiPath}/lib/engine/data/file';`)
        
        // Get external modules
        const moduleDependencies = new Set<string>();
        // Pre-populate from cache
        if (this.cache) {
            this.cache.modules[module.lowName]?.dependencies.modules.forEach(module => {
                if (module in this.compiler.modules) {
                    moduleDependencies.add(module);
                }
            })
        }
        // Extract from updated elements
        const externalElement = module.elements
            .find(el => el.$t === 'externals');
        if (externalElement) {
            for (const module of (externalElement as ExternalsElement).getModuleDependencies()) {
                moduleDependencies.add(module);
            }
        }
        // Dump external imports
        moduleFile.push(
            ...Array.from(moduleDependencies)
                .map(module => 
                    `import ${NameHelpers.nameLowToHigh(module)}Module from './${module}.module'`
                )
        );
        this.cache.modules[module.lowName] ??= {
            dependencies: {
                modules: []
            }
        }
        this.cache.modules[module.lowName].dependencies.modules = Array.from(moduleDependencies);

        // Build module type (with all elements)
        const type = this.makeModuleType(module);
        this.cache.types.modules[module.lowName] = type;
                
        // Dump module type
        moduleFile.push('');
        moduleFile.push('/**');
        moduleFile.push(` *  ${module.typeName}`);
        moduleFile.push(' */');
        moduleFile.push('');

        let moduleDump = `export default interface ${module.typeName} extends $Module `;
        moduleDump += DumpHelpers.dumpType({
            // Constants should be unknown by default, since enum types
            // are validated across modules. The default type causes
            // the enum alias to be keyof ... & Record<string, ...>, which
            // invalidated the type assertion
            constants: 'Omit<$Constants, \'values\'|\'enums\'> & { values: {}, enums: {} }', 
            ...type as Record<string, any>
        } as any);
        moduleFile.push(moduleDump);
        moduleFile.push('');
        moduleFile.push('/* */');
        moduleFile.push('');

        // Dump authentication users
        moduleFile.push(`type AuthnUsers = ${DumpHelpers.dumpType(spaceType.authnUsers)}`);          
        
        // Dump other elements
        module.elements
            .filter(el => el.$t !== 'externals')
            .forEach((element) => {
                const type = element.dumpTypeSchema(this.cache);
                this.cache.types.elements[element.tag] = type;
                moduleFile.push(this.cache.types.elements[element.tag])
            });                

        // Write to file
        const moduleFilename = `../${module.lowName}.module`;
        const moduleFilepath = path.resolve(dumpDir, moduleFilename+'.ts');
        fs.writeFileSync(moduleFilepath, moduleFile.join('\n'));
    }

    private makeModuleType(module: CompilerModule) {
        // Build module type (with all blocks)
        const type: ObjTypeAsObj = {
            name: `'${module.lowName}'`,
            externals: 'any',
            constants: 'any',
            buckets: {},
            messages: {},
            jobs: {},
            resources: {},
            machines: {},
            queues: {},
            topics: {},
            controllers: {},
        };

        // Merge types that currently exist and are found on cache
        const typeCache = this.cache.types.modules[module.lowName];
        if (typeCache) {
            type.externals = typeCache.externals || 'any';
            type.constants = typeCache.constants || 'any';
            for (const eltype of ['buckets', 'messages', 'jobs', 'resources', 'machines', 'queues', 'topics', 'controllers'] as const) {
                for (const name in typeCache[eltype] || {}) {
                    if (name in module.module.schema[eltype]) {
                        type[eltype][name] = typeCache[eltype][name];
                    }
                }
            }
        }

        const externals = module.elements.find(el => el.$t === 'externals');
        // Inject external node types on module
        if (externals) {
            if (!type.buckets) {
                type.buckets = {};
            }
            Object.entries((externals as ExternalsElement).schema.buckets).forEach(([tag, ref]) => {
                type.buckets[tag] = $Dependency.typeName(ref, module.lowName)
            })
            if (!type.messages) {
                type.messages = {};
            }
            Object.entries((externals as ExternalsElement).schema.messages).forEach(([tag, ref]) => {
                type.messages[tag] = $Dependency.typeName(ref, module.lowName)
            })
            if (!type.jobs) {
                type.jobs = {};
            }
            Object.entries((externals as ExternalsElement).schema.jobs).forEach(([tag, ref]) => {
                type.jobs[tag] = $Dependency.typeName(ref, module.lowName)
            })
            if (!type.machines) {
                type.machines = {};
            }
            Object.entries((externals as ExternalsElement).schema.machines).forEach(([tag, ref]) => {
                type.machines[tag] = $Dependency.typeName(ref, module.lowName)
            })
        }
        if (module.elements.some(el => el.$t === 'constants')) {
            type.constants = module.highName+'Constants';
        }
        module.elements.forEach(element => {
            if (element.$t === 'externals' || element.$t === 'constants') { return }
            // WARN: this might breat non-regular plural block names in the future
            const el_t = element.$t + 's';
            if (!(el_t in type)) {
                type[el_t] = {};
            }
            type[el_t][element.lowName] = element.typeName;
        })

        type['#input'] = DumpHelpers.dumpType(module.elements
            .filter(el => el.$t === 'message')
            .map(el => el.typeName) as any);

        type['#authn'] = 'AuthnUsers';

        return type;
    }

}