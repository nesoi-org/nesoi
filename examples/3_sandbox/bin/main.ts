import { Log } from 'nesoi/lib/engine/util/log';
import BigRock from '../apps/bigrock.app';

Log.level = 'info';

async function main() {
    const daemon = await BigRock.daemon();

    const response = await daemon.trx('example')
        .run(async trx => {

            await trx.job('log_something').run({
                $: 'log_something.trigger',
                f: {},
                kaka: {
                    into: 3,
                    koko_id: 2
                },
                lala: true,
                prop_int: 4
            });

            // const obj = await trx.bucket('bigbox')
            //     .create({
                    
            //     })

            // // console.log(obj);
            // const boxes = await trx.bucket('bigbox').readAll();
            // // console.log(boxes);

            // return trx.machine('walker')
            //     .run({
            //         $: 'walker.walk',
            //         id: 1,
            //         run: true
            //     })
        });

    console.log(response.summary());
    // console.log(response.output?.summary());
}

main();