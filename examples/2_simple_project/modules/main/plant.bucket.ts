import Nesoi from '../../nesoi';

export default Nesoi.bucket('main::plant')
    .as('Planta')
    .model($ => ({
        id: $.int,
        species: $.string,
        color: $.enum(['green', 'blue', 'pink']),
        length: $.float
    }))