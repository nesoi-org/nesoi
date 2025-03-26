import { $Module } from '~/schema';
import { $Queue } from './queue.schema';
import { Module } from '~/engine/module';

export class Queue<
    M extends $Module,
    $ extends $Queue
> {

    // private adapter: QueueAdapter

    constructor(
        public module: Module<any, M>,
        public schema: $
    ) {
    }

    // public async push(trx: TrxNode<M>, raw: RawMessageInput<M, any>) {
    //     const message = await trx.message(raw);
    //     // return this.adapter.push(trx, message);
    // }
    
    // public async pop(trx: TrxNode<M>) {
    //     // return this.adapter.pop(trx);
    // }

}

export type AnyQueue = Queue<any, any>