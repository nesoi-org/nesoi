import * as fs from 'fs';
import * as path from 'path';
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
import { AnyApp, App } from '~/engine/apps/app';
import { MonolythApp } from '~/engine/apps/monolyth/monolyth.app';
import { Path } from '~/engine/util/path';

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
        public appPath: string,
        public config: MonolythCompilerConfig = {}
    ) {
        this.dirs = {} as any;
    }

    public async run() {
        Console.header('Monolyth Compiler');

        Log.info('compiler', 'monolyth', `Importing the monolyth definition from ${this.appPath}`)
        const appFile = Space.path(this.compiler.space, this.appPath);
        const app = (await import(appFile)).default as MonolythApp<any, any>;

        this.config = Object.assign(
            {},
            App.getInfo(app).config?.compiler || {},
            this.config);

        this.mergeProviderPaths(app);
        this.expandLibPaths();

        try {
            await new MkdirStage(this, app).run();
            await new BuildTypescriptStage(this, app).run();
            await new CopyTypesStage(this, app).run();
            await new DumpModulesStage(this, app).run();
            await new DumpCLIStage(this, app).run();   
            await new DumpPackageJsonStage(this, app).run();
        }
        catch (e: any) {
            Log.error('compiler', 'monolyth', e.toString(), { stack: e.stack })
            process.exit();
        }
    }

    public mergeProviderPaths(app: AnyApp) {
        const providers = App.getProviders(app);
        for (const name in providers) {
            const provider = providers[name];
            if (!provider.libPaths) continue;

            this.config.libPaths ??= [];
            this.config.libPaths.push(...provider.libPaths);
        }
    }

    public expandLibPaths() {
        const expandedPaths: string[] = [];
        this.config.libPaths ??= [];

        for (const path of this.config.libPaths) {
            const expanded = Path.expandWildcard(path);
            expandedPaths.push(...expanded);
        }

        this.config.libPaths = expandedPaths;
    }

    public static async scanAll(dir: string) {
        const apps: MonolythApp<any, any>[] = []
        const nodes = fs.readdirSync(dir, { withFileTypes: true })
        for (const node of nodes) {
            const nodePath = path.resolve(dir, node.name);
            if (!nodePath.endsWith('.ts')) {
                return;
            }
            const exported = (await import(nodePath))?.default
            if (exported instanceof MonolythApp) {
                apps.push(exported);
            }
        }
        return apps;
    }

}