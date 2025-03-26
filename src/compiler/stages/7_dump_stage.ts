import * as fs from 'fs';
import { Compiler } from '../compiler';
import { ObjTypeAsObj } from '../elements/element';
import { CompilerModule } from '../module';
import { Log } from '~/engine/util/log';
import { NameHelpers } from '../helpers/name_helpers';
import path from 'path';
import { ExternalsElement } from '../elements/externals.element';
import { $Dependency } from '~/engine/dependency';
import { BucketElement } from '../elements/bucket.element';
import { DumpHelpers } from '../helpers/dump_helpers';
import { Space } from '~/engine/space';

/**
 * [Compiler Stage #7]
 * Dump the element schemas and types to the .nesoi folder.
 */
export class DumpStage {

    constructor(
        public compiler: Compiler
    ) {}

    public run() {
        Log.info('compiler', 'stage.dump', 'Dumping Schemas and Types...');

        const spaceType = this.dumpSpace();

        Object.values(this.compiler.modules).forEach(module => {
            this.dumpModule(module, spaceType);
        });
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
        
        // Module types
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
            const filename =  path.basename(element.filepath());
            const elPath = path.resolve(dumpDir, filename);
            fs.writeFileSync(elPath, element.dumpFileSchema(nesoiPath));
        });
    }

    private dumpModuleType(module: CompilerModule, spaceType: ObjTypeAsObj, dumpDir: string) {
        const nesoiPath = this.compiler.config?.nesoiPath ?? 'nesoi';
        const moduleFile: string[] = [];
        moduleFile.push(`import { $Module, $Constants, $Bucket, $Message, $Job, $Resource, $Machine, $Controller, $Queue } from '${nesoiPath}/lib/elements';`)
        moduleFile.push(`import { NesoiDate } from '${nesoiPath}/lib/engine/data/date';`)
        moduleFile.push(`import { NesoiDatetime } from '${nesoiPath}/lib/engine/data/datetime';`)
        
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
            controllers: {},
        };
        const externals = module.elements.find(el => el.$t === 'externals');
        // Inject external node types on module
        if (externals) {
            if (!type.buckets) {
                type.buckets = {};
            }
            Object.entries((externals as ExternalsElement).schema.buckets).forEach(([tag, ref]) => {
                type.buckets[tag] = $Dependency.typeName(ref, module.lowName)
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

        
        // Dump external elements (imports)
        module.elements
            .filter(el => el.$t === 'externals')
            .forEach((element) => {
                moduleFile.push(element.dumpTypeSchema());
            });    
        
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
            ...type
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
                moduleFile.push(element.dumpTypeSchema());
            });                

        // Write to file
        const moduleFilename = `../${module.lowName}.module`;
        const moduleFilepath = path.resolve(dumpDir, moduleFilename+'.ts');
        fs.writeFileSync(moduleFilepath, moduleFile.join('\n'));
    }

}