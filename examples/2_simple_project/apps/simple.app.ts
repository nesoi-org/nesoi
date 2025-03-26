import { MonolythApp } from 'nesoi/lib/engine/apps/monolyth.app';
import Nesoi from '../nesoi';

export default new MonolythApp('Simple', Nesoi)

    .modules([
        'main'
    ])
    
    .config.i18n({
        'Bucket.ObjNotFound': ({ bucket, id }) => `${bucket} com id ${id} não encontrado(a)`
    })