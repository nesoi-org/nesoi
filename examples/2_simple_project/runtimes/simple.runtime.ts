import { MonolythRuntime } from 'nesoi/lib/engine/runtimes/monolyth.runtime';
import Nesoi from '../nesoi';

export default new MonolythRuntime('Simple', Nesoi)

    .modules([
        'main'
    ])
    
    .config.i18n({
        'Bucket.ObjNotFound': ({ bucket, id }) => `${bucket} com id ${id} não encontrado(a)`
    })