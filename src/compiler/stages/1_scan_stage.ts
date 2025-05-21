import { Space } from '~/engine/space';
import { Compiler } from '../compiler';
import { CompilerModule } from '../module';
import { Log } from '~/engine/util/log';

/**
 * [Compiler Stage #1]
 * Scan the space path looking for modules in the /modules folder.
 * 
 * @category Compiler
 * @subcategory Stages
 */
export class ScanStage {

    constructor(
        public compiler: Compiler
    ) {}
    
    public async run() {
        Log.info('compiler', 'stage.scan', 'Scanning module folders...');
        
        Space.scan(this.compiler.space, (name, path, subdir) => {
            this.compiler.modules[name] = new CompilerModule(this.compiler, name, path, subdir);
        });

        Log.debug('compiler', 'stage.scan', `Modules (${Object.keys(this.compiler.modules).length}): ${Object.keys(this.compiler.modules)}`);
    }

}