import { Compiler } from '../compiler';
import { Log } from '~/engine/util/log';
import { TSBridgeInject } from '../typescript/bridge/inject';

/**
 * [Compiler Stage #5]
 * Transfer TypeScript sources (methods and imports) to schemas
 * 
 * @category Compiler
 * @subcategory Stages
 */
export class InjectTSStage {

    constructor(
        public compiler: Compiler
    ) {}

    public run() {
        Log.info('compiler', 'stage.inject_ts', 'Injecting TypeScript code to schemas...');

        const { tree } = this.compiler;
        const nodes = tree.allNodes();

        TSBridgeInject.inject(this.compiler, nodes);

        Log.trace('compiler', 'stage.inject_ts', 'Finished injecting TS code');
    }

}