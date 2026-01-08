import Nesoi from '../../nesoi';

export default Nesoi.bucket('example::circle')
    .as('Círculo')
    
    .model($ => ({
        id: $.int,
        state: $.string,
        name: $.string.optional,
        radius: $.float
    }))

    .link('clone', $ => $.one('circle', {
        'id': { '.':'id' }
    }))

    .link('boot', $ => $.compose.many('bigbox', {
        'id': { '.':'id' }
    }))

    .view('round', $ => ({
        round: $.model('name')
    }))

    .view('square', $ => ({
        clown: $.link('clone')
    }));