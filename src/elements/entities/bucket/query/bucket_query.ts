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
 * - Optimization of multiple bindings query (2-step query)
 */

export class BucketQuery {

    public static async run(
        trx: AnyTrxNode,
        tag: Tag,
        query: NQL_AnyQuery,
        binding: Record<string, any>,
        template: string[],
        options: {
            pagination?: NQL_Pagination,
            roots?: string[],
            no_tenancy?: boolean
            return_total?: boolean
        } = {}
    ): Promise<NQL_Result> {
        Log.trace('bucket', tag.full, 'Single bind query', { query, binding, template });
        
        // The engine adds '%__x__%' fields to the bindings in order to handle subqueries,
        // thus we need to break the reference to the original object, to avoid side-effects.
        binding = {...binding};

        // Templates
        const template_map = Object.fromEntries(template
            .map((s, i) => [`$${i}`, s]));

        // Compile query
        const compiled = await NQL_Compiler.build(trx, tag, query, {
            roots: options?.roots,
            no_tenancy: options?.no_tenancy
        });
        
        // Find cache (TODO)
        // const adapter = await Trx.getCache(trx, this as AnyBucket) || this.adapter.nql;
        const cache = undefined;
        const runner = (part: NQL_Part) => 
            Tag.matchesSchema(tag, part.union.meta.schema!) ? cache : undefined;

        // Run query
        const result = await NQL_Engine.run(trx, compiled, [binding], [template_map], {
            pagination: options?.pagination,
            return_total: options?.return_total
        }, runner);

        if (process.env.NESOI_NQL_DEBUG) {
            Log.info('bucket', tag.full, 'Query results:', {
                bind: 'single',
                query,
                binding,
                template,
                result
            });
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
        bindings: Record<string, any>[],
        templates: string[][],
        options: {
            pagination?: NQL_Pagination
            roots?: string[],
            no_tenancy?: boolean
            return_total?: boolean
        } = {}
    ): Promise<Record<string, any>[][]>  {

        // Edge cases

        if (bindings.length == 0) {
            return []
        }
        if (bindings.length == 1) {
            const result = await this.run(trx, tag, query, bindings[0], templates[0], options);
            return [result.data];
        }

        // The engine adds '%__x__%' fields to the param objects in order to handle subqueries,
        // thus we need to break the reference to the original object.
        bindings = bindings.map(p => ({ ...p }));

        Log.trace('bucket', tag.full, 'Multi bind query', { query, bindings, templates });

        /**
         * First query
         */

        // Templates
        const template_maps = templates.map(template =>
            Object.fromEntries(template
                .map((s, i) => [`$${i}`, s]))
        )

        // Compile query
        const compiled = await NQL_Compiler.build(trx, tag, query, {
            no_tenancy: !options.no_tenancy,
            scope_by_tag: true
        });
        
        // Find cache (TODO)
        // const adapter = await Trx.getCache(trx, this as AnyBucket) || this.adapter.nql;
        const cache = undefined;
        const runner = (part: NQL_Part) => 
            Tag.matchesSchema(tag, part.union.meta.schema!) ? cache : undefined;

        // Run first query only if the query includes non-memory bucket adapters
        let firstResult;
        if (!compiled.memoryOnly) {
            firstResult = await NQL_Engine.run(trx, compiled, bindings, template_maps, {
                return_total: options?.return_total,
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
        for (let i = 0; i < bindings.length; i++) {
            const binding = bindings[i];
            const template = template_maps?.[i];

            // Run query
            const secondResult = await NQL_Engine.run(trx, compiled, [binding], [template], {

            }, localRunner);

            results.push(secondResult.data);
        }

        if (process.env.NESOI_NQL_DEBUG) {
            console.log({
                run: 'multi',
                query,
                bindings,
                firstResult,
                results
            })
        }

        return results;
    }

}