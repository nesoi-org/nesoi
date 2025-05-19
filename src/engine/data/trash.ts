import { NesoiObj } from './obj'
import { AnyTrxNode } from '../transaction/trx_node'
import { $Bucket } from '~/elements'
import { $BucketModel, $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema'
import { $BucketGraph } from '~/elements/entities/bucket/graph/bucket_graph.schema'
import { AnyModule } from '../module'

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
        id: new $BucketModelField('id','id','int','id',false,true),
        module: new $BucketModelField('module','module','string','Module Name',false,true),
        bucket: new $BucketModelField('bucket','bucket','string','Bucket Name',false,true),
        object_id: new $BucketModelField('object_id','object_id','int','Object ID',false,true),
        object: new $BucketModelField('object','object','dict','Object',false,true,undefined,undefined,{
            __dict: new $BucketModelField('','','unknown','',false,true,undefined,undefined)
        }),
        delete_trx_id: new $BucketModelField('delete_trx_id','delete_trx_id','int','ID of Delete Transaction',false,true),
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