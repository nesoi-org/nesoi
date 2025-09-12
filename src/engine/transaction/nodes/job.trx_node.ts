import { $Module } from '~/schema';
import { AnyTrxNode, TrxNode } from '../trx_node';
import { $Job } from '~/elements/blocks/job/job.schema';
import { Job } from '~/elements/blocks/job/job';
import { Message } from '~/elements/entities/message/message';
import { JobInput } from '~/elements/blocks/job/job.types';
import { Tag } from '~/engine/dependency';
import { NesoiError } from '~/engine/data/error';
import { ExternalTrxNode } from './external.trx_node';

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
            this.job = Tag.element(tag, trx);
            if (!this.job) {
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
        fn: (trx: AnyTrxNode, element: Job<any, M, $>) => Promise<any>,
        fmtTrxOut?: (out: any) => any
    ) {
        const wrapped = async (parentTrx: AnyTrxNode, job: Job<any, M, $>) => {
            const trx = TrxNode.makeChildNode(parentTrx, job.schema.module, 'job', job.schema.name);    
            
            TrxNode.open(trx, action, input);
            let out;
            try {
                out = await fn(trx, job);
            }
            catch (e) {
                throw TrxNode.error(trx, e);
            }
            TrxNode.ok(trx, fmtTrxOut ? fmtTrxOut(out) : out);

            return out;
        }

        if (this.external) {
            const ext = new ExternalTrxNode(this.trx, this.tag)
            return ext.run(
                trx => Tag.element(this.tag, trx),
                wrapped
            );
        }
        else {
            return wrapped(this.trx, this.job!)
        }
    }

    async run(message: JobInput<$>): Promise<$['#output']> {
        return this.wrap('run', message, (trx, job) => {
            // Special case for Jobs with a '' inline message,
            // which is not required on the run method.
            if (
                !('$' in message)
                && job.schema.input.some(tag => tag.full === `${job!.module.name}::message:${job!.schema.name}`)
            ) {
                message['$'] = job.schema.name;
            }
            return job.consumeRaw(trx, message as any, this.ctx) as any;
        })
    }

    async forward(message: Message<$['#input']>): Promise<$['#output']> {
        return this.wrap('forward', message, (trx, job) => {
            return job.consume(trx, message)
        })
    }

}