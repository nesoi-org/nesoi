import { NesoiDate } from '../data/date';
import { NesoiError } from '../data/error';
import { $MessageTemplateField, $MessageTemplateFieldMeta, $MessageTemplateFields } from '../../elements/entities/message/template/message_template.schema';
import { $Module, BucketName, ViewName } from '~/schema';
import { AnyTrxNode } from '../transaction/trx_node';
import { Tree } from '../data/tree';
import { NesoiDecimal } from '../data/decimal';
import { NesoiDatetime } from '../data/datetime';
import { NesoiFile } from '../data/file';
import { NesoiDuration } from '../data/duration';
import { Tag } from '../dependency';

export function parseBoolean(field: { pathRaw: string, alias: string }, path: string[], value: any) {
    if (value === 'true' || value === 1) {
        return true;
    }
    if (value === 'false' || value === 0) {
        return false;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'boolean' });    
}

export function parseDate(field: { pathRaw: string, alias: string }, path: string[], value: any) {
    // TODO: limit to date
    if (typeof value === 'string') {
        return NesoiDate.fromISO(value);
    }
    throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'date' });
}
    
export function parseDatetime(field: { pathRaw: string, alias: string }, path: string[], value: any) {
    if (typeof value === 'string') {
        return NesoiDatetime.fromISO(value);
    }
    throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'datetime' });
}
    
export function parseDuration(field: { pathRaw: string, alias: string }, path: string[], value: any) {
    if (typeof value === 'string') {
        return NesoiDuration.fromString(value);
    }
    throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'duration' });
}

export function parseDecimal(field: { pathRaw: string, alias: string }, path: string[], value: any) {
    if (typeof value === 'string') {
        return new NesoiDecimal(value);
    }
    throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'decimal' });
}

export function parseEnum(
    raw: Record<string, any>,
    field: { pathRaw: string, name: string, alias: string },
    path: string[],
    value: any,
    meta: NonNullable<$MessageTemplateFieldMeta['enum']>,
    trx: AnyTrxNode
) {
    if (typeof value === 'string') {
        if (meta.enumpath) {
            let _enum;
            const v = Tree.get(raw, meta.enumpath[1])
            const enumName = meta.enumpath[0] + '.' + v
            try {
                _enum = trx.enum(enumName)
            }
            catch {
                throw NesoiError.Message.InvalidEnumScope({ alias: field.alias, path: path.join('.'), value: v, fieldpath: meta.enumpath[1] })
            }

            const keys = _enum.keys();
            if (keys.includes(value)) {
                return value;
            }
            else {
                throw NesoiError.Message.InvalidFieldEnumValue({ alias: field.alias, path: path.join('.'), value, type: 'enum', options: keys as string[] });
            }
        }
        else  {
            if (value in meta.options) {
                return value;
            }
            else {
                throw NesoiError.Message.InvalidFieldEnumValue({ alias: field.alias, path: path.join('.'), value, type: 'enum', options: Object.keys(meta.options) });
            }
        }
    }
    throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'string' });
}

export function parseFile(field: { pathRaw: string, name: string, alias: string }, path: string[], value: any, options?: {
    maxsize?: number
    extnames?: string[]
}) {
    if (!(value instanceof NesoiFile)) {
        throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'file' });
    }
    if (options?.maxsize) {
        if (value.size > options?.maxsize) {
            throw NesoiError.Message.FileTooBig({ alias: field.alias, path: path.join('.'), maxsize: options?.maxsize });
        }
    }
    if (options?.extnames) {
        if (!options?.extnames.includes(value.extname)) {
            throw NesoiError.Message.FileExtNotAllowed({ alias: field.alias, path: path.join('.'), options: options?.extnames });
        }
    }
    return value;
}

export function parseFloat_(field: { pathRaw: string, alias: string }, path: string[], value: any) {
    if (typeof value === 'string') {
        const val = parseFloat(value);
        if (!Number.isNaN(val)) {
            return val;
        }
    }
    else if (typeof value === 'number') {
        if (!Number.isNaN(value)) {
            return value;
        }
    }
    throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'float' });
}

export async function parseId<
    M extends $Module,
    Name extends BucketName<M>,
    View extends ViewName<M['buckets'][Name]> | undefined
>(
    field: { pathRaw: string, alias: string },
    path: string[],
    value: any,
    trx: AnyTrxNode,
    bucket: Tag,
    type?: 'int'|'string',
    view?: View
) {
    let val;
    if (type === 'string') {
        val = parseString(field, path, value);
    }
    else {
        val = parseInt_(field, path, value);
    }
    return {
        id: val,
        obj: view
            ? await trx.bucket(bucket.short).viewOneOrFail(val, view)
            : await trx.bucket(bucket.short).readOneOrFail(val)
    }; 
}

export function parseInt_(field: { pathRaw: string, alias: string }, path: string[], value: any) {
    if (typeof value === 'string') {
        const val = parseInt(value);
        if (!Number.isNaN(val)) {
            return val;
        }
    }
    else if (typeof value === 'number') {
        const val = Math.floor(value);
        if (!Number.isNaN(val)) {
            return val;
        }
    }
    throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'integer' });
}

export function parseString(field: { pathRaw: string, alias: string }, path: string[], value: any) {
    if (typeof value === 'string') {
        return value;
    }
    throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'string' });
}

export function parseLiteral(field: { pathRaw: string, alias: string }, path: string[], value: any, template: string) {
    if (typeof value === 'string') {
        const regex = new RegExp(template);
        if (!value.match(regex)) {
            throw NesoiError.Message.InvalidLiteral({ alias: field.alias, path: path.join('.'), value, template })
        }
        return value;
    }
    throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'string' });
}

export function parseStringOrNumber(field: { pathRaw: string, alias: string }, path: string[], value: any) {
    if (typeof value === 'string' || typeof value === 'number') {
        return value;
    }
    throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'string_or_number' });
}

export function parseDict(
    field: { pathRaw: string, alias: string, children?: $MessageTemplateFields },
    path: string[],
    value: any
) {
    if (typeof value === 'object') {
        const children: Record<string, {
            field: $MessageTemplateField,
            value?: any
        }> = {};
        for (const key in value) {
            const _field = field.children!['#'];
            children[key] = {
                field: _field,
                value: value[key]
            };
        }
        return children
    }
    throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'dict' });
}

export function parseList(
    field: { pathRaw: string, alias: string, children?: $MessageTemplateFields },
    path: string[],
    value: any
) {
    if (!Array.isArray(value)) {
        throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'list' });
    }
    const children: Record<string, {
        field: $MessageTemplateField,
        value?: any
    }> = {};

    for (let i = 0; i < value.length; i++) {
        const _field = field.children!['#'];
        children[i] = {
            field: _field,
            value: value[i]
        };
    }
    return children
}

export function parseObj(
    field: { pathRaw: string, alias: string, children?: $MessageTemplateFields },
    path: string[],
    value: any
) {
    if (typeof value === 'object') {
        if (!field.children) return {};

        const children: Record<string, {
            field: $MessageTemplateField,
            value?: any
        }> = {};
        for (const key in field.children) {
            const _field = field.children[key] as $MessageTemplateField;
            const key_raw = _field.pathRaw.split('.')[path.length]
            const key_parsed = _field.pathParsed.split('.')[path.length]
            children[key_parsed] = {
                field: _field,
                value: value[key_raw]
            };
        }
        return children;
    }
    throw NesoiError.Message.InvalidFieldType({ alias: field.alias, path: path.join('.'), value, type: 'object' });
}
