import type { AnyTrxNode} from '../trx_node';
import type { $Controller } from '~/elements/edge/controller/controller.schema';
import type { Controller } from '~/elements/edge/controller/controller';

import { TrxNode } from '../trx_node';
import { ExternalTrxNode } from './external.trx_node';
import { Tag } from '~/engine/dependency';
import { NesoiError } from '~/engine/data/error';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class ControllerTrxNode<S extends $Space, M extends $Module,$ extends $Controller> {
    
    private external: boolean
    private controller?: Controller<S, M, $>

    constructor(
        private trx: TrxNode<any, M, any>,
        private tag: Tag
    ) {
        const module = TrxNode.getModule(trx);
        this.external = tag.module !== module.name;
        if (!this.external) {
            this.controller = Tag.element(tag, trx);
            if (!this.controller) {
                throw NesoiError.Trx.NodeNotFound(this.tag.full, trx.globalId);
            }
        }
    }


    /*
        Wrap
    */
   
    private async wrap(
        action: string,
        input: Record<string, any>,
        fn: (trx: AnyTrxNode, element: Controller<S, M, $>) => Promise<any>,
        fmtTrxOut?: (out: any) => any
    ) {
        const wrapped = async (parentTrx: AnyTrxNode, controller: Controller<S, M, $>) => {
            const trx = TrxNode.makeChildNode(parentTrx, controller.schema.module, 'controller', controller.schema.name);
                
            TrxNode.open(trx, action, input);
            let out;
            try {
                out = await fn(trx, controller);
            }
            catch (e) {
                throw TrxNode.error(trx, e);
            }
            TrxNode.ok(trx, fmtTrxOut ? fmtTrxOut(out) : out);
    
            return out;
        }
    
        if (this.external) {
            const ext = new ExternalTrxNode(this.trx, this.tag)
            return ext.run(trx => wrapped(trx, Tag.element(this.tag, trx)));
        }
        else {
            return wrapped(this.trx, this.controller!)
        }
    }

    public async invoke<
        Path extends keyof $['#path'],
    >(
        path: Path,
        raw: $['#path'][Path]['#raw']
    ): Promise<void> {
        return this.wrap('invoke', raw as Record<string, any>, (_, controller) => {
            return controller.adapter.invoke(path as string, raw as Record<string, any>);
        })
    }
}