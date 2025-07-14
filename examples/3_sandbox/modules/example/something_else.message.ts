import * as mana from '../../lib/mana';
import Nesoi from '../../nesoi';

export default Nesoi.message('example::something_else')
    .as('Bootstrap n2')
    
    .template($ => ({
        batata1: $.enum('equipment_color'),
        batata2: $.enum(['a', 'b', 'c'] as const),
        batata3: $.enum({ a: 1 as const, b: 2 as const, c: 3 as const }),
        banana: $.list($.id('circle')).rule($ => {
            return $.msg.batata1 === 'blue' || 'Não';
        }).optional,
        joao: $.obj({
            kaka: $.id('circle').rule($ => {
                return 'oi'
            })
        }),
        send: $.msg('irrigation::send_water', {}).rule(mana.rule).optional,
        attachment: $.string.rule(mana.rule)
    }));