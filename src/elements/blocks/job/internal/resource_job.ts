import { AnyTrxNode, TrxNode } from '~/engine/transaction/trx_node';
import { $ResourceJobScope } from './resource_job.schema';
import { $Job } from '../job.schema';
import { AnyMessage } from '~/elements/entities/message/message';

/**
 * @category Elements
 * @subcategory Block
 */
export class ResourceJob {
    static async method($: {
        trx: AnyTrxNode,
        msg: any,
        obj: Record<string, any>
        job: $Job,
    }) {
        // Check authentication
        TrxNode.checkAuthn($.trx, $.job.authn);

        // 
        const id = $.msg.id;
        const scope = $.job.scope as $ResourceJobScope;
    
        let obj = $.obj;
        obj = await scope.prepareMethod({...$, obj, bucket: scope.bucket } as any);
        
        // Preserve the original message ID (if any),
        // even if the prepare method doesn't add it
        if (scope.method === 'create' || scope.method === 'update') {
            obj.id = id;
        }
        // On delete, the method returns a boolean, so replace it with the id. 
        else {
            if (!obj) return;
            obj = { id };
        }

        if (scope.execMethod) {
            obj = await scope.execMethod({...$, obj, bucket: scope.bucket } as any);
        }
        if (scope.afterMethod) {
            await scope.afterMethod({...$, obj, bucket: scope.bucket } as any);
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