// Step 1:
// Import the builders for the elements you want to use.
// Also, import the LibraryRuntime.

import { JobBuilder } from 'nesoi/lib/elements/blocks/job/job.builder';
import { LibraryRuntime } from '~/engine/runtimes/library.runtime';

// Step 2:
// Use the builders to declare your elements.
// PS: External types are not available, but internal/inferred ones should work.

const calcAverageJob = new JobBuilder('my_module', 'calc_average')
    .messages($ => ({
        '': {
            values: $.float.array
        }
    }))
    .input('@')
    .output.raw<number>()
    .extra($ => ({
        sum: $.msg.values.reduce((a,x) => a+x, 0)
    }))
    .method($ => {
        console.log(`The sum of (${$.msg.values}) is ${$.extra.sum}`)
        const avg = $.extra.sum/$.msg.values.length;
        console.log(`The avg of (${$.msg.values}) is ${avg}`)
        return avg;
    })

// Step 3:
// Create a LibraryRuntime with the builders, then pre-boot it.

const runtime = new LibraryRuntime<any>('my_runtime', [
    calcAverageJob
]).boot();

// Step 4:
// Use the runtime daemon directly.
    
async function main() {   
    const daemon = await runtime.daemon();

    const response = await daemon.trx('my_module')
        .run(async trx => {
            await trx.job('calc_average').run({
                $: 'calc_average',
                values: [5, 3, 8, 9]
            })
        })
        
    console.log(response.summary());
}

main();

