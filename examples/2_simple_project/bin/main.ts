import { Log } from 'nesoi/lib/engine/util/log';
import Simple from '../runtimes/simple.runtime';

Log.level = 'info';

async function main() {
    const daemon = await Simple.daemon();

    const response = await daemon.trx('main')
        .run(async trx => {

            const plant = await trx.bucket('plant')
                .create({
                    color: 'green',
                    length: 10,
                    species: 'Spathiphyllum wallisii'
                })

            await trx.job('irrigate')
                .run({
                    $: 'irrigate',
                    plant_id: 3,
                    volume: 3
                })
        });

    console.log(response.summary());
}

main();