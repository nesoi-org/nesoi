import { $Module } from '~/schema';
import { TrxNode } from '../trx_node';
import { $Job } from '~/elements/blocks/job/job.schema';
import { Job } from '~/elements/blocks/job/job';
import { Message } from '~/elements/entities/message/message';
import { $Message } from '~/elements/entities/message/message.schema';
import { JobInput } from '~/elements/blocks/job/job.types';
import { Tag } from '~/engine/dependency';
import { NesoiError } from '~/engine/data/error';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class JobTrxNode<M extends $Module, $ extends $Job> {

    private external: boolean;
    private job?: Job<any, M, $>;

    constructor(
        private trx: TrxNode<any, M, any>,
        private tag: Tag,
        private ctx?: Record<string, any>
    ) {
        const module = TrxNode.getModule(trx);
        this.external = tag.module !== module.name;
        if (!this.external) {
            this.job = tag.element(trx);
            if (!this.job) {
                throw NesoiError.Trx.NodeNotFound(this.tag.full, trx.globalId);
            }
        }
    }

    async run(message: JobInput<$>): Promise<$['#output']> {
        if (!this.job) {
            throw new Error('External job not supported yet');
        }

        const trx = TrxNode.makeChildNode(this.trx, this.job.schema.module, 'job', this.job.schema.name);
        TrxNode.open(trx, 'run', message);

        // Special case for Jobs with a '' inline message,
        // which is not required on the run method.
        if (
            !('$' in message)
            && this.job.schema.input.some(tag => tag.full === `${this.job!.module.name}::message:${this.job!.schema.name}`)
        ) {
            message['$'] = this.job.schema.name;
        }

        let response;
        try {
            response = await this.job.consumeRaw(trx, message as any, this.ctx) as any;
        }
        catch (e) {
            throw TrxNode.error(trx, e);
        }
        
        TrxNode.ok(trx, response);
        return response;
    }

    async forward(message: Message<$['#input']>): Promise<$['#output']> {
        if (!this.job) {
            throw new Error('External job not supported yet');
        }
        
        const trx = TrxNode.makeChildNode(this.trx, this.job.schema.module, 'job', this.job.schema.name);
        TrxNode.open(trx, 'forward', message);

        let response;
        try {
            response = await this.job.consume(trx, message as Message<$Message>, this.ctx) as any;
        }
        catch (e) {
            throw TrxNode.error(trx, e);
        }
        
        TrxNode.ok(trx, response);
        return response;
    }

}