import { $Message } from '~/elements';
import { $BucketModelFieldType } from '~/elements/entities/bucket/model/bucket_model.schema';
import { $Dependency } from '~/engine/dependency';
import { Deep } from '~/engine/util/deep';

export type $MessageTemplateRule = (def: {
    field: $MessageTemplateField,
    path: string,
    value: any,
    msg: $Message['#raw'],
    inject: Record<string, any>
}) => { set: any } | true | string | Promise<{ set: any } | true | string>

export type $MessageTemplateFieldMeta = {
    literal?: {
        template: string
    }
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

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $MessageTemplateField {
    public '#raw'!: unknown;
    public '#parsed'!: unknown;
    public $t = 'message.template.field';
    constructor(
        /** A string representing the type of data carried by the field */
        public type: $MessageTemplateFieldType,

        /**
         * - A machine name for the field, unique inside it's parent (either another field or a message).
         * - Matches the relative path for writing the field value on the parent parsed object (key_parsed).
         */
        public name: string,

        /** A human name for the field */
        public alias: string,

        /** The absolute path for reading the field value on the raw object */
        public pathRaw: string,

        /** The absolute path for writing the field value on the parsed object */
        public pathParsed: string,

        public required: boolean,
        public defaultValue: any,
        public nullable: boolean,
        public rules: $MessageTemplateRule[],
        public meta: $MessageTemplateFieldMeta,
        public children?: $MessageTemplateFields
    ) {}

    /**
     * Warning: this does not clone the field's children or union.
     * @returns 
     */
    public static clone(schema: $MessageTemplateField): $MessageTemplateField {
        return new $MessageTemplateField(
            schema.type,
            schema.name,
            schema.alias,
            schema.pathRaw,
            schema.pathParsed,
            schema.required,
            schema.defaultValue,
            schema.nullable,
            [...schema.rules],
            Deep.copy(schema.meta),
            undefined
        )
    }
}

export type $MessageTemplateFields = {
    [x: string]: $MessageTemplateField
}

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $MessageTemplate {
    public $t = 'message.template';

    constructor(
        public fields: $MessageTemplateFields = {}
    ) {}

    public static fieldsOfType(
        template: $MessageTemplate,
        type: $MessageTemplateFieldType
    ) {

        const fields: $MessageTemplateField[] = [];
        
        let poll: $MessageTemplateField[] = Object.values(template.fields);
        while (poll.length) {
            const next: $MessageTemplateField[] = [];
            for (const field of poll) {
                if (field.type === type) {
                    fields.push(field);
                }
                if (field.children) {
                    next.push(...Object.values(field.children))
                }
            }
            poll = next;
        }

        return fields;
    }

    public static forEachField(
        template: $MessageTemplate,
        predicate: (field: $MessageTemplateField, path: string) => void
    ) {
        let poll: {
            field: $MessageTemplateField,
            path: string
        }[] = Object.entries(template.fields).map(([path, field]) => ({ path, field }));
        while (poll.length) {
            const next: typeof poll = [];
            for (const obj of poll) {
                predicate(obj.field, obj.path);
                
                if (obj.field.children) {
                    next.push(...Object.values(obj.field.children)
                        .map((field, i) => ({
                            field,
                            path: obj.path + '.' + (obj.field.type === 'union' ? i : field.name)
                        }))
                    )
                }
            }
            poll = next;
        }
    }
}
