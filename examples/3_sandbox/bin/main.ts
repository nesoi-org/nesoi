import { Log } from 'nesoi/lib/engine/util/log';
import BigRock from '../apps/bigrock.app';
import { TrxNode } from 'nesoi/lib/engine/transaction/trx_node';
import { $Message } from 'nesoi/lib/elements/entities/message/message.schema';

Log.level = 'info';

async function main() {
    const daemon = await BigRock.daemon();

    const response = await daemon.trx('example')
        .run(async trx => {

            const module = TrxNode.getModule(trx);
            const msg = module.messages['everything'].schema as $Message;

            console.log($Message.describe(msg));
        });

    console.log(response.summary());
}

main();