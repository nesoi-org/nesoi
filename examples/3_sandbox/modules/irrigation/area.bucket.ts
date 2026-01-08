import Nesoi from '../../nesoi';

export default Nesoi.bucket('irrigation::area')
    .model($ => ({
        id: $.int,
        name: $.string,
        dicf: $.dict($.float),
        aba: $.list($.obj({
            a: $.int
        }))
        // dicf: $.dict($.obj({
        //     a: $.dict($.float),
        //     b: $.dict($.string),
        // }))
    }))
    // .extend('example::circle')
    .as('Área')
    .view('loco', $ => ({
        obj: $.model('aba').transform($ => $.value),
        list: $.model('aba.*').transform($ => $.value),
        list_item: $.model('aba.*.a').transform($ => $.value),
        ok: $.model('aba').map($ => $.obj($ => ({})))
        // jose: $.model('dicf')
    }));