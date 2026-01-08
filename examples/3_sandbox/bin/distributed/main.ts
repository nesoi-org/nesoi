import { Log } from 'nesoi/lib/engine/util/log';
import Mandala from '../apps/mandala.app';

Log.level = 'info';

async function main() {
    const daemon = await Mandala.daemon();

    daemon.nodes['mandala-beta-2'].trx('irrigation').run(trx => {
        return trx.job('example::bigbox.create').run({
            prop_enum: 'blue',
            prop_enum_1: 'rgb',
        })
    })
}

main();