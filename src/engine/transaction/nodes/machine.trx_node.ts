import { $Module } from '~/schema';
import { TrxNode } from '../trx_node';
import { $Machine } from '~/elements/blocks/machine/machine.schema';
import { Machine, MachineOutput } from '~/elements/blocks/machine/machine';
import { Message } from '~/elements/entities/message/message';
import { $Message } from '~/elements/entities/message/message.schema';

export class MachineTrxNode<M extends $Module, $ extends $Machine> {
    constructor(
        private trx: TrxNode<any, M, any>,
        private machine: Machine<any, M, $>
    ) {}

    async run(message: $['#input']['#raw']): Promise<MachineOutput> {
        const trx = TrxNode.makeChildNode(this.trx, this.machine.schema.module, 'machine', this.machine.schema.name);
        await TrxNode.open(trx, 'run', message);

        let response;
        try {
            response = await this.machine.consumeRaw(trx, message) as any;
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }
        
        await TrxNode.ok(trx, response);
        return response;
    }

    async forward(message: Message<$['#input']>): Promise<MachineOutput> {
        const trx = TrxNode.makeChildNode(this.trx, this.machine.schema.module, 'machine', this.machine.schema.name);
        await TrxNode.open(trx, 'forward', message);

        let response;
        try {
            response = await this.machine.consume(trx, message as Message<$Message>) as any;
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }
        
        await TrxNode.ok(trx, response);
        return response;
    }

}