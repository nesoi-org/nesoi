import type { Message } from '~/elements/entities/message/message';
import type { Resource } from '~/elements/blocks/resource/resource';

import type { AnyTrxNode} from '../trx_node';
import { TrxNode } from '../trx_node';
import { Tag } from '~/engine/dependency';
import { NesoiError } from '~/engine/data/error';
import { ExternalTrxNode } from './external.trx_node';
import type { $Resource, $Module } from 'index';

type QueryRaw<$ extends $Resource> = $['#input.query']['#raw']
type CreateRaw<$ extends $Resource> = $['#input.create']['#raw']
type UpdateRaw<$ extends $Resource> = $['#input.update']['#raw']
type DeleteRaw<$ extends $Resource> = $['#input.delete']['#raw']

/**
 * @category Engine
 * @subcategory Transaction
 */
export class ResourceTrxNode<M extends $Module, $ extends $Resource> {
    
    private external: boolean
    private resource?: Resource<any, M, $>

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
   
    async wrap(
        action: string,
        input: Record<string, any>,
        fn: (trx: AnyTrxNode, element: Resource<any, M, $>) => Promise<any>,
        fmtTrxOut?: (out: any) => any
    ) {
        const wrapped = async (parentTrx: AnyTrxNode, resource: Resource<any, M, $>) => {
            const trx = TrxNode.makeChildNode(parentTrx, resource.schema.module, 'resource', resource.schema.name);    
            
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
            const idempotent = action === 'view' || action === 'query';
            const ext = new ExternalTrxNode(this.trx, this.tag, idempotent)
            return ext.run_and_hold(
                trx => Tag.element(this.tag, trx),
                wrapped
            );
        }
        else {
            return wrapped(this.trx, this.resource!)
        }
    }

    async forward(message: Message<$['#input']>): Promise<$['#output']> {
        return this.wrap('forward', message, (trx, resource) => {
            return resource.consume(trx, message)
        })
    }

    async run(raw: QueryRaw<$> | CreateRaw<$> | UpdateRaw<$> | DeleteRaw<$>): Promise<$['#output']> {
        return this.wrap('run', raw, (trx, resource) => {
            return resource.consumeRaw(trx, raw)
        })
    }

    async query<
        View extends keyof $['#bucket']['views'],
        Raw extends Omit<QueryRaw<$>, '$'>,
    >(raw: Raw): Promise<$['#bucket']['views'][View]['#data']> {
        return this.wrap('query', raw, (trx, resource) => {
            const inRaw = Object.assign({}, raw) as any;
            inRaw.$ = `${resource.schema.name}.query`;
            return resource.consumeRaw(trx, inRaw)
        })
    }

    async create(raw: Omit<CreateRaw<$>, '$'>): Promise<$['#bucket']['#data']> {
        return this.wrap('create', raw, (trx, resource) => {
            const inRaw = Object.assign({}, raw) as any;
            inRaw.$ = `${resource.schema.name}.create`;
            return resource.consumeRaw(trx, inRaw)
        })
    }

    async update(raw: Omit<UpdateRaw<$>, '$'>): Promise<$['#bucket']['#data']> {
        return this.wrap('update', raw, (trx, resource) => {
            const inRaw = Object.assign({}, raw) as any;
            inRaw.$ = `${resource.schema.name}.update`;
            return resource.consumeRaw(trx, inRaw)
        })
    }

    async delete(raw: Omit<DeleteRaw<$>, '$'>): Promise<void> {
        return this.wrap('delete', raw, (trx, resource) => {
            const inRaw = Object.assign({}, raw) as any;
            inRaw.$ = `${resource.schema.name}.delete`;
            return resource.consumeRaw(trx, inRaw)
        })
    }


}