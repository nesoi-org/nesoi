import * as fs from 'fs';
import * as path from 'path';
import { MonolythRuntime } from '~/engine/runtimes/monolyth.runtime';
import { Compiler } from '~/compiler/compiler';
import { Space } from '~/engine/space';
import Console from '~/engine/util/console';
import { MkdirStage } from './stages/1_mkdir_stage';
import { CopyTypesStage } from './stages/3_copy_types_stage';
import { DumpModulesStage } from './stages/4_dump_modules_stage';
import { DumpCLIStage } from './stages/5_dump_cli_stage';
import { DumpPackageJsonStage } from './stages/6_dump_package_json_stage';
import { BuildTypescriptStage } from './stages/2_build_typescript_stage';
import { Log } from '~/engine/util/log';
import { Runtime } from '~/engine/runtimes/runtime';

export type MonolythCompilerConfig = {
    libPaths?: string[]
    scripts?: Record<string, string>
    nesoiPath?: string
}

export class MonolythCompiler {
    
    public dirs: {
        build: string,
        build_modules: string,
        build_types: string,
        build_bin: string
    }

    public constructor(
        public compiler: Compiler,
        public runtimePath: string,
        public config: MonolythCompilerConfig = {}
    ) {
        this.dirs = {} as any;
    }

    public async run() {
        Console.header('Monolyth Compiler');

        Log.info('compiler', 'monolyth', `Importing the monolyth definition from ${this.runtimePath}`)
        const runtimeFile = Space.path(this.compiler.space, this.runtimePath);
        const runtime = (await import(runtimeFile)).default as MonolythRuntime<any, any>;

        this.config = Object.assign(
            {},
            Runtime.getInfo(runtime).config?.compiler || {},
            this.config);

        try {
            await new MkdirStage(this, runtime).run();
            await new BuildTypescriptStage(this, runtime).run();
            await new CopyTypesStage(this, runtime).run();
            await new DumpModulesStage(this, runtime).run();
            await new DumpCLIStage(this, runtime).run();   
            await new DumpPackageJsonStage(this, runtime).run();
        }
        catch (e: any) {
            Log.error('compiler', 'monolyth', e.toString(), { stack: e.stack })
            process.exit();
        }
    }

    public static async scanAll(dir: string) {
        const runtimes: MonolythRuntime<any, any>[] = []
        const nodes = fs.readdirSync(dir, { withFileTypes: true })
        for (const node of nodes) {
            const nodePath = path.resolve(dir, node.name);
            if (!nodePath.endsWith('.ts')) {
                return;
            }
            const exported = (await import(nodePath))?.default
            if (exported instanceof MonolythRuntime) {
                runtimes.push(exported);
            }
        }
        return runtimes;
    }

}