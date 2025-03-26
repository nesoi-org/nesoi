import * as fs from 'fs';
import { CompilerModule } from './module';
import { ModuleTree } from '~/engine/tree';
import { Space } from '~/engine/space';
import { $Space } from '~/schema';
import { TypeScriptCompiler } from './typescript/typescript_compiler';
import { ScanStage } from './stages/1_scan_stage';
import { TreeshakeStage } from './stages/2_treeshake_stage';
import { ExtractTSStage } from './stages/3_extract_ts_stage';
import { BuildSchemasStage } from './stages/4_build_schemas_stage';
import { InjectTSStage } from './stages/5_inject_ts_stage';
import { BuildElementsStage } from './stages/6_build_elements_stage';
import { DumpStage } from './stages/7_dump_stage';
import Console from '~/engine/util/console';
import { Log } from '~/engine/util/log';
import { DiagnoseStage } from './stages/8_diagnose_stage';


export type CompilerConfig = {
    nesoiPath?: string,
    exclude?: string[]
}

export class Compiler {

    public modules: Record<string, CompilerModule> = {};
    public tree = new ModuleTree({}, this.config);
    public tsCompiler: TypeScriptCompiler; 

    public logFn?: (msg: string) => void

    constructor(
        public space: Space<$Space>,
        public config?: CompilerConfig
    ) {
        this.tsCompiler = new TypeScriptCompiler(space, config?.nesoiPath);
    }

    public async run() {
        Console.header('Elements Compiler');
        
        // Cleanup .nesoi folder
        fs.rmSync(Space.path(this.space, '.nesoi'), { recursive: true, force: true })
        
        try {
            await new ScanStage(this).run();
            await new TreeshakeStage(this).run();
            await new ExtractTSStage(this).run();
            await new BuildSchemasStage(this).run();
            await new InjectTSStage(this).run();
            await new BuildElementsStage(this).run();
            await new DumpStage(this).run();
            await new DiagnoseStage(this).run();
        }
        catch (e: any) {
            Log.error('compiler', 'nesoi', e.toString(), { stack: e.stack })
            process.exit();
        }
        return this;
    }

}