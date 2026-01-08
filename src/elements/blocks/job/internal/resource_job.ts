import type { AnyMessage } from '~/elements/entities/message/message';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';

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
        // 
        const id = $.msg.id;
        const scope = $.job.scope as $ResourceJobScope;
    
        let obj = $.obj;
        obj = await scope.prepareMethod({...$, obj, bucket: scope.bucket } as any);
        
        // Preserve the original message ID (if any),
        // if the prepare method mistakenly changed it
        if (scope.method === 'update') {
            obj.id = id;
        }
        // On delete, the method returns a boolean, so replace it with the id. 
        else if (scope.method === 'delete') {
            if (!obj) return;
            obj = { ...$.obj, id }
        }

        if (scope.execMethod) {
            const execRes = await scope.execMethod({...$, obj, bucket: scope.bucket } as any);
            if (scope.method !== 'delete') {
                obj = execRes;
            }
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