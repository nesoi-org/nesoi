import type { AnyModule } from '../module'

import { $Bucket } from '~/elements/entities/bucket/bucket.schema'
import { $BucketModel, $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema'
import { $BucketGraph } from '~/elements/entities/bucket/graph/bucket_graph.schema'
import type { AnyTrxNode } from '../transaction/trx_node'

export type TrashObj = {
    id: number

    module: string
    bucket: string

    object_id: string
    object: Record<string, any>
    
    delete_trx_id: string
}

export const $TrashBucket = new $Bucket(
    '__trash__',
    'trash',
    'Trash',
    new $BucketModel({
        id: new $BucketModelField('id','id','int','id',true),
        module: new $BucketModelField('module','module','string','Module Name',true),
        bucket: new $BucketModelField('bucket','bucket','string','Bucket Name',true),
        object_id: new $BucketModelField('object_id','object_id','int','Object ID',true),
        object: new $BucketModelField('object','object','dict','Object',true,undefined,undefined,{
            '#': new $BucketModelField('','','unknown','',true,undefined,undefined)
        }),
        delete_trx_id: new $BucketModelField('delete_trx_id','delete_trx_id','string','ID of Delete Transaction',true),
    }),
    new $BucketGraph(),
    {}
)

export class Trash {

    public static async add<
        Obj extends NesoiObj
    >(
        trx: AnyTrxNode,
        module: AnyModule,
        bucket: string,
        object: Obj
    ) {
        if (!module.trash) return;
        await module.trash.create(trx, {
            module: module.name,
            bucket,
            object_id: object.id,
            object,
            delete_trx_id: trx.globalId
        })
    }

    public static async addMany<
        Obj extends NesoiObj
    >(
        trx: AnyTrxNode,
        module: AnyModule,
        bucket: string,
        objects: Obj[]
    ) {
        for (const object of objects) {
            await this.add(trx, module, bucket, object);
        }
    }
}