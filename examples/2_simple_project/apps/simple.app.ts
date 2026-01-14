import { MonolythApp } from '~/engine/app/native/monolyth.app';
import Nesoi from '../nesoi';

export default new MonolythApp('Simple', Nesoi)

    .modules([
        'main'
    ])
    
    .config.i18n({
        'Bucket.ObjNotFound': ({ bucket, id }) => `Error: Bucket ${bucket} with id ${id} not found.`
    })
