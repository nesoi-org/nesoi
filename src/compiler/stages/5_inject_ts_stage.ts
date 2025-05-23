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
        const t0 = new Date().getTime();

        const { tree } = this.compiler;
        const nodes = tree.allNodes();

        TSBridgeInject.inject(this.compiler, nodes);

        const t = new Date().getTime();
        Log.debug('compiler', 'stage.inject_ts', `[t: ${(t-t0)/1000} ms]`);
        Log.trace('compiler', 'stage.inject_ts', 'Finished injecting TS code');
    }

}