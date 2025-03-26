import * as fs from 'fs';
import * as path from 'path';
import { Log } from '~/engine/util/log';
import { MonolythRuntime } from '~/engine/runtimes/monolyth.runtime';
import { MonolythCompiler } from '../monolyth_compiler';
import { CompilerModule } from '~/compiler/module';
import { Runtime } from '~/engine/runtimes/runtime';

/**
 * [Monolyth Compiler Stage #4]
 * Dump modules to build/modules folder.
 */
export class DumpModulesStage {
    
    public constructor(
        private monolyth: MonolythCompiler,
        private runtime: MonolythRuntime<any, any>
    ) {}

    public async run() {
        Log.info('compiler', 'monolyth', 'Dumping modules to build/modules folder...')

        const { compiler, dirs } = this.monolyth;

        const info = Runtime.getInfo(this.runtime);

        for (const key of info.modules) {
            const module = compiler.modules[key as string];
            this.dumpModule(module, dirs.build_modules);
        }
    }
    
    private dumpModule(module: CompilerModule, dir: string) {       
        Log.debug('compiler', 'monolyth', `Dumping module ${module.lowName}`)
        let str = `const { Module } = require('${module.compiler.config?.nesoiPath || 'nesoi'}/lib/engine/module');\n`

        str += `exports.default = new Module('${module.lowName}')\n`;
        str += '  .inject({';
        
        const constants = module.module.schema.constants
        if (constants && (Object.values(constants.values).length || Object.values(constants.enums).length)) {
            str += `\n    constants: require('./${module.lowName}/constants__${module.lowName}').default,`;
        }
        const buckets = Object.values(module.module.schema.buckets || {})
        if (buckets.length) {
            str += '\n    buckets: [\n';
            buckets.forEach(bucket => {
                str += `      require('./${module.lowName}/bucket__${bucket.name}').default,\n`;
            })
            str += '    ],';
        }
        const messages = Object.values(module.module.schema.messages || {})
        if (messages.length) {
            str += '\n    messages: [\n';
            messages.forEach(message => {
                str += `      require('./${module.lowName}/message__${message.name}').default,\n`;
            })
            str += '    ],';
        }
        const jobs = Object.values(module.module.schema.jobs || {})
        if (jobs.length) {
            str += '\n    jobs: [\n';
            jobs.forEach(job => {
                str += `      require('./${module.lowName}/job__${job.name}').default,\n`;
            })
            str += '    ],';
        }
        const resources = Object.values(module.module.schema.resources || {})
        if (resources.length) {
            str += '\n    resources: [\n';
            resources.forEach(resource => {
                str += `      require('./${module.lowName}/resource__${resource.name}').default,\n`;
            })
            str += '    ],';
        }
        const machines = Object.values(module.module.schema.machines || {})
        if (machines.length) {
            str += '\n    machines: [\n';
            machines.forEach(machine => {
                str += `      require('./${module.lowName}/machine__${machine.name}').default,\n`;
            })
            str += '    ],';
        }
        const controllers = Object.values(module.module.schema.controllers || {})
        if (controllers.length) {
            str += '\n    controllers: [\n';
            controllers.forEach(controller => {
                str += `      require('./${module.lowName}/controller__${controller.name}').default,\n`;
            })
            str += '    ],';
        }
        const queues = Object.values(module.module.schema.queues || {})
        if (queues.length) {
            str += '\n    queues: [\n';
            queues.forEach(queue => {
                str += `      require('./${module.lowName}/queue__${queue.name}').default,\n`;
            })
            str += '    ],';
        }

        str += '})'

        const moduleFilename = `${module.lowName}.js`;
        const modulePath = path.resolve(dir, moduleFilename);
        fs.writeFileSync(modulePath, str);
    }
}