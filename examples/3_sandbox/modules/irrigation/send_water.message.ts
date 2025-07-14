import { rule2 } from '../../lib/mana';
import Nesoi from '../../nesoi';

export default Nesoi.message('irrigation::send_water')
    .as('Send Water')
    .template($ => ({
        area: $.id('area'),
        box: $.id('example::bigbox').rule(rule2)
    }));