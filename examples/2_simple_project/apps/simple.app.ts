import { MonolythApp } from '~/bundler/monolyth/monolyth.app';
import Nesoi from '../nesoi';

export default new MonolythApp('Simple', Nesoi)

    .modules([
        'main'
    ])
    
    .config.i18n({
        'Bucket.ObjNotFound': ({ bucket, id }) => `${bucket} com id ${id} não encontrado(a)`
    })