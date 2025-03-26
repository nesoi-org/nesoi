import Nesoi from '../../nesoi';

export default Nesoi.message('example::something_else')
    .as('Bootstrap n2')
    
    .template($ => ({
        batata1: $.enum('equipment_color'),
        batata2: $.enum(['a', 'b', 'c'] as const),
        batata3: $.enum({ a: 1 as const, b: 2 as const, c: 3 as const }),
        banana: $.id('circle'),
        joao: $.obj({
            kaka: $.id('circle').rule($ => {
                return 'oi'
            })
        })
    }));