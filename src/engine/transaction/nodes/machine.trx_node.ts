import type { Machine, MachineOutput } from '~/elements/blocks/machine/machine';
import type { Message } from '~/elements/entities/message/message';

import type { AnyTrxNode} from '../trx_node';
import { TrxNode } from '../trx_node';
import { Tag } from '~/engine/dependency';
import { NesoiError } from '~/engine/data/error';
import { ExternalTrxNode } from './external.trx_node';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class MachineTrxNode<M extends $Module, $ extends $Machine> {

    private external: boolean
    private machine?: Machine<any, M, $>

    constructor(
        private trx: TrxNode<any, M, any>,
        private tag: Tag
    ) {
        const module = TrxNode.getModule(trx);
        this.external = tag.module !== module.name;
        if (!this.external) {
            this.machine = Tag.element(tag, trx);
            if (!this.machine) {
                throw NesoiError.Trx.NodeNotFound(this.tag.full, trx.globalId);
            }
        }
    }


    /*
        Wrap
    */
   
    async wrap(
        action: string,
        input: Record<string, any>,
        fn: (trx: AnyTrxNode, element: Machine<any, M, $>) => Promise<any>,
        fmtTrxOut?: (out: any) => any
    ) {
        const wrapped = async (parentTrx: AnyTrxNode, machine: Machine<any, M, $>) => {
            const trx = TrxNode.makeChildNode(parentTrx, machine.schema.module, 'machine', machine.schema.name);
                
            TrxNode.open(trx, action, input);
            let out;
            try {
                out = await fn(trx, machine);
            }
            catch (e) {
                throw TrxNode.error(trx, e);
            }
            TrxNode.ok(trx, fmtTrxOut ? fmtTrxOut(out) : out);
    
            return out;
        }
    
        if (this.external) {
            const ext = new ExternalTrxNode(this.trx, this.tag)
            return ext.run_and_hold(
                trx => Tag.element(this.tag, trx),
                wrapped
            );
        }
        else {
            return wrapped(this.trx, this.machine!)
        }
    }

    async run(message: $['#input']['#raw']): Promise<MachineOutput> {
        const _message = message as Record<string, any>;
        return this.wrap('run', _message, (trx, machine) => {
            return machine.consumeRaw(trx, _message)
        })
    }

    async forward(message: Message<$['#input']>): Promise<MachineOutput> {
        return this.wrap('forward', message, (trx, machine) => {
            return machine.consume(trx, message)
        })
    }

}