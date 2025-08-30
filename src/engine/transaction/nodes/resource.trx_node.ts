import { $Module } from '~/schema';
import { AnyTrxNode, TrxNode } from '../trx_node';
import { Message } from '~/elements/entities/message/message';
import { $Message } from '~/elements/entities/message/message.schema';
import { $Resource } from '~/elements/blocks/resource/resource.schema';
import { Resource } from '~/elements/blocks/resource/resource';

type ViewRaw<$ extends $Resource> = $['#input.view']['#raw']
type QueryRaw<$ extends $Resource> = $['#input.query']['#raw']
type CreateRaw<$ extends $Resource> = $['#input.create']['#raw']
type UpdateRaw<$ extends $Resource> = $['#input.update']['#raw']
type DeleteRaw<$ extends $Resource> = $['#input.delete']['#raw']

/**
 * @category Engine
 * @subcategory Transaction
 */
export class ResourceTrxNode<M extends $Module, $ extends $Resource> {
    constructor(
        private trx: TrxNode<any, M, any>,
        private resource: Resource<any, M, $>
    ) {}

    async forward(message: Message<$['#input']>): Promise<$['#output']> {
        const trx = TrxNode.makeChildNode(this.trx, this.resource.schema.module, 'resource', this.resource.schema.name);
        TrxNode.open(trx, 'forward', message);

        let response;
        try {
            response = await this.resource.consume(trx, message as Message<$Message>) as any;
        }
        catch (e) {
            throw TrxNode.error(trx, e);
        }
        
        TrxNode.ok(trx, response);
        return response;
    }

    async run(raw: ViewRaw<$> | QueryRaw<$> | CreateRaw<$> | UpdateRaw<$> | DeleteRaw<$>): Promise<$['#output']> {
        const trx = TrxNode.makeChildNode(this.trx, this.resource.schema.module, 'resource', this.resource.schema.name);
        TrxNode.open(trx, 'run', raw);
        return this.consumeRaw(trx, raw as any);
    }

    async view<
        View extends keyof $['#bucket']['views'],
        Raw extends Omit<ViewRaw<$>, '$'>,
    >(raw: Raw): Promise<$['#bucket']['views'][View]['#data']> {
        const trx = TrxNode.makeChildNode(this.trx, this.resource.schema.module, 'resource', this.resource.schema.name);
        TrxNode.open(trx, 'view', raw);
        const inRaw = Object.assign({}, raw) as any;
        inRaw.$ = `${this.resource.schema.name}.view`;
        return this.consumeRaw(trx, inRaw);
    }

    async query<
        View extends keyof $['#bucket']['views'],
        Raw extends Omit<QueryRaw<$>, '$'>,
    >(raw: Raw): Promise<$['#bucket']['views'][View]['#data']> {
        const trx = TrxNode.makeChildNode(this.trx, this.resource.schema.module, 'resource', this.resource.schema.name);
        TrxNode.open(trx, 'query', raw);
        const inRaw = Object.assign({}, raw) as any;
        inRaw.$ = `${this.resource.schema.name}.query`;
        return this.consumeRaw(trx, inRaw);
    }

    async create(raw: Omit<CreateRaw<$>, '$'>): Promise<$['#bucket']['#data']> {
        const trx = TrxNode.makeChildNode(this.trx, this.resource.schema.module, 'resource', this.resource.schema.name);
        TrxNode.open(trx, 'create', raw);
        const inRaw = Object.assign({}, raw) as any;
        inRaw.$ = `${this.resource.schema.name}.create`;
        return this.consumeRaw(trx, inRaw);
    }

    async update(raw: Omit<UpdateRaw<$>, '$'>): Promise<$['#bucket']['#data']> {
        const trx = TrxNode.makeChildNode(this.trx, this.resource.schema.module, 'resource', this.resource.schema.name);
        TrxNode.open(trx, 'update', raw);
        const inRaw = Object.assign({}, raw) as any;
        inRaw.$ = `${this.resource.schema.name}.update`;
        return this.consumeRaw(trx, inRaw);
    }

    async delete(raw: Omit<DeleteRaw<$>, '$'>): Promise<void> {
        const trx = TrxNode.makeChildNode(this.trx, this.resource.schema.module, 'resource', this.resource.schema.name);
        TrxNode.open(trx, 'delete', raw);
        const inRaw = Object.assign({}, raw) as any;
        inRaw.$ = `${this.resource.schema.name}.delete`;
        await this.consumeRaw(trx, inRaw);
    }

    private async consumeRaw(trx: AnyTrxNode, message: $['#input']['#raw']): Promise<$['#bucket']['#data']> {
        let response;
        try {
            response = await this.resource.consumeRaw(trx, message) as any;
        }
        catch (e) {
            throw TrxNode.error(trx, e);
        }
        
        TrxNode.ok(trx, response);
        return response;
    }

}