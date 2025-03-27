import Nesoi from '../../nesoi';

export default Nesoi.bucket('example::circle')
    .as('Círculo')
    
    .model($ => ({
        id: $.int,
        state: $.string,
        name: $.string.optional,
        radius: $.float
    }))

    .graph($ => ({
        clone: $.one('circle', {
            'id': { '.':'id' }
        }),
        boot: $.compose.many('bigbox', {
            'id': { '.':'id' }
        }),
    }))

    .view('round', $ => ({
        round: $.model('name')
    }))

    .view('square', $ => ({
        clown: $.graph('clone')
    }));