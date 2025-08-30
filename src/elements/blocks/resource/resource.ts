import { $Module, $Space } from '~/schema';
import { $Resource } from './resource.schema';
import { Block } from '~/elements/blocks/block';
import { NesoiObj, NesoiObjId } from '~/engine/data/obj';
import { AnyMessage } from '~/elements/entities/message/message';
import { Module } from '~/engine/module';
import { AnyTrxNode, TrxNode } from '~/engine/transaction/trx_node';
import { NesoiError } from '~/engine/data/error';
import { Tag } from '~/engine/dependency';
import { ResourceAssertions } from '../job/internal/resource_job.builder';
import { $ResourceJobScope } from '../job/internal/resource_job.schema';
import { $Job } from '../job/job.schema';

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
        orderBy?: string
        orderDesc: boolean
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
        orderBy?: string
        orderDesc: boolean
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
        return $.msg.id
            ? $.trx.bucket(scope.bucket).viewOneOrFail($.msg.id, $.msg.view)
            : $.trx.bucket(scope.bucket).viewAll($.msg.view)
    }

    public static query($: {
        trx: AnyTrxNode,
        msg: any,
        job: $Job
    }) {
        const scope = $.job.scope as $ResourceJobScope
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