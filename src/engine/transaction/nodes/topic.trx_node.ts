import type { AnyTrxNode} from '../trx_node';
import type { $Topic } from '~/elements/blocks/topic/topic.schema';
import type { Topic, TopicTenancy } from '~/elements/blocks/topic/topic';
import type { AnyMessage } from '~/elements/entities/message/message';

import { TrxNode } from '../trx_node';
import { Tag } from '~/engine/dependency';
import { NesoiError } from '~/engine/data/error';
import { ExternalTrxNode } from './external.trx_node';
import type { TopicInput } from '~/elements/blocks/topic/topic.types';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class TopicTrxNode<S extends $Space, M extends $Module, $ extends $Topic> {
    
    private external: boolean
    private resource?: Topic<any, M, $>

    constructor(
        private trx: TrxNode<any, M, any>,
        private tag: Tag
    ) {
        const module = TrxNode.getModule(trx);
        this.external = tag.module !== module.name;
        if (!this.external) {
            this.resource = Tag.element(tag, trx);
            if (!this.resource) {
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
        fn: (trx: AnyTrxNode, element: Topic<any, M, $>) => Promise<any>,
        fmtTrxOut?: (out: any) => any
    ) {
        const wrapped = async (parentTrx: AnyTrxNode, resource: Topic<any, M, $>) => {
            const trx = TrxNode.makeChildNode(parentTrx, resource.schema.module, 'topic', resource.schema.name);
                
            TrxNode.open(trx, action, input);
            let out;
            try {
                out = await fn(trx, resource);
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
            return wrapped(this.trx, this.resource!)
        }
    }

    public async subscribe(fn: (msg: AnyMessage) => void): Promise<string> {
        return this.wrap('subscribe', {}, (trx, topic) => {
            return topic.subscribe(trx, fn)
        })
    }

    public async unsubscribe(id: string): Promise<void> {
        return this.wrap('unsubscribe', { id }, (trx, topic) => {
            return topic.unsubscribe(trx, id)
        })
    }

    public async publish(raw: TopicInput<$>, tenancy?: TopicTenancy<S>): Promise<void> {
        
        return this.wrap('publish', { raw }, (trx, topic) => {
            
            const _raw = raw as Record<string, any>;
            // Special case for Jobs with a '' inline message,
            // which is not required on the run method.
            if (
                !('$' in _raw)
                && topic.schema.input.some(tag => tag.full === `${topic!.module.name}::message:${topic!.schema.name}`)
            ) {
                _raw['$'] = topic.schema.name;
            }

            return topic.consumeRaw(trx, raw, tenancy)
        })
    }
}