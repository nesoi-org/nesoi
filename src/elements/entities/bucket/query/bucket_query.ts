import type { NQL_AnyQuery, NQL_Pagination, NQL_Part } from './nql.schema';
import { Log } from '~/engine/util/log';
import { Tag } from '~/engine/dependency';
import { NQL_Engine, type NQL_Result } from './nql_engine';
import { NQL_Compiler } from './nql_compiler';
import { MemoryNQLRunner } from '../adapters/memory.nql';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';

/**
 * A helper to run queries. It handles:
 * - Internal vs. External buckets
 * - Param templates from Indexes
 * - Optimization of multiple params query (2-step query)
 */

export class BucketQuery {

    public static async run(
        trx: AnyTrxNode,
        tag: Tag,
        query: NQL_AnyQuery,
        params: Record<string, any>[] = [],
        options: {
            pagination?: NQL_Pagination,
            indexes?: string[][],
            metadata_only?: boolean,
            no_tenancy?: boolean
        } = {}
    ): Promise<NQL_Result> {
        Log.trace('bucket', tag.full, 'Single param query', { query, params, indexes: options.indexes });
        
        // The engine adds '%__x__%' fields to the param objects in order to handle subqueries,
        // thus we need to break the reference to the original object.
        params = params.map(p => Object.assign({}, p));

        // Params
        const param_templates = options.indexes ?
            options.indexes.map(index => index?.length
                ? Object.fromEntries(index
                    .map((s, i) => [`$${i}`, s]))
                : {}
            )
            : undefined

        // Compile query
        const compiled = await NQL_Compiler.build(trx, tag, query, !options.no_tenancy);
        
        // Find cache (TODO)
        // const adapter = await Trx.getCache(trx, this as AnyBucket) || this.adapter.nql;
        const cache = undefined;
        const runner = (part: NQL_Part) => 
            Tag.matchesSchema(tag, part.union.meta.schema!) ? cache : undefined;

        // Run query
        const result = await NQL_Engine.run(trx, compiled, params, {
            ...options,
            param_templates
        }, runner);

        if (process.env.NESOI_NQL_DEBUG) {
            console.log({
                run: 'single',
                query,
                params,
                result
            })
        }

        return result;
    }

    /**
     * Runs a query returning the result data for each parameter separately
     */
    public static async run_multi(
        trx: AnyTrxNode,
        tag: Tag,
        query: NQL_AnyQuery,
        params: Record<string, any>[],
        options: {
            pagination?: NQL_Pagination
            indexes?: string[][],
            metadata_only?: boolean,
            no_tenancy?: boolean
        } = {}
    ): Promise<Record<string, any>[][]>  {

        // Edge cases

        if (params.length == 0) {
            return []
        }
        if (params.length == 1) {
            const result = await this.run(trx, tag, query, params, options);
            return [result.data];
        }

        // The engine adds '%__x__%' fields to the param objects in order to handle subqueries,
        // thus we need to break the reference to the original object.
        params = params.map(p => Object.assign({}, p));

        Log.trace('bucket', tag.full, 'Multi param query', { query, params, indexes: options.indexes });

        /**
         * First query
         */

        // Params
        const param_templates = options.indexes ?
            options.indexes.map(index => index?.length
                ? Object.fromEntries(index
                    .map((s, i) => [`$${i}`, s]))
                : {}
            )
            : undefined

        // Compile query
        const compiled = await NQL_Compiler.build(trx, tag, query, !options.no_tenancy, true);
        
        // Find cache (TODO)
        // const adapter = await Trx.getCache(trx, this as AnyBucket) || this.adapter.nql;
        const cache = undefined;
        const runner = (part: NQL_Part) => 
            Tag.matchesSchema(tag, part.union.meta.schema!) ? cache : undefined;

        // Run first query only if the query includes non-memory bucket adapters
        let firstResult;
        if (!compiled.memoryOnly) {
            firstResult = await NQL_Engine.run(trx, compiled, params, {
                param_templates,
                return_parts: true
            }, runner);
        }

        /**
         * Create local runners
         */

        const runners: {
            [tag: string]: MemoryNQLRunner
        } = {};

        for (const i in compiled.parts) {
            const part = compiled.parts[i];
            const tag = `${part.union.meta.schema!.module}::${part.union.meta.schema!.name}`;
            
            // Scope runner is memory, use it
            if (part.union.meta.runner! instanceof MemoryNQLRunner) {
                runners[tag] ??= part.union.meta.runner;
            }
            // Scope runner is non-memory, firstResult is guaranteed to exist
            // and it's used to populate the data of a new MemoryNQLRunner.
            else {
                runners[tag] ??= new MemoryNQLRunner();
                const runnerData = (runners[tag] as any).data as MemoryNQLRunner['data'];
                const data = firstResult!.parts![i];
                for (const obj of data) {
                    runnerData[obj.id] = obj;
                }
            }
        }

        /**
         * Second query
         */
        const localRunner = (part: NQL_Part) => {
            const tag = `${part.union.meta.schema!.module}::${part.union.meta.schema!.name}`;
            return runners[tag];
        }

        const results: Record<string, any>[][] = [];
        for (let i = 0; i < params.length; i++) {
            const param = params[i];
            const param_template = param_templates?.[i];

            // Run query
            const secondResult = await NQL_Engine.run(trx, compiled, [param], {
                ...options,
                param_templates: param_template ? [param_template] : undefined
            }, localRunner);

            results.push(secondResult.data);
        }

        if (process.env.NESOI_NQL_DEBUG) {
            console.log({
                run: 'multi',
                query,
                params,
                firstResult,
                results
            })
        }

        return results;
    }

}