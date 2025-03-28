import { Space } from 'nesoi/lib/engine/space';
import MagicGarden from './.nesoi/magic_garden';

const Nesoi = new Space<MagicGarden>(__dirname)
    .name('MagicGarden')
    .authn('api', $ => ({
        id: $.int,
        name: $.string
    }))
    .authn('token', $ => ({
        id: $.string,
        reference: $.string
    }));

export default Nesoi;