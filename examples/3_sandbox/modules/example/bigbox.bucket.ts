import Nesoi from '../../nesoi';

export default Nesoi.bucket('example::bigbox')
    .as('Big Box')

// .tenancy({
//     'api': acc => ({
//         namhe: acc.name
//     })
// })

    .model($ => ({
        id: $.int,
        // state: $.string,
        // namhe: $.string.optional,
        // amount: $.float,
        // la: $.enum(['a','b','c'] as const),
        // la2: $.enum('example::color_type'),
        simplelist: $.list($.obj({
            koko: $.string,
            val: $.int
        })),
        // simpleobj: $.list($.obj({
        //     a: $.int,
        //     b: $.boolean,
        //     c: $.list($.obj({
        //         d: $.float,
        //         e: $.int
        //     }))
        // })),
        // kaka: $.list($.obj({
        //     lala: $.obj({
        //         koko: $.boolean
        //     })
        // })).default([{
        //     lala: {
        //         koko: true
        //     }
        // }]),
        // jojo: $.dict($.obj({
        //     oioi: $.int,
        //     ito: $.string
        // })),
        // reco: $.dict($.int)
    }))

    .graph($ => ({
        // 'a.$.b': $.one('bigbox', {
        //     'simpleobj.1.a <=': 1,
        //     'simplelist.# >=': 3,
        //     'simplelist.* in': [{ '.':'simplelist.$0' }],
        //     // 'state': { '$': 'oi.$0' }
        // }),
        other: $.many('bigbox', {
            'id': { '.':'id' }
        } as never)
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
    .view('oi', $ => ({
        q: $.graph('other')
        // q: $.model('simplelist')
            // .each
            .pick(1)
            .pick('simplelist')
            .group_by('koko')
            // .pick('id')
            .transform($ => parseInt($.value.a.toString())*2)
            // .expand($ => ({
            //     k: $.computed($ => $.value)
            // }))
            // .pick('k')
            .chain($ => $.computed($ => 'oi'+$.parent))
            .chain($ => $.model('simplelist'))
            .expand($ => ({
                q: $.query('other', {} as never, $ => ({
                    p: $.value[0]
                }))
            }))
    }))
    // .view('family', $ => ({
    //     first_clone: $.graph('a.$.b'),
    //     surname: $.computed($ => {
    //         const a: number = 123;
    //         return a + 456;
    //     }),
    //     loco: $.model('simpleobj.*.a')
    // }))
    // .view('teste', $ => $.extend('family', {
    //     // kakaka: $.graph('is_taught_by'),
    //     lolo: $.view('family')
    // }));