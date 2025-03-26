import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { $ResourceJobScope } from './resource_job.schema';
import { $Job } from '../job.schema';
import { AnyMessage } from '~/elements/entities/message/message';

export class ResourceJob {
    static async method($: {
        trx: AnyTrxNode,
        msg: any,
        job: $Job,
    }) {

        const scope = $.job.scope as $ResourceJobScope;
    
        let obj;
        if (scope.method === 'update' || scope.method === 'delete') {
            obj = await $.trx.bucket(scope.bucket).readOneOrFail($.msg.id);
        }
        obj = await scope.prepareMethod({...$, obj, bucket: scope.bucket } as any);
        if (scope.execMethod) {
            obj = await scope.execMethod({...$, obj, bucket: scope.bucket } as any);
        }
        if (scope.afterMethod) {
            obj = await scope.afterMethod({...$, obj, bucket: scope.bucket } as any);
        }
        return obj;
    }
    
    // The methods below exist so the JobElement is able
    // to identify these methods and replace them with the
    // proper text on the built element.

    static async prepareMsgData($: { msg: any }) {
        return ($.msg as AnyMessage).getData();
    }
    
    static async prepareTrue() {
        return true;
    }
}