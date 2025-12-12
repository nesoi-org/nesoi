import Nesoi from '../../nesoi';

export default Nesoi.bucket('irrigation::area')
    .model($ => ({
        id: $.int,
        name: $.string,
        dicf: $.dict($.float)
        // dicf: $.dict($.obj({
        //     a: $.dict($.float),
        //     b: $.dict($.string),
        // }))
    }))
    // .extend('example::circle')
    .as('Área')
    .view('loco', $ => ({
        // jose: $.model('dicf')
    }));