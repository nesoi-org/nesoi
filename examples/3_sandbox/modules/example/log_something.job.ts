import Nesoi from '../../nesoi';
import { Wat } from '../../lib/magic';

export default Nesoi.job('example::log_something')
    .as('Log Something')
    .scope('machine:walker')
    .authn('api')

    .messages($ => ({
        'trigger': {
            lala: $.boolean,
            prop_int: $.int,
            kaka: $.obj({
                into: $.int.rule($ => $.value > 3 || 'Nah'),
                koko: $.id('bigbox')
            }),
            f: $.dict($.boolean)
        },
        '': {
            joca: $.int.rule($ => $.value > 5 || 'Wow'),
            f: $.dict($.boolean)
        }
        // 'response': {
        //     lele: $.boolean,
        //     ido: $.id('bigbox'),
        //     koko: {
        //         papa: $.id('bigbox')
        //     }
        // },
    }))

    .input(
        '@.trigger',
        'everything',
        '@'
    )
    .output.raw<boolean>()

    .extra($ => ({
        l: $.obj.reco,
        lala2: $.msg.$ === 'everything'
            ? $.msg.prop_boolean
            : $.msg.f
    }))
            
    .extra(async $ => ({
        lala27: !!$.extra.lala2,
        wat: await $.trx.bucket('bigbox')
            .viewOne(1, 'family')
    }))

    .assert($ => 
        $.msg.$ === 'log_something.trigger'
            ? 'Oloco!'
            : true
    )

// .assert($ => 
//     $.extra.lala27
//         ? 'Oloco!'
//         : true
// )

    .method(async $ => {

        

        // $.msg
        const val = $.trx.enum('equipment_color').get('red');

        const { kapoof } = await import('../../lib/magic');
        kapoof();
        function k(a: Wat) {}

        // if ($.msg.$ === 'everything') {
        //     return {
        //         $: 'bigbox_2',
        //         batata1: '#0000ff',
        //         batata2: 'a',
        //         banana: {} as any,
        //         batata3: 2,
        //         joao: {
        //             kaka: {} as any
        //         }
        //     };
        // }
        return true;
    });