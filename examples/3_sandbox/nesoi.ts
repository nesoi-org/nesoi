import { Space } from 'nesoi/lib/engine/space';

type A = MagicGarden.Irrigation.AreaBucket.DefaultView

const Nesoi = new Space<MagicGarden>(__dirname)
    .name('MagicGarden')
    .auth('api', $ => ({
        id: $.int,
        name: $.string
    }))
    .auth('token', $ => ({
        id: $.string,
        reference: $.string
    }));

export default Nesoi;