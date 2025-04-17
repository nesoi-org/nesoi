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
        simpleobj: $.obj({
            a: $.int,
            b: $.boolean,
            c: $.obj({
                d: $.float,
                e: $.int
            }).array
        }).array,
        kaka: $.obj({
            lala: $.obj({
                koko: $.boolean
            })
        }).array.default([{
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
        is_taught_by: $.one('bigbox', {
            'id': { '.':'id' }
        }),
        other: $.one('circle', {
            'id': { '.':'id' }
        })
    }))
    .view('name_only', $ => ({
        name: $.model('simpleobj', {
            loco: $.graph('is_taught_by')
        }),
        coco: $.computed($ => 3),
        deep: {
            nococo: $.computed($ => -3),
            level2: $.model('simpleobj', {
                a: $.model('simpleobj.#.a')
            })
        }
    }))
    .view('family', $ => ({
        first_clone: $.graph('other', 'round'),
        surname: $.computed($ => {
            const a: number = 123;
            return a + 456;
        }),
        loco: $.view('name_only')
    }))
    .view('teste', $ => $.extend('family', {
        kakaka: $.graph('is_taught_by'),
        lolo: $.view('family')
    }));