import * as fs from 'fs';
import * as path from 'path';
import { Log } from '~/engine/util/log';
import { MonolythApp } from '~/bundler/monolyth/monolyth.app';
import { MonolythBundler } from '../monolyth.bundler';
import { CompilerModule } from '~/compiler/module';
import { App } from '~/engine/app/app';
import ts from 'typescript';

/**
 * [Monolyth Compiler Stage #4]
 * Dump modules to build/modules folder.
 * 
 * @category Monolyth Compiler
 * @subcategory Stages
 */
export class DumpModulesStage {
    
    public constructor(
        private bundler: MonolythBundler,
        private app: MonolythApp<any, any>
    ) {}

    public async run() {
        Log.info('compiler', 'monolyth', 'Dumping modules to build/modules folder...')

        const { compiler, dirs } = this.bundler;

        const info = App.getInfo(this.app);

        for (const name of info.spaceModules) {
            const module = compiler.modules[name as string];
            this.dumpModule(module, dirs.build_modules);
        }
    }
    
    private dumpModule(module: CompilerModule, dir: string) {       
        Log.debug('compiler', 'monolyth', `Dumping module ${module.lowName}`)
        const esnext = this.bundler.tsconfig.module === ts.ModuleKind.ESNext;
        
        let str = esnext
            ? `const { Module } = await import('${module.compiler.config?.nesoiPath || 'nesoi'}/lib/engine/module');\n`
            : `const { Module } = require('${module.compiler.config?.nesoiPath || 'nesoi'}/lib/engine/module');\n`

        str += esnext
            ? `export default new Module('${module.lowName}')\n`
            : `exports.default = new Module('${module.lowName}')\n`

        str += '  .inject({';
        
        const externals = module.module.schema.externals;
        if (externals) {
            str += '\n    externals: {';
            if (Object.keys(externals.buckets).length) {
                str += '\n      buckets: {';
                for (const b in externals.buckets) {
                    const dep = externals.buckets[b]
                    str += `\n        '${b}': ${JSON.stringify(dep, undefined, 2).replace(/\n/g,'\n        ')},`;
                }
                str += '\n      },';
            }
            if (Object.keys(externals.messages).length) {
                str += '\n      messages: {';
                for (const b in externals.messages) {
                    const dep = externals.messages[b]
                    str += `\n        '${b}': ${JSON.stringify(dep, undefined, 2).replace(/\n/g,'\n        ')},`;
                }
                str += '\n      },';
            }
            if (Object.keys(externals.jobs).length) {
                str += '\n      jobs: {\n';
                for (const b in externals.jobs) {
                    const dep = externals.jobs[b]
                    str += `\n        '${b}': ${JSON.stringify(dep, undefined, 2).replace(/\n/g,'\n        ')},`;
                }
                str += '\n      },';
            }
            if (Object.keys(externals.machines).length) {
                str += '\n      machines: {\n';
                for (const b in externals.machines) {
                    const dep = externals.machines[b]
                    str += `\n        '${b}': ${JSON.stringify(dep, undefined, 2).replace(/\n/g,'\n        ')},`;
                }
                str += '\n      },';
            }
            str += '\n    },';
        }

        const import_ = esnext ? '(await import' : 'require';
        const _import = esnext ? ')).default' : ').default';

        const constants = module.module.schema.constants
        if (constants && (Object.values(constants.values).length || Object.values(constants.enums).length)) {
            str += `\n    constants: ${import_}('./${module.lowName}/constants__${module.lowName}'${_import},`;
        }
        const buckets = Object.values(module.module.schema.buckets || {})
        if (buckets.length) {
            str += '\n    buckets: [\n';
            buckets.forEach(bucket => {
                str += `      ${import_}('./${module.lowName}/bucket__${bucket.name}'${_import},\n`;
            })
            str += '    ],';
        }
        const messages = Object.values(module.module.schema.messages || {})
        if (messages.length) {
            str += '\n    messages: [\n';
            messages.forEach(message => {
                str += `      ${import_}('./${module.lowName}/message__${message.name}'${_import},\n`;
            })
            str += '    ],';
        }
        const jobs = Object.values(module.module.schema.jobs || {})
        if (jobs.length) {
            str += '\n    jobs: [\n';
            jobs.forEach(job => {
                str += `      ${import_}('./${module.lowName}/job__${job.name}'${_import},\n`;
            })
            str += '    ],';
        }
        const resources = Object.values(module.module.schema.resources || {})
        if (resources.length) {
            str += '\n    resources: [\n';
            resources.forEach(resource => {
                str += `      ${import_}('./${module.lowName}/resource__${resource.name}'${_import},\n`;
            })
            str += '    ],';
        }
        const machines = Object.values(module.module.schema.machines || {})
        if (machines.length) {
            str += '\n    machines: [\n';
            machines.forEach(machine => {
                str += `      ${import_}('./${module.lowName}/machine__${machine.name}'${_import},\n`;
            })
            str += '    ],';
        }
        const controllers = Object.values(module.module.schema.controllers || {})
        if (controllers.length) {
            str += '\n    controllers: [\n';
            controllers.forEach(controller => {
                str += `      ${import_}('./${module.lowName}/controller__${controller.name}'${_import},\n`;
            })
            str += '    ],';
        }
        const queues = Object.values(module.module.schema.queues || {})
        if (queues.length) {
            str += '\n    queues: [\n';
            queues.forEach(queue => {
                str += `      ${import_}('./${module.lowName}/queue__${queue.name}'${_import},\n`;
            })
            str += '    ],';
        }
        const topics = Object.values(module.module.schema.topics || {})
        if (topics.length) {
            str += '\n    topics: [\n';
            topics.forEach(topic => {
                str += `      ${import_}('./${module.lowName}/topic__${topic.name}'${_import},\n`;
            })
            str += '    ],';
        }

        str += '})'

        const moduleFilename = `${module.lowName}.js`;
        const modulePath = path.resolve(dir, moduleFilename);
        fs.writeFileSync(modulePath, str);
    }
}