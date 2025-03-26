import { $Bucket, $Module, $Space } from '~/elements';
import { Bucket } from '~/elements/entities/bucket/bucket';
import { $BucketModelField, $BucketModelFields } from '~/elements/entities/bucket/model/bucket_model.schema';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { Decimal } from '~/engine/data/decimal';
import { Daemon } from '~/engine/runtimes/runtime';
import { DeepPartial } from '~/engine/util/deep';

export class BucketMockObj<$ extends $Bucket, T> {

    private bucket?: Bucket<any, $>
    private obj?: T

    constructor(
        private module: string,
        private bucketName: string,
        private overrides?: Record<string, any>
    ) {}

    public raw(daemon: Daemon<any, any>): T {
        if (!this.bucket) this.bindBucket(daemon);
        if (!this.obj) {
            const model = this.bucket!.schema.model;
            this.obj = this.makeObj(model.fields, this.overrides);
        }
        return this.obj!;
    }

    public async view(daemon: Daemon<any, any>, view: keyof $['views']): Promise<T> {
        const raw = this.raw(daemon);
        const response = await daemon
            .trx(this.module)
            .run(trx => 
                trx.bucket(this.bucketName)
                    .buildOne(raw, view)
            );
        return response.output as T;
    }

    private bindBucket(daemon: Daemon<any, any>) {
        this.bucket = Daemon.getModule(daemon, this.module)
            .buckets[this.bucketName]
    }

    private makeObj(fields: $BucketModelFields, overrides?: Record<string, any>) {
        const obj = {} as any;
        for (const f in fields) {
            if (overrides && f in overrides) {
                obj[f] = overrides[f];
            }
            else {
                const field = fields[f];
                if (field.array) {
                    obj[f] = this.makeList(field, overrides?.[f]);
                }
                else {
                    obj[f] = this.makeField(field, overrides?.[f]);
                }
            }
        }
        return obj;
    }

    private makeList(field: $BucketModelField, overrides?: Record<string, any>) {
        const list = [] as any;
        for (let i = 0; i < 3; i++) {
            list.append(this.makeField(field, overrides))
        }
        return list;
    }

    private makeField(field: $BucketModelField, overrides?: Record<string, any>) {
        if (field.type === 'boolean') {
            return [true, false][Math.floor(Math.random()*2)];
        }
        else if (field.type === 'date') {
            return NesoiDate.now();
        }
        else if (field.type === 'datetime') {
            return NesoiDatetime.now();
        }
        else if (field.type === 'decimal') {
            return new Decimal(`${Math.floor(Math.random()*999)}.${Math.floor(Math.random()*999)}`);
        }
        else if (field.type === 'dict') {
            const dict: Record<string, any> = {};
            for (let i = 0; i < 3; i++) {
                dict[this.makeString()] = this.makeField(field.children!.__dict);
            }
            return dict;
        }
        else if (field.type === 'enum') {
            return field._enum!.options![Math.floor(Math.random()*field._enum!.options!.length)];
        }
        else if (field.type === 'file') {
            // TODO
            return undefined;
        }
        else if (field.type === 'float') {
            return Math.random();
        }
        else if (field.type === 'int') {
            return Math.floor(Math.random()*999);
        }
        else if (field.type === 'obj') {
            return this.makeObj(field.children!, overrides);
        }
        else if (field.type === 'string') {
            return this.makeString();
        }
        else if (field.type === 'unknown') {
            // TODO
            return undefined;
        }
    }

    private makeString() {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let str = 'TEST_';
        for (let i = 0; i < 8; i++) {
            str += charset[Math.floor(Math.random() * charset.length)];
        }
        return str;
    }

}

class BucketMock<
    M extends $Module,
    $ extends $Bucket
> {
    constructor(
        private module: M['name'],
        private bucket: keyof M['buckets']
    ) {}

    public obj<
        O extends DeepPartial<$['#data']> | undefined
    >(overrides?: O) {
        type T = undefined extends O ? $['#data'] : (Omit<$['#data'], keyof O> & O)
        return new BucketMockObj<$, T>(this.module, this.bucket as string, overrides);
    }

}

export class Mock<
    Space extends $Space = $Space
> {
    bucket<
        ModuleName extends keyof Space['modules'],
        BucketName extends keyof Space['modules'][ModuleName]['buckets'],
        Module extends Space['modules'][ModuleName],
        Bucket extends Space['modules'][ModuleName]['buckets'][BucketName],
    >(
        module: ModuleName,
        bucket: BucketName
    ) {
        return new BucketMock<Module, Bucket>(module as string, bucket);
    }
}