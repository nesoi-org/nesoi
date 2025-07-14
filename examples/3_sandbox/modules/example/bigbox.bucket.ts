import Nesoi from '../../nesoi';

export default Nesoi.bucket('example::bigbox')
    .as('Big Box')
    .model($ => ({
        id: $.int,
        state: $.string,
        namhe: $.string.optional,
        amount: $.float,
        la: $.enum(['a','b','c'] as const),
        la2: $.enum('example::color_type'),
        simplelist: $.list($.int),
        simpleobj: $.list($.obj({
            a: $.int,
            b: $.boolean,
            c: $.list($.obj({
                d: $.float,
                e: $.int
            }))
        })),
        kaka: $.list($.obj({
            lala: $.obj({
                koko: $.boolean
            })
        })).default([{
            lala: {
                koko: true
            }
        }]),
        jojo: $.dict($.obj({
            oioi: $.int,
            ito: $.string
        })),
        reco: $.dict($.int)
    }))

    .graph($ => ({
        'a.$.b': $.one('bigbox', {
            'simpleobj.1.a <=': 1,
            'simplelist.# >=': 3,
            'simplelist.* in': [{ '.':'simplelist.$0' }],
            // 'state': { '$': 'oi.$0' }
        }),
        // other: $.one('circle', {
        //     'id': { '.':'id' }
        // })
    }))
    // .view('name_only', $ => ({
    //     name: $.model('simpleobj', {
    //         loco: $.graph('is_taught_by')
    //     }),
    //     coco: $.computed($ => 3),
    //     deep: {
    //         nococo: $.computed($ => -3),
    //         level2: $.model('simpleobj', {
    //             a: $.model('simpleobj.#.a')
    //         })
    //     }
    // }))
    .view('family', $ => ({
        first_clone: $.graph('a.$.b'),
        surname: $.computed($ => {
            const a: number = 123;
            return a + 456;
        }),
        loco: $.model('simpleobj.*.a')
    }))
    .view('teste', $ => $.extend('family', {
        // kakaka: $.graph('is_taught_by'),
        lolo: $.view('family')
    }));