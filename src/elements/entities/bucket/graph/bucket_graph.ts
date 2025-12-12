import type { NQL_CompiledQuery} from '../query/nql_compiler';
import type { Bucket } from '../bucket';

import { Log } from '~/engine/util/log';
import { BucketQuery } from '../query/bucket_query';
import { NesoiError } from '~/engine/data/error';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';
import type { $Module, $Bucket, $BucketGraph } from 'index';

/**
 * @category Elements
 * @subcategory Entity
 * */
export class BucketGraph<
    M extends $Module,
    $ extends $Bucket
> {

    private bucketName: string;
    private schema: $BucketGraph;

    private linkQueries: Record<string, NQL_CompiledQuery> = {}

    constructor(
        private bucket: Bucket<M, $>
    ) {
        this.bucketName = bucket.schema.name;
        this.schema = bucket.schema.graph;
    }

    /**
     * Read the data from a link
     * 
     * - Options
     *   - `silent`: If not found, returns undefined instead of raising an exception (default: `false`)
     *   - `no_tenancy`: Don't apply tenancy rules (default: `false`)
     */
    public async readLink<
        LinkName extends keyof $['graph']['links'],
        LinkBucketName extends $['graph']['links'][LinkName]['bucket']['short'],
        LinkBucket extends M['buckets'][LinkBucketName],
        Obj = LinkBucket['#data']
    >(
        trx: AnyTrxNode,
        obj: $['#data'],
        link: LinkName,
        options: {
            index?: string[],
            silent?: boolean
            no_tenancy?: boolean
        } = {}
    ): Promise<Obj | Obj[] | undefined> {
        Log.trace('bucket', this.bucketName, `Get link ${link as string}`, options);
        const schema = this.schema.links[link as never];

        const output = await BucketQuery.run(
            trx,
            schema.bucket,
            schema.query,
            [obj],
            {
                pagination: { perPage: schema.many ? undefined : 1 },
                indexes: options.index ? [options.index] : [],
                no_tenancy: options?.no_tenancy
            }
        );

        if (schema.many) {
            return output.data as Obj[]
        }
        else {
            if (output.data.length) {
                return output.data[0] as Obj;
            }
            else if (options?.silent) {
                return undefined;
            }
            else {
                throw NesoiError.Bucket.Graph.RequiredLinkNotFound({
                    bucket: this.bucketName,
                    link: link as string,
                    id: obj.id
                });
            }
        }
    }

    /**
     * Return true if the link resolves to at least one object
     * 
     * - Options
     *   - `no_tenancy`: Don't apply tenancy rules
     */
    public async hasLink<
        LinkName extends keyof $['graph']['links'],
    >(
        trx: AnyTrxNode,
        link: LinkName,
        obj: $['#data'],
        options: {
            index?: string[],
            no_tenancy?: boolean
        } = {}
    ): Promise<boolean> {
        Log.trace('bucket', this.bucketName, `Has link ${link as string}`);
        const schema = this.schema.links[link as never];

        const output = await BucketQuery.run(
            trx,
            schema.bucket,
            schema.query,
            [obj],
            {
                pagination: { perPage: 0 },
                indexes: options.index ? [options.index] : [],
                metadata_only: true,
                no_tenancy: options?.no_tenancy
            }
        ) as any;

        return !!output.totalItems;
    }

    /**
     * Return the number of objects matching a given link
     * 
     * - Options
     *   - `no_tenancy`: Don't apply tenancy rules
     */
    public async countLink<
        LinkName extends keyof $['graph']['links'],
    >(
        trx: AnyTrxNode,
        link: LinkName,
        obj: $['#data'],
        options: {
            index?: string[]
            no_tenancy?: boolean
        } = {}
    ): Promise<number> {
        Log.trace('bucket', this.bucketName, `Count link ${link as string}`);
        const schema = this.schema.links[link as never];

        const result = await BucketQuery.run(
            trx,
            schema.bucket,
            schema.query,
            [obj],
            {
                pagination: { perPage: 0 },
                indexes: options.index ? [options.index] : [],
                metadata_only: true,
                no_tenancy: options?.no_tenancy
            }
        );

        return result.totalItems ?? -1;
    }


    /**
     * Read the data from a link
     * 
     * - Options
     *   - `silent`: If not found, returns undefined instead of raising an exception (default: `false`)
     *   - `no_tenancy`: Don't apply tenancy rules (default: `false`)
     */
    public async readManyLinks<
        LinkName extends keyof $['graph']['links'],
        LinkBucketName extends $['graph']['links'][LinkName]['bucket']['short'],
        LinkBucket extends M['buckets'][LinkBucketName],
        Obj = LinkBucket['#data']
    >(
        trx: AnyTrxNode,
        objs: $['#data'][],
        link: string,
        options: {
            indexes?: string[][],
            silent?: boolean,
            no_tenancy?: boolean
        } = {}
    ): Promise<(Obj | undefined)[] | Obj[][]> {
        Log.trace('bucket', this.bucketName, `Get link ${link as string}`, options);
        const schema = this.schema.links[link as never];

        const output = await BucketQuery.run_multi(
            trx,
            schema.bucket,
            schema.query,
            objs,
            {
                indexes: options.indexes,
            }
        );

        if (schema.many) {
            return output as Obj[][]
        }
        else {
            const final: (Obj | undefined)[] = [];
            for (let i = 0; i < output.length; i++) {
                if (output[i].length) {
                    final.push(output[i][0] as Obj);
                }
                else if (options?.silent) {
                    final.push(undefined);
                }
                else {
                    throw NesoiError.Bucket.Graph.RequiredLinkNotFound({
                        bucket: this.bucketName,
                        link: link as string,
                        id: objs[i].id
                    });
                }
            }
            return final;
        }
    }

}

export type AnyBucket = Bucket<any, any>