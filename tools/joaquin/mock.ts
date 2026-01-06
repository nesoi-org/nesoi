import type { $Bucket, $Message, $Module, $Space } from '~/elements';
import type { Bucket } from '~/elements/entities/bucket/bucket';
import type { $BucketModelField, $BucketModelFields } from '~/elements/entities/bucket/model/bucket_model.schema';
import type { AnyMessageParser } from '~/elements/entities/message/message_parser';
import type { $MessageTemplateField, $MessageTemplateFields } from '~/elements/entities/message/template/message_template.schema';
import { Daemon } from '~/engine/daemon';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiDecimal } from '~/engine/data/decimal';
import type { DeepPartial } from '~/engine/util/deep';

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
                if (field.type === 'union') {
                    obj[f] = this.makeUnion(field, overrides?.[f]);
                }
                if (field.type === 'list') {
                    obj[f] = this.makeList(field, overrides?.[f]);
                }
                else {
                    obj[f] = this.makeField(field, overrides?.[f]);
                }
            }
        }
        return obj;
    }

    private makeUnion(field: $BucketModelField, overrides?: Record<string, any>) {
        const n = Object.keys(field.children!).length;
        const r = Math.floor(Math.random()*n);
        return this.makeField(field.children![r], overrides)
    }

    private makeList(field: $BucketModelField, overrides?: Record<string, any>) {
        const list = [] as any[];
        for (let i = 0; i < 3; i++) {
            list.push(this.makeField(field, overrides))
        }
        return list;
    }

    private makeField(field: $BucketModelField, overrides?: Record<string, any>) {
        if (field.type === 'boolean') {
            return [true, false][Math.floor(Math.random()*2)];
        }
        else if (field.type === 'date') {
            return Mock.date()
        }
        else if (field.type === 'datetime') {
            return Mock.datetime()
        }
        else if (field.type === 'decimal') {
            return Mock.decimal()
        }
        else if (field.type === 'dict') {
            const dict: Record<string, any> = {};
            for (let i = 0; i < 3; i++) {
                dict[Mock.string()] = this.makeField(field.children!['#']);
            }
            return dict;
        }
        else if (field.type === 'enum') {
            const options = Object.keys(field.meta!.enum!.options);
            return options[Math.floor(Math.random() * options.length)];
        }
        else if (field.type === 'file') {
            // TODO
            return undefined;
        }
        else if (field.type === 'float') {
            return Mock.float()
        }
        else if (field.type === 'int') {
            return Mock.int()
        }
        else if (field.type === 'obj') {
            return this.makeObj(field.children!, overrides);
        }
        else if (field.type === 'string') {
            return Mock.string()
        }
        else if (field.type === 'literal') {
            return field.meta!.literal!.template // TODO: generate based on template
        }
        else if (field.type === 'unknown') {
            // TODO
            return undefined;
        }
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

class MessageMock<
    M extends $Module,
    $ extends $Message
> {
    private message?: AnyMessageParser;

    constructor(
        private module: M['name'],
        private messageName: keyof M['messages']
    ) {}

    public raw<
        O extends DeepPartial<$['#raw']> | undefined
    >(daemon: Daemon<any, any>, overrides?: O) {
        if (!this.message) this.bindMessage(daemon);
        return this.makeObj(this.message?.schema.template.fields || {}, overrides)
    }

    private bindMessage(daemon: Daemon<any, any>) {
        this.message = Daemon.getModule(daemon, this.module)
            .messages[this.messageName]
    }

    private makeObj(fields: $MessageTemplateFields, overrides?: Record<string, any>) {
        const obj = {} as any;
        for (const f in fields) {
            if (overrides && f in overrides) {
                obj[f] = overrides[f];
            }
            else {
                const field = fields[f];
                if (field.type === 'list') {
                    obj[f] = this.makeList(field.children!['#'], overrides?.[f]);
                }
                else {
                    obj[f] = this.makeField(field, overrides?.[f]);
                }
            }
        }
        return obj;
    }

    private makeList(field: $MessageTemplateField, overrides?: Record<string, any>) {
        const list = [] as any[];
        for (let i = 0; i < 3; i++) {
            list.push(this.makeField(field, overrides))
        }
        return list;
    }

    private makeField(field: $MessageTemplateField, overrides?: Record<string, any>) {
        if (field.type === 'boolean') {
            return [true, false][Math.floor(Math.random()*2)];
        }
        else if (field.type === 'date') {
            return Mock.date()
        }
        else if (field.type === 'datetime') {
            return Mock.datetime()
        }
        else if (field.type === 'decimal') {
            return Mock.decimal()
        }
        else if (field.type === 'dict') {
            const dict: Record<string, any> = {};
            for (let i = 0; i < 3; i++) {
                dict[Mock.string()] = this.makeField(field.children!['#']);
            }
            return dict;
        }
        else if (field.type === 'enum') {
            // TODO
            return 'TODO';
        }
        else if (field.type === 'file') {
            // TODO
            return undefined;
        }
        else if (field.type === 'float') {
            return Mock.float()
        }
        else if (field.type === 'int') {
            return Mock.int()
        }
        else if (field.type === 'obj') {
            return this.makeObj(field.children!, overrides);
        }
        else if (field.type === 'string') {
            return Mock.string()
        }
        else if (field.type === 'unknown') {
            // TODO
            return undefined;
        }
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

    message<
        ModuleName extends keyof Space['modules'],
        MessageName extends keyof Space['modules'][ModuleName]['messages'],
        Module extends Space['modules'][ModuleName],
        Message extends Space['modules'][ModuleName]['messages'][MessageName],
    >(
        module: ModuleName,
        message: MessageName
    ) {
        return new MessageMock<Module, Message>(module as string, message);
    }

    public static boolean() {
        return [true, false][Math.floor(Math.random()*2)];
    }
    public static date() {
        return NesoiDate.now();
    }
    public static datetime() {
        return NesoiDatetime.now();
    }
    public static decimal() {
        return new NesoiDecimal(`${Math.floor(Math.random()*999)}.${Math.floor(Math.random()*999)}`);
    }
    public static float() {
        return Math.random();
    }
    public static int() {
        return Math.floor(Math.random()*999);
    }
    public static string() {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let str = 'TEST_';
        for (let i = 0; i < 8; i++) {
            str += charset[Math.floor(Math.random() * charset.length)];
        }
        return str;
    }
}