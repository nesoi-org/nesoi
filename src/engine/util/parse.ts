import { NesoiDate } from '../data/date';
import { NesoiError } from '../data/error';
import { $MessageTemplateFieldType, $MessageTemplateFields } from '../../elements/entities/message/template/message_template.schema';
import { $Module, BucketName, ViewName } from '~/schema';
import { AnyTrxNode } from '../transaction/trx_node';
import { Tree } from '../data/tree';
import { NesoiDecimal } from '../data/decimal';
import { NesoiDatetime } from '../data/datetime';
import { NesoiFile } from '../data/file';

// TODO: check the performance of this wild thing below

async function parse<Array extends boolean, T>(
    type: $MessageTemplateFieldType,
    field: { name: string, alias: string },
    value: any,
    array: Array,
    fn: (...args: any[]) => T | Promise<T>
): Promise<Array extends false ? T : T[]> {
    if (array) {
        if (!Array.isArray(value)) {
            throw NesoiError.Message.InvalidFieldType({ field: field.alias, value, type: `${type}[]` });
        }
        const parsed = [] as T[];
        for (const v in value) {
            parsed.push(await fn(value[v]));
        }
        return parsed as any;
    }
    return fn(value) as any;
}

export function parseBoolean(field: { name: string, alias: string }, value: any, array: boolean) {
    return parse('boolean', field, value, array, (v: any) => {
        if (v === 'true' || v === 1) {
            return true;
        }
        if (v === 'false' || v === 0) {
            return false;
        }
        if (typeof v === 'boolean') {
            return v;
        }
        throw NesoiError.Message.InvalidFieldType({ field: field.alias, value: v, type: 'boolean' });
    });    
}

export function parseDate(field: { name: string, alias: string }, value: any, array: boolean) {
    return parse('date', field, value, array, (v: any) => {
        // TODO: limit to date
        if (typeof v === 'string') {
            return NesoiDate.fromISO(v);
        }
        throw NesoiError.Message.InvalidFieldType({ field: field.alias, value: v, type: 'date' });
    });
}
    
export function parseDatetime(field: { name: string, alias: string }, value: any, array: boolean) {
    return parse('datetime', field, value, array, (v: any) => {
        if (typeof v === 'string') {
            return NesoiDatetime.fromISO(v);
        }
        throw NesoiError.Message.InvalidFieldType({ field: field.alias, value: v, type: 'datetime' });
    });
}

export function parseDecimal(field: { name: string, alias: string }, value: any, array: boolean) {
    return parse('decimal', field, value, array, (v: any) => {
        if (typeof v === 'string') {
            return new NesoiDecimal(v);
        }
        throw NesoiError.Message.InvalidFieldType({ field: field.alias, value: v, type: 'float' });
    });
}

export function parseEnum(
    raw: Record<string, any>,
    field: { name: string, alias: string },
    value: any,
    array: boolean,
    options: string | readonly string[] | Record<string, any>,
    trx: AnyTrxNode
) {
    return parse('enum', field, value, array, (v: any) => {
        if (typeof v === 'string') {
            if (typeof options === 'string') {

                let enumName = options;
                const enumPath = enumName.match(/(.*)\.\{(.*)\}$/);
                let _enum;
                if (enumPath) {
                    enumName += enumPath[1] + '.' + enumPath[2]
                    try {
                        _enum = trx.enum(enumName)
                    }
                    catch {
                        const v = Tree.get(raw, enumPath[2])
                        throw NesoiError.Message.InvalidEnumScope(field, v, enumPath[2])
                    }
                }
                else {
                    _enum = trx.enum(enumName);
                }

                const keys = _enum.keys();
                if (keys.includes(v)) {
                    return v;
                }
                else {
                    throw NesoiError.Message.InvalidFieldEnumValue({ field: field.alias, value: v, type: 'enum', options: keys as string[] });
                }
            }
            else if (Array.isArray(options)) {
                if (options.includes(v)) {
                    return v;
                }
                else {
                    throw NesoiError.Message.InvalidFieldEnumValue({ field: field.alias, value: v, type: 'enum', options });
                }
            }
            else if (typeof options === 'object') {
                if (v in options) {
                    return options[v as keyof typeof options];
                }
                else {
                    throw NesoiError.Message.InvalidFieldEnumValue({ field: field.alias, value: v, type: 'enum', options: Object.keys(options) });
                }
            }
        }
        throw NesoiError.Message.InvalidFieldType({ field: field.alias, value: v, type: 'string' });
    });
}

