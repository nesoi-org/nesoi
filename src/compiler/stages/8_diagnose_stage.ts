import { Log } from '~/engine/util/log';
import { Compiler } from '../compiler';

/**
 * [Compiler Stage #8]
 * Diagnose the space source with TypeScript
 * 
 * This is the last stage since the source needs the .nesoi definitions to be up-to-date.
 * So we build everything ignoring TypeScript errors, then check for those errors.
 * 
 * This strategy has the downside of breaking the elements on a failed compile, which
 * causes instability on the project types while the issue is not fixed
 * 
 * @category Compiler
 * @subcategory Stages
 */
export class DiagnoseStage {

    constructor(
        public compiler: Compiler
    ) {}
    
    public async run() {
        Log.info('compiler', 'stage.diagnose', 'Diagnosing space files with TypeScript...');
        const t0 = new Date().getTime();
        
        const { tsCompiler, tree } = this.compiler;

        // Recreate TS program, to load new version of types
        tsCompiler.createProgram();

        const filepaths: string[] = [];
        
        // Find all files
        tree.allNodes().forEach(node => {
            // Inline nodes belong to the same file as their parent
            if (node.isInline) { return; }
    
            if (Array.isArray(node.filepath)) {
                filepaths.push(...node.filepath)
            }
            else {
                filepaths.push(node.filepath)
            }
        })

        filepaths.forEach(filepath => {
            tsCompiler.check(filepath)
        })

        const t = new Date().getTime();
        Log.debug('compiler', 'stage.diagnose', `[t: ${(t-t0)/1000} ms]`);
    }

}