import * as fs from 'fs';
import * as path from 'path';
import { Compiler } from '~/compiler/compiler';
import { Space } from '~/engine/space';
import Console from '~/engine/util/console';
import { MkdirStage } from './stages/1_mkdir_stage';
import { BuildTypescriptStage } from './stages/2_build_typescript_stage';
import { CopyTypesStage } from './stages/3_copy_types_stage';
import { DumpModulesStage } from './stages/4_dump_modules_stage';
// import { CopyStaticStage } from './stages/5_copy_static_stage';
// import { DumpCLIStage } from './stages/6_dump_cli_stage';
// import { DumpPackageJsonStage } from './stages/7_dump_package_json_stage';
import { Log } from '~/engine/util/log';
import { AnyApp, App } from '~/engine/apps/app';
import { DistributedApp } from '~/engine/apps/distributed/distributed.app';
import { Path } from '~/engine/util/path';

export type DistributedCompilerConfig = {
    libPaths?: string[],
    staticPaths?: string[],
    scripts?: Record<string, string>
    nesoiPath?: string
}

export class DistributedCompiler {
    
    public dirs: {
        build: string,
        nodes: {
            [name: string]: {
                build: string,
                build_modules: string,
                build_externals: string,
                build_types: string,
                build_bin: string
            }
        }
    }

    public constructor(
        public compiler: Compiler,
        public appPath: string,
        public config: DistributedCompilerConfig = {}
    ) {
        this.dirs = {} as any;
    }

    public async run() {
        Console.header('Distributed Compiler');

        Log.info('compiler', 'distributed', `Importing the Distributed definition from ${this.appPath}`)
        const appFile = Space.path(this.compiler.space, this.appPath);
        const app = (await import(appFile)).default as DistributedApp<any, any>;

        this.config = Object.assign(
            {},
            App.getInfo(app).config?.compiler || {},
            this.config);

        this.mergeServicePaths(app);
        this.expandLibPaths();

        try {
            await new MkdirStage(this, app).run();
            await new BuildTypescriptStage(this, app).run();
            await new CopyTypesStage(this, app).run();
            await new DumpModulesStage(this, app).run();
            // await new CopyStaticStage(this, app).run();
            // await new DumpCLIStage(this, app).run();   
            // await new DumpPackageJsonStage(this, app).run();
        }
        catch (e: any) {
            Log.error('compiler', 'distributed', e.toString(), { stack: e.stack })
            process.exit(1);
        }
    }

    public mergeServicePaths(app: AnyApp) {
        const services = App.getServices(app);
        for (const name in services) {
            const service = services[name];
            if (!service.libPaths) continue;

            this.config.libPaths ??= [];
            this.config.libPaths.push(...service.libPaths);
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
        const apps: DistributedApp<any, any>[] = []
        const nodes = fs.readdirSync(dir, { withFileTypes: true })
        for (const node of nodes) {
            const nodePath = path.resolve(dir, node.name);
            if (!nodePath.endsWith('.ts')) {
                return;
            }
            const exported = (await import(nodePath))?.default
            if (exported instanceof DistributedApp) {
                apps.push(exported);
            }
        }
        return apps;
    }

}