import { $Message } from '~/elements';
import { $BucketModelFieldType } from '~/elements/entities/bucket/model/bucket_model.schema';
import { $Dependency } from '~/engine/dependency';

export type $MessageTemplateRule = (def: {
    field: $MessageTemplateField,
    value: any,
    msg: $Message['#raw']
}) => { set: any } | true | string | Promise<{ set: any } | true | string>

export type $MessageTemplateFieldMeta = {
    decimal?: {
        left?: number
        right?: number
    },
    enum?: {
        options: string | string[] | Record<string, any>
        dep?: $Dependency
    },
    file?: {
        maxsize?: number
        extnames?: string[]
    },
    id?: {
        bucket: $Dependency
        type?: 'int' | 'string'
        view?: string
    },
    msg?: $Dependency
}

export type $MessageTemplateFieldType = $BucketModelFieldType | 'string_or_number' | 'id' | 'msg'

export class $MessageTemplateField {
    public '#raw'!: unknown;
    public '#parsed'!: unknown;
    public $t = 'message.template.field';
    constructor(
        public type: $MessageTemplateFieldType,
        public name: string,
        public alias: string,
        public path: string,
        public array: boolean,
        public required: boolean,
        public defaultValue: any,
        public nullable: boolean,
        public rules: $MessageTemplateRule[],
        public meta: $MessageTemplateFieldMeta,
        public children?: $MessageTemplateFields,
        public or?: $MessageTemplateField
    ) {}
}

export type $MessageTemplateFields = {
    [x: string]: $MessageTemplateField
}

export class $MessageTemplate {
    public $t = 'message.template';

    constructor(
        public fields: $MessageTemplateFields = {}
    ) {}
}
