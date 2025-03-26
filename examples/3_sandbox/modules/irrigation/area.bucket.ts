import Nesoi from '../../nesoi';

export default Nesoi.bucket('irrigation::area')
    // .model($ => ({
    //     id: $.int,
    //     name: $.string
    // }))
    .extend('example::circle')
    .as('Área')
    .view('loco', $ => ({
        jose: $.model('name')
    }));