export function parseFile(field: { name: string, alias: string }, value: any, array: boolean, options?: {
    maxsize?: number
    extnames?: string[]
}) {
    return parse('file', field, value, array, (v: any) => {
        if (!(v instanceof NesoiFile)) {
            throw NesoiError.Message.InvalidFieldType({ field: field.alias, value: v, type: 'file' });
        }
        if (options?.maxsize) {
            if (v.size > options?.maxsize) {
                throw NesoiError.Message.FileTooBig(field, options?.maxsize);
            }
        }
        if (options?.extnames) {
            if (!options?.extnames.includes(v.extname)) {
                throw NesoiError.Message.FileExtNotAllowed(field, options?.extnames);
            }
        }
        return v;
    });
}

export function parseFloat_(field: { name: string, alias: string }, value: any, array: boolean) {
    return parse('float', field, value, array, (v: any) => {
        if (typeof v === 'string') {
            const val = parseFloat(v);
            if (!Number.isNaN(val)) {
                return val;
            }
        }
        else if (typeof v === 'number') {
            if (!Number.isNaN(v)) {
                return v;
            }
        }
        throw NesoiError.Message.InvalidFieldType({ field: field.alias, value: v, type: 'float' });
    });
}

export async function parseId<
    M extends $Module,
    Name extends BucketName<M>,
    View extends ViewName<M['buckets'][Name]> | undefined
>(
    field: { name: string, alias: string },
    value: any,
    array: boolean,
    trx: AnyTrxNode,
    bucket: Name,
    type?: 'int'|'string',
    view?: View
) {
    return parse('id', field, value, array, (async (v: any) => {
        let val;

        if (type === 'string') {
            val = await parseString(field, value, array);
        }
        else {
            val = await parseInt_(field, value, array);
        }
        
        return {
            id: val,
            obj: view
                ? await trx.bucket(bucket).viewOneOrFail(val, view)
                : await trx.bucket(bucket).readOneOrFail(val)
        }; 
    }) as any); // type only required on query parsers
}

export function parseInt_(field: { name: string, alias: string }, value: any, array: boolean) {
    return parse('int', field, value, array, (v: any) => {
        if (typeof v === 'string') {
            const val = parseInt(v);
            if (!Number.isNaN(val)) {
                return val;
            }
        }
        else if (typeof v === 'number') {
            const val = Math.floor(v);
            if (!Number.isNaN(val)) {
                return val;
            }
        }
        throw NesoiError.Message.InvalidFieldType({ field: field.alias, value: v, type: 'integer' });
    });
}

export function parseString(field: { name: string, alias: string }, value: any, array: boolean) {
    return parse('string', field, value, array, (v: any) => {
        if (typeof v === 'string') {
            return v;
        }
        throw NesoiError.Message.InvalidFieldType({ field: field.alias, value: v, type: 'string' });
    });
}

export function parseStringOrNumber(field: { name: string, alias: string }, value: any, array: boolean) {
    return parse('string_or_number', field, value, array, (v: any) => {
        if (typeof v === 'string' || typeof v === 'number') {
            return v;
        }
        throw NesoiError.Message.InvalidFieldType({ field: field.alias, value: v, type: 'string_or_number' });
    });
}

export async function parseDict(
    field: { name: string, alias: string, children?: $MessageTemplateFields },
    value: any,
    array: boolean,
    trx: AnyTrxNode,
    parseFields: (trx: AnyTrxNode, fields: $MessageTemplateFields, obj: Record<string, any>) => Promise<Record<string, any>>
) {
    return parse('dict', field, value, array, (async (v: any) => {
        if (typeof v === 'object') {
            const parsed: Record<string, any> = {};
            for (const k in v) {
                const pv = await parseFields(trx, field.children!, { __dict: v[k] })
                parsed[k] = pv['__dict'];
            }
            return parsed;
        }
        throw NesoiError.Message.InvalidFieldType({ field: field.alias, value: v, type: 'dict' });
    }) as any);
}

export async function parseObj(
    field: { name: string, alias: string, children?: $MessageTemplateFields },
    value: any,
    array: boolean,
    trx: AnyTrxNode,
    parseFields: (trx: AnyTrxNode, fields: $MessageTemplateFields, obj: Record<string, any>) => Promise<Record<string, any>>
) {
    return parse('obj', field, value, array, (async (v: any) => {
        if (typeof v === 'object') {
            if (field.children) {
                return await parseFields(trx, field.children, v);
            }
            return v;
        }
        throw NesoiError.Message.InvalidFieldType({ field: field.alias, value: v, type: 'object' });
    }) as any);
}
