import type { $Module, $Space } from '~/schema';
import type { $Resource } from './resource.schema';
import type { NesoiObj, NesoiObjId } from '~/engine/data/obj';
import type { AnyMessage } from '~/elements/entities/message/message';
import type { Module } from '~/engine/module';
import type { AnyTrxNode} from '~/engine/transaction/trx_node';
import type { ResourceAssertions } from '../job/internal/resource_job.builder';
import type { $ResourceJobScope } from '../job/internal/resource_job.schema';
import type { $Job } from '../job/job.schema';
import type { NQL_Sort } from '~/elements/entities/bucket/query/nql.schema';

import { Block } from '~/elements/blocks/block';
import { TrxNode } from '~/engine/transaction/trx_node';
import { NesoiError } from '~/engine/data/error';
import { Tag } from '~/engine/dependency';
import { Daemon } from '~/engine/daemon';

/**
 * @category Elements
 * @subcategory Block
 */
export class Resource<
    S extends $Space,
    M extends $Module,
    $ extends $Resource
> extends Block<S, M, $> {
    
    constructor(
        public module: Module<S, M>,
        public schema: $
    ) {
        super('resource', module, schema);
    }

    protected async run(trx: TrxNode<S, M, $['#authn']>, msg: AnyMessage) {

        if (msg.$.endsWith('.view')) {
            return this.view(trx, msg as any);
        }

        if (msg.$.endsWith('.query')) {
            return this.query(trx, msg as any);
        }

        if (msg.$.endsWith('.create')) {
            return this.create(trx, msg);
        }

        if (msg.$.endsWith('.update')) {
            return this.update(trx, msg as any);
        }

        if (msg.$.endsWith('.delete')) {
            return this.delete(trx, msg as any);
        }

    }

    private async view(trx: TrxNode<S, M, $['#authn']>, msg: AnyMessage & {
        id?: string | number
        view: string
        query: Record<string, any>[]
        perPage: number
        page: number
        sort?: NQL_Sort<any>
    }) {
        if (!this.schema.jobs.view) {
            throw NesoiError.Resource.ViewNotSupported(this.schema);
        }
        return trx.job(this.schema.jobs.view.short).forward(msg);
    }

    private async query(trx: TrxNode<S, M, $['#authn']>, msg: AnyMessage & {
        view: string
        query: Record<string, any>[]
        perPage: number
        page: number
        sort?: NQL_Sort<any>
    }) {
        if (!this.schema.jobs.query) {
            throw NesoiError.Resource.QueryNotSupported(this.schema);
        }
        return trx.job(this.schema.jobs.query.short).forward(msg);
    }

    private async create(trx: TrxNode<S, M, $['#authn']>, msg: AnyMessage) {
        if (!this.schema.jobs.create) {
            throw NesoiError.Resource.CreateNotSupported(this.schema);
        }
        return TrxNode.jobWithCustomCtx(trx, this.schema.jobs.create.short, {
            that: (type: any, arg: any) => Resource.assertThat(trx, this.schema.bucket, undefined, type, arg)
        }).forward(msg);
    }

    private async update(trx: TrxNode<S, M, $['#authn']>, msg: AnyMessage & { id: NesoiObjId }) {
        if (!this.schema.jobs.update) {
            throw NesoiError.Resource.UpdateNotSupported(this.schema);
        }
        const obj = await trx.bucket(this.schema.bucket.short).readOneOrFail(msg.id);
        return TrxNode.jobWithCustomCtx(trx, this.schema.jobs.update.short, {
            that: (type: any, arg: any) => Resource.assertThat(trx, this.schema.bucket, obj, type, arg),
            obj,
        })
            .forward(msg);
    }

    private async delete(trx: TrxNode<S, M, $['#authn']>, msg: AnyMessage & { id: NesoiObjId }) {
        if (!this.schema.jobs.delete) {
            throw NesoiError.Resource.DeleteNotSupported(this.schema);
        }
        const obj = await trx.bucket(this.schema.bucket.short).readOneOrFail(msg.id);
        return TrxNode.jobWithCustomCtx(trx, this.schema.jobs.delete.short, {
            that: (type: any, arg: any) => Resource.assertThat(trx, this.schema.bucket, obj, type, arg),
            obj,
        })
            .forward(msg);
    }

    /* Implementations */

    public static view($: {
        trx: AnyTrxNode,
        msg: any,
        job: $Job
    }) {
        const scope = $.job.scope as $ResourceJobScope
        // TODO: sort
        return $.msg.id
            ? $.trx.bucket(scope.bucket).viewOneOrFail($.msg.id, $.msg.view)
            : $.trx.bucket(scope.bucket).viewAll($.msg.view)
    }

    public static async query($: {
        trx: AnyTrxNode,
        msg: any,
        job: $Job
    }) {
        const scope = $.job.scope as $ResourceJobScope
        const route = scope.routes![$.msg.view];
        
        if (!route) {
            throw NesoiError.Resource.QueryRouteNotFound($.job, $.msg.view);
        }
        if (route.auth.length) {
            await TrxNode.checkAuth($.trx, route.auth);
        }
        if (route.query) {
            Object.assign($.msg.query, {
                '#and __resource_query': route.query
            })
        }
        $.msg.view = route.view;

        // Default sorting
        if (!('#sort' in $.msg.query) || !$.msg.query['#sort']?.length) {
            const module = TrxNode.getModule($.trx);
            const tag = Tag.fromNameOrShort(scope.module, 'bucket', scope.bucket);
            const { meta } = Daemon.getBucketReference(module.daemon!, tag);
            $.msg.query['#sort'] = `${meta.updated_at}@desc`;
        }

        return $.trx.bucket(scope.bucket)
            .viewQuery($.msg.query, $.msg.view).page({
                page: $.msg.page,
                perPage: $.msg.perPage,
                returnTotal: true
            });
    }

    public static create($: {
        trx: AnyTrxNode,
        obj: any,
        job: $Job
    }) {
        const scope = $.job.scope as $ResourceJobScope
        return $.trx.bucket(scope.bucket)
            .create($.obj);
    }

    public static update($: {
        trx: AnyTrxNode,
        obj: any,
        job: $Job
    }) {
        const scope = $.job.scope as $ResourceJobScope
        return $.trx.bucket(scope.bucket)
            .patch($.obj);
    }

    public static delete($: {
        trx: AnyTrxNode,
        obj: any,
        job: $Job
    }) {
        const scope = $.job.scope as $ResourceJobScope
        return $.trx.bucket(scope.bucket)
            .delete($.obj.id);
    }
    
    // Custom assertions

    public static assertThat(trx: AnyTrxNode, bucket: Tag, obj: NesoiObj|undefined, type: keyof ResourceAssertions<any>, arg: any) {
        return {
            else: async (error: string) => {
                let out = false;
                if (type === 'query is empty') {
                    out = !(await trx.bucket(bucket.short)
                        .query(arg)
                        .params(obj as Record<string, any>)
                        .first())
                }
                else if (type === 'has no link') {
                    if (!obj) out = true;
                    else {
                        out = !(await trx.bucket(bucket.short)
                            .hasLink(obj.id, arg))
                    }
                }
                return out || error
            }
        }
    }

}

export type AnyResource = Resource<any, any, any>