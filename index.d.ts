/**
 * Core
 */

// - Obj

declare type Id = number | string
declare type NesoiObj = object & {
    id: Id
}

// - Tag

declare interface Tag {
    full: TagString
    short: TagShortString
    module: string
    type: TagType
    name: string
}

declare type TagString = `${string}::${string}:${string}`
declare type TagShortString = `${string}::${string}`
declare type TagType = 'constants' | 'constants.enum' | 'constants.value' | 'message' | 'bucket' | 'job' | 'resource' | 'machine' | 'controller' | 'queue' | 'topic' | 'externals'

// - Trx
declare interface _TrxNode {
    id: string
    globalId: string
}

// - Coringa

declare type AnyInlineElementSchema = 
    $Message |
    $Job

declare type AnyElementSchema = 
    $Constants |
    $ConstantEnum |
    $ConstantValue |
    $Externals |
    $Message |
    $Bucket |
    $Job |
    $Resource |
    $Machine |
    $Controller |
    $Queue |
    $Topic

/**
 * Data
 */

declare interface NesoiDatetime {
    epoch: number
    tz: '-12:00'|'-11:00'|'-10:00'|'-07:00'|'-06:00'|'-05:00'|'-04:00'|'-03:00'|'-02:00'|'-01:00'|'Z'|'+01:00'|'+02:00'|'+03:00'|'+04:00'|'+05:00'|'+06:00'|'+07:00'|'+08:00'|'+09:00'|'+10:00'|'+11:00'|'+12:00'|'+13:00'
    toISO(): string
    toValues(): {
        year: number
        month: number
        day: number
        hour: number
        minute: number
        second: number
        ms: number
        tz: NesoiDatetime['tz']
    }
    toJSDate(): Date
    atTimezone(tz: NesoiDatetime['tz']): NesoiDatetime
    plus(period: `${number} ${NesoiDuration['unit']}`): NesoiDatetime
    minus(period: `${number} ${NesoiDuration['unit']}`): NesoiDatetime
    shift(period: `${'+'|'-'} ${number} ${NesoiDuration['unit']}`): NesoiDatetime
    startOf(period: 'day'|'month'|'year'): NesoiDatetime
}

declare interface NesoiDate {
    day: number
    month: number
    year: number
    toISO(): string
}

declare interface NesoiDuration {
    value: number
    unit: ('miliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years')
    toString(): string
}

declare interface NesoiDecimal {
    toString(): string
    toFloat(): number
}

declare interface NesoiFile {
    __nesoi_file: true
    filepath: string
    filename: string
    extname: string
    mimetype: string | null
    size: number
    originalFilename: string | null
    mtime: Date | null
    hashAlgorithm: false | 'sha1' | 'md5' | 'sha256'
}

/**
 * Auth
 */

declare interface User extends NesoiObj {}

/**
 * Space / Module
 */

declare interface $Space {
    users: {
        [x: string]: User
    }
    modules: {
        [x: string]: $Module
    }
}

declare interface $Module {
    name: string
    constants: $Constants
    externals: $Externals
    messages: {
        [x: string]: $Message
    }
    buckets: {
        [x: string]: $Bucket
    }
    jobs: {
        [x: string]: $Job
    }
    resources: {
        [x: string]: $Resource
    }
    machines: {
        [x: string]: $Machine
    }
    controllers: {
        [x: string]: $Controller
    }
    queues: {
        [x: string]: $Queue
    }
    topics: {
        [x: string]: $Topic
    }
    '#input': $Message
    '#auth': { [K: string]: User }
    '#services': Record<string, any>
}

declare interface VirtualModuleDef {
    name: string
    schemas?: {
        messages?: $Message[],
        machines?: $Machine[]
    }
    externals?: {
        messages?: Tag[],
        buckets?: Tag[],
        jobs?: Tag[]
    }
}

/**
 * Elements
 */

// - Message

declare interface $Message {
    $t: 'message'
    '#raw': unknown
    '#parsed': unknown
    module: string,
    name: string,
    alias: string,
    template: $MessageTemplate
}

declare interface $MessageTemplate {
    $t: 'message.template'
    fields: {
        [x: string]: $MessageTemplateField
    }
}

declare interface $MessageTemplateField {
    $t: 'message.template.field'
    '#raw': unknown
    '#parsed': unknown
    type: $MessageTemplateFieldType
    name: string
    alias: string
    pathRaw: string
    pathParsed: string
    required: boolean
    defaultValue: any
    nullable: boolean
    rules: $MessageTemplateRule[]
    meta: $MessageTemplateFieldMeta
    children?: {
        [x: string]: $MessageTemplateField
    }
}

