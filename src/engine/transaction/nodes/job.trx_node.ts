import { $Module } from '~/schema';
import { TrxNode } from '../trx_node';
import { $Job } from '~/elements/blocks/job/job.schema';
import { Job } from '~/elements/blocks/job/job';
import { Message } from '~/elements/entities/message/message';
import { $Message } from '~/elements/entities/message/message.schema';
import { JobInput } from '~/elements/blocks/job/job.types';

export class JobTrxNode<M extends $Module, $ extends $Job> {
    constructor(
        private trx: TrxNode<any, M, any>,
        private job: Job<any, M, $>,
        private ctx?: Record<string, any>
    ) {}

    async run(message: JobInput<$>): Promise<$['#output']> {
        const trx = TrxNode.makeChildNode(this.trx, this.job.schema.module, 'job', this.job.schema.name);
        await TrxNode.open(trx, 'run', message);

        // Special case for Jobs with a '' inline message,
        // which is not required on the run method.
        if (
            !('$' in message)
            && this.job.schema.input.some(dep => dep.tag === `${this.job.module.name}::message:${this.job.schema.name}`)
        ) {
            message['$'] = this.job.schema.name;
        }

        let response;
        try {
            response = await this.job.consumeRaw(trx, message as any, this.ctx) as any;
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }
        
        await TrxNode.ok(trx, response);
        return response;
    }

    async forward(message: Message<$['#input']>): Promise<$['#output']> {
        const trx = TrxNode.makeChildNode(this.trx, this.job.schema.module, 'job', this.job.schema.name);
        await TrxNode.open(trx, 'forward', message);

        let response;
        try {
            response = await this.job.consume(trx, message as Message<$Message>, this.ctx) as any;
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }
        
        await TrxNode.ok(trx, response);
        return response;
    }

}