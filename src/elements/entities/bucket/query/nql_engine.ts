import { type NQL_CompiledQuery } from './nql_compiler';
import { type AnyTrxNode } from '~/engine/transaction/trx_node';
import type { NQL_Pagination, NQL_Part, NQL_Union } from './nql.schema';

type Obj = Record<string, any>

export type NQL_Result<T = Obj> = {
    data: T[]
    totalItems?: number
    page?: number
    perPage?: number
    parts?: Record<number, Record<string, any>[]>
}

/**
 * @category NQL
 * Each bucket adapter contains a NQL Runner.
 * The engine can also spawn dynamic runners for specific operations.
 * */
export abstract class NQLRunner {

    abstract run(
        trx: AnyTrxNode,
        part: NQL_Part,
        params: Record<string, any>[],
        options?: {
            pagination?: NQL_Pagination,
            param_templates?: Record<string, string>[],
            metadata_only?: boolean,
            tenancy?: NQL_Union
        }
    ): Promise<NQL_Result>

}

/**
 * @category NQL
 * The NQL Engine is global for the app.
 * When a query is compiled by the NQL Compiler, it stores references to all
 * NQL runners. This allows any module to query any other module directly.
 * These references are read through the daemon, which validates the external
 * dependencies to ensure queries don't cross module boundaries when not allowed,
 * and also handles distributed systems.
 * */
export class NQL_Engine {

    // Public interface

    static async run<
        MetadataOnly extends boolean
    >(
        trx: AnyTrxNode,
        query: NQL_CompiledQuery,
        params: Record<string, any>[] = [],
        options: {
            pagination?: NQL_Pagination,
            param_templates?: Record<string, string>[],
            metadata_only?: MetadataOnly,
            return_parts?: MetadataOnly
        } = {},
        customRunner?: (part: NQL_Part) => NQLRunner | undefined
    ): Promise<NQL_Result> {        
        if (!params.length) params = [{}];

        const parts: Record<number, Record<string, any>[]> = {};
        let result: NQL_Result = {
            data: []
        };
        for (let i = 0; i < query.execOrder.length; i++) {
            const part_i = query.execOrder[i];
            const part = query.parts[part_i];

            // Run part
            const runner = customRunner?.(part) ?? part.union.meta.runner!;

            const out = await runner.run(trx, part, params, options);
            result = out;
            parts[part_i] = out.data;
            
            // Part failed, return
            // Failure here is only when a single value is expected,
            if (!part.many) {
                if (result.data.length === 0) {
                    return {
                        data: []
                    }
                }
            }

            // Fill part params
            for (const paramGroup of params) {
                paramGroup[`%__${part_i}__%`] = part.many ? result.data : result.data[0];
            }
        }

        return {
            ...result,
            parts: options.return_parts ? parts : undefined
        };
    }

    

}