declare interface $MessageTemplateFields extends Record<string, $MessageTemplateField> {}

declare type $MessageTemplateFieldType = $BucketModelFieldType | 'string_or_number' | 'id' | 'msg'

declare type $MessageTemplateRule = (def: {
    field: $MessageTemplateField,
    path: string,
    value: any,
    msg: $Message['#raw'],
    inject: Record<string, any>
}) => { set: any } | true | string | Promise<{ set: any } | true | string>

declare interface $MessageTemplateFieldMeta {
    literal?: {
        template: string
    }
    decimal?: {
        left?: number
        right?: number
    },
    enum?: {
        enumpath?: [string, string]
        options: Record<string, any>
    },
    file?: {
        maxsize?: number
        extnames?: string[]
    },
    id?: {
        bucket: Tag
        type?: 'int' | 'string'
        view?: string
    },
    msg?: {
        tag: Tag
    }
}

// - Bucket

declare interface $Bucket {
    $t: 'bucket'
    '#data': NesoiObj
    '#composition': {
        [x: string]: {
            bucket: $Bucket,
            many: boolean,
            optional: boolean
        }
    }
    '#defaults': Record<string, any>
    module: string,
    name: string,
    alias: string,
    model: $BucketModel,
    graph: $BucketGraph,
    views: $BucketViews,
    tenancy?: $BucketTenancy<any, any>,
    extendsFrom?: Tag
}

declare type $BucketTenancy<
    M extends $Module,
    B extends $Bucket
> = {
    [K in keyof M['#auth']]?: (user: M['#auth'][K]) => NQL_Query<M, B>
}

// - - Bucket Model

declare interface $BucketModel {
    $t: 'bucket.model'
    fields: {
        id: $BucketModelField
        [x: string]: $BucketModelField
    }
    defaults: Record<string, any>
    hasFileField: boolean
    hasEncryptedField: boolean
}

declare class $BucketModelField {
    $t: 'bucket.model.field'
    name: string
    path: string
    type: $BucketModelFieldType
    alias: string
    required: boolean
    meta?: {
        literal?: {
            template: string
        }
        enum?: {
            options: Record<string, any>
        },
        decimal?: {
            left?: number
            right?: number
        },
        file?: {
            extnames?: string[],
            maxsize?: number
        }
    }
    defaultValue?: unknown
    children?: $BucketModelFields
    crypto?: $BucketModelFieldCrypto
}

declare interface $BucketModelFields extends Record<string, $BucketModelField> {}

declare type $BucketModelFieldType = 'boolean'|'date'|'datetime'|'duration'|'decimal'|'enum'|'file'|'float'|'int'|'string'|'obj'|'unknown'|'dict'|'list'|'union'|'literal'

declare interface $BucketModelFieldCrypto {
    algorithm: string,
    value: Tag
}

// - - Bucket Graph

declare interface $BucketGraph {
    $t: 'bucket.graph'
    links: $BucketGraphLinks
}

declare interface $BucketGraphLink {
    $t: 'bucket.graph.link'
    '#bucket': $Bucket
    '#many': boolean
    name: string
    alias: string
    bucket: Tag
    rel: 'aggregation' | 'composition'
    many: boolean
    optional: boolean
    keyOwner: 'self' | 'other' | 'pivot'
    query: NQL_AnyQuery
}

declare interface $BucketGraphLinks extends Record<string, $BucketGraphLink> {}

// - - Bucket View

declare interface $BucketView {
    $t: 'bucket.view'
    '#data': unknown
    name: string,
    fields: $BucketViewFields
}

declare interface $BucketViews extends Record<string, $BucketView> {}

declare type $BucketViewFieldFn<
    TrxNode extends _TrxNode,
    RootBucket extends $Bucket,
    CurrentBucket extends $Bucket,
    Value,
    Return = any
> = (
    ctx: {
        trx: TrxNode,
        bucket: $Bucket
        root: RootBucket['#data'],           // Undefined if multiple branches
        current: CurrentBucket['#data'],     // Undefined if multiple branches
        value: Value,
        
        graph: {
            branch: Record<string, any>[]
            model_index: (string|number)[]
        } | {
            branch: Record<string, any>[]
            model_indexes: (string|number)[][]
        } | {
            branches: Record<string, any>[][]
            model_indexes: (string|number)[][]
        }
        flags: {
            serialize: boolean
        }
    }
) => Return | Promise<Return>

declare interface $BucketViewFieldMeta {
    model?: {
        path: string
    }
    computed?: {
        fn: $BucketViewFieldFn<any, any, any, any>
    }
    query?: {
        link: string
        path: string
        view?: string
    } | {
        many: boolean
        bucket: Tag,
        query: NQL_AnyQuery,
        params: $BucketViewFieldFn<any, any, any, any, Record<string, any>>,
        view?: string
    }
    view?: {
        view: string
    }
    drive?: {
        path: string
    }
    inject?: {
        path: number|'value'
    }
}

declare type $BucketViewFieldOp =
{
    type: 'map'
    ops: $BucketViewFieldOp[]
} | {
    type: 'prop'
    prop: string
} | {
    type: 'list'
} | {
    type: 'dict'
    key?: string
} | {
    type: 'group'
    key: string
} | {
    type: 'transform'
    fn: $BucketViewFieldFn<any, any, any, any>
} | {
    type: 'subview'
    children: $BucketViewFields
}

declare interface $BucketViewField {
    $t: 'bucket.view.field'
    '#data': unknown
    name: string,
    type: $BucketViewFieldType,
    alias: string,
    meta: $BucketViewFieldMeta,
    ops: $BucketViewFieldOp[]
}

declare interface $BucketViewFields extends Record<string, $BucketViewField> {}

declare type $BucketViewFieldType = 'model'|'computed'|'query'|'obj'|'view'|'drive'|'inject'

// - [Block]

declare interface $Block {
    $t: $BlockType
    '#auth': {}
    '#input': $Message
    '#output': unknown
    module: string,
    name: string,
    alias: string,
    auth: $BlockAuth[],
    input: Tag[],
    output?: $BlockOutput
}

declare type $BlockType = 'job' | 'resource' | 'machine' | 'machine.transition' | 'machine.state' | 'queue' | 'topic'

declare interface $BlockAuth {
    provider: string
    resolver?: (user: Record<string, any>) => boolean
}

declare interface $BlockOutput {
    raw?: string
    msg?: Tag[]
    obj?: {
        tag: Tag
        many: boolean
    }[]
}


// - Job

declare interface $Job extends $Block {
    $t: 'job'
    '#extra': unknown
    module: string
    name: string
    alias: string
    auth: $BlockAuth[]
    input: Tag[]
    output: $BlockOutput | undefined
    extrasAndAsserts: $JobExtrasAndAsserts
    method: $JobMethod<any, any, any, any>
    scope?: $MachineJobScope | $ResourceJobScope
}

declare type $JobExtrasAndAsserts = (
    { extra: $JobMethod<any, any, any, any, any> } |
    { assert: $JobAssert<any, any, any, any> }
)[]

declare type $JobAssert<Trx, Message, Extra = {}, Ctx = {}> = 
    $JobMethod<Trx, Message, string | true, Extra, Ctx>

declare type $JobMethod<Trx, Message, O, Extra = never, Ctx = {}> =
    (ctx: {
        trx: Trx,
        msg: Message,
        extra: Extra,
        job: $Job
    } & Ctx) => O | Promise<O>

// - Resource

declare interface $Resource extends $Block {
    $t: 'resource'
    '#bucket': $Bucket
    '#input.query': $Message
    '#input.create': $Message
    '#input.update': $Message
    '#input.delete': $Message
    module: string,
    name: string,
    alias: string,
    auth: $BlockAuth[],
    bucket: Tag,
    jobs: {
        query?: Tag,
        create?: Tag,
        update?: Tag,
        delete?: Tag
    }
}

declare interface $ResourceJobScope {  
    module: string
    resource: string
    bucket: string
    method: 'view' | 'query' | 'create' | 'update' | 'delete'
    prepareMethod: $JobMethod<any, any, any, any>
    execMethod?: $JobMethod<any, any, any, any>
    afterMethod?: $JobMethod<any, any, any, any>
    routes?: $ResourceQueryRoutes
}

declare interface $ResourceQueryRoutes {  
    [route: string]: {
        view: string
        auth: $BlockAuth[]
        query?: NQL_AnyQuery
        serialize: boolean
    }
}

// - Machine

declare interface $Machine extends $Block {
    $t: 'machine'
    '#data': unknown
    module: string,
    name: string,
    alias: string,
    auth: $BlockAuth[],
    input: Tag[],
    buckets: Tag[],
    jobs: Tag[],
    stateField: string,
    states: $MachineStates,
    transitions: $MachineTransitions,
    stateAliasField?: string,
    logger?: $MachineLogFn<any>
}

declare interface $MachineState extends $Block {
    $t: 'machine.state'
    '#input.enter': any
    '#input.leave': any
    module: string,
    name: string,
    alias: string,
    auth: $BlockAuth[],
    initial: boolean,
    final: boolean,
    inputEnter: Tag[],
    inputLeave: Tag[],
    jobs: {
        beforeEnter?: Tag
        afterEnter?: Tag
        beforeLeave?: Tag
        afterLeave?: Tag
    }
}

declare interface $MachineStates extends Record<string, $MachineState> {}

declare interface $MachineTransition extends $Block {
    $t: 'machine.transition'
    module: string
    name: string
    alias: string
    auth: $BlockAuth[]
    msg: Tag
    from: string
    to: string
    condition?: $JobAssert<any, any, never, any>
    jobs: Tag[]
}

declare interface $MachineTransitions {
    from: {
        [state: string]: {
            [msg: string]: $MachineTransition[]
        }
    },
    to: {
        [state: string]: {
            [msg: string]: $MachineTransition[]
        }
    }
}

declare interface $MachineJobScope {
    module: string
    machine: string
}

declare type $MachineLogFn<M extends $Machine = $Machine> = (
    ctx: { trx: _TrxNode, schema: M, obj: M['#data'], output: MachineOutput }
) => any | Promise<any>

declare interface MachineOutput {
    entries: MachineOutputEntry[]
}

declare interface MachineOutputEntry<Type=string, Code=string, Text=string, Data=any> {
    type: Type
    code: Code
    text: Text
    data: Data
}

// - Queue

declare interface $Queue extends $Block {
    $t: 'queue'
    dependencies: Tag[]
    module: string
    name: string
    alias: string
    auth: $BlockAuth[]
    msgs: Tag[]
}

// - Topic

declare interface $Topic extends $Block {
    $t: 'topic'
    dependencies: Tag[]
    module: string
    name: string
    alias: string
    auth: $BlockAuth[]
    subscription_auth: $BlockAuth[]
    input: Tag[]
    output: $BlockOutput | undefined
}

// - Controller


declare interface $Controller {
    $t: 'controller'
    '#auth': Record<string, User>
    '#input': $Message
    module: string
    name: string
    alias: string
    auth: $BlockAuth[]
    input: Tag[]
    domains: Record<string, $ControllerDomain>
    topics: Record<string, $ControllerTopic>
}

declare interface $ControllerDomain extends $ControllerGroup {
    $t: 'controller.domain'
    name: string
    alias: string
    auth: $BlockAuth[]
    version: string
    groups: Record<string, $ControllerGroup>
    endpoints: Record<string, $ControllerEndpoint>
}

declare interface $ControllerGroup {
    $t: 'controller.group' | 'controller.domain'
    name: string
    alias: string
    auth: $BlockAuth[]
    groups: Record<string, $ControllerGroup>
    endpoints: Record<string, $ControllerEndpoint>
}

declare interface $ControllerEndpoint {
    $t: 'controller.endpoint'
    name: string
    alias: string
    auth: $BlockAuth[]
    tags: string[]
    msg: Tag
    target: Tag
    implicit?: Record<string, any>
    idempotent: boolean
}

declare interface $ControllerTopic {
    $t: 'controller.topic'
    name: string
    alias: string
    auth: $BlockAuth[]
    tags: string[]
    msgs: Tag[]
    topic: Tag
}

// - Constants


declare interface $Constants {
    $t: 'constants'
    '#enumpath': Record<string, {
        _enum: $ConstantEnum
        _subs: string
    }>
    module: string
    name: string
    values: Record<string, $ConstantValue>
    enums: Record<string, $ConstantEnum>
}

declare interface $ConstantValue {
    $t: 'constants.value'
    module: string
    name: string
    scope: string
    key?: string
    value?: any
}

declare interface $ConstantEnum {
    $t: 'constants.enum'
    '#data': any
    module: string
    name: string
    options: Record<string, $ConstantEnumOption>
}

declare interface $ConstantEnumOption {
    key: string
    value: unknown
}

// - Externals

declare interface $Externals {
    $t: 'externals'
    module: string
    name: string
    values: Record<string, Tag>
    enums: Record<string, Tag>
    buckets: Record<string, Tag>
    messages: Record<string, Tag>
    jobs: Record<string, Tag>
    machines: Record<string, Tag>
}

/**
 * NQL
 */

declare type NQL_Query<Module, Bucket> = Record<string, any>
declare interface NQL_AnyQuery extends Record<string, any> {}