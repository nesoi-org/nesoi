import type { CompilerModule } from './module';
import type { $Space } from '~/schema';
import type { CompilerConfig } from '~/engine/app/app.config';
import { App, type AnyApp } from '~/engine/app/app';

import { ModuleTree } from '~/engine/tree';
import { Space } from '~/engine/space';
import { TypeScriptCompiler } from './typescript/typescript_compiler';
import { ScanStage } from './stages/1_scan_stage';
import { TreeshakeStage } from './stages/2_treeshake_stage';
import { ExtractTSStage } from './stages/3_extract_ts_stage';
import { BuildSchemasStage } from './stages/4_build_schemas_stage';
import { InjectTSStage } from './stages/5_inject_ts_stage';
import { BuildElementsStage } from './stages/6_build_elements_stage';
import { DumpStage } from './stages/7_dump_stage';
import { DiagnoseStage } from './stages/8_diagnose_stage';
import Console from '~/engine/util/console';
import { Log } from '~/engine/util/log';
import fs from 'fs';
import type { Tag } from '~/engine/dependency';

export class Compiler {

    public modules: Record<string, CompilerModule> = {};
    public tree!: ModuleTree;
    public tsCompiler: TypeScriptCompiler; 

    public targetDir!: string
    public logFn?: (msg: string) => void

    public tags?: {
        [module: string]: {
            include?: Tag[]
            exclude?: Tag[]
        }
    }
    
    constructor(
        public space: Space<$Space>,
        public config?: CompilerConfig,
        public appPath?: string
    ) {
        Console.header('Compiler');

        Log.info('compiler', 'ts', 'Preparing TypeScript...')
        this.tsCompiler = new TypeScriptCompiler(space, config?.nesoiPath);
    }

    public async run() {

        let app;
        if (this.appPath) {
            Log.info('compiler', 'ts', `Importing the app definition from ${this.appPath}`)
            const appFile = Space.path(this.space, this.appPath);
            app = (await import(appFile)).default as AnyApp;
        }

        this.tags = app ? App.getIncludeExcludeTags(app) : undefined;

        Log.info('compiler', 'ts', 'Starting')
        this.tree = new ModuleTree({}, {
            exclude: this.config?.exclude
        });
        this.targetDir = (this.config?.isolatedDotNesoi && app) ? `.app.${app.name}` : '';

        
        if (this.appPath || this.config?.reset) {
            // Cleanup .nesoi folder
            fs.rmSync(Space.path(this.space, '.nesoi', this.targetDir), { recursive: true, force: true })
        }
        
        try {
            await new ScanStage(this).run();
            await new TreeshakeStage(this).run();
            await new ExtractTSStage(this).run();
            await new BuildSchemasStage(this).run();
            await new InjectTSStage(this).run();
            await new BuildElementsStage(this).run();
            await new DumpStage(this).run();
            if (this.config?.diagnose) {
                await new DiagnoseStage(this).run();
            }
        }
        catch (e: any) {
            Log.error('compiler', 'nesoi', e.toString(), { stack: e.stack })
            process.exit(1);
        }
        return this;
    }

}