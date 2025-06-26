import { parseDict, parseBoolean, parseDate, parseDatetime, parseEnum, parseFile, parseFloat_, parseId, parseInt_, parseObj, parseString, parseStringOrNumber, parseDecimal, parseDuration } from '~/engine/util/parse';
import { $MessageTemplateField } from './message_template.schema';
import { NesoiError } from '~/engine/data/error';
import { AnyTrxNode } from '~/engine/transaction/trx_node';

export async function MessageTemplateFieldParser(
    raw: Record<string, any>,
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    value: any
): Promise<any> {
    return parseFieldValue(trx, field, field.path_raw, raw, value);
}

// Attempt to parse a field value
// - If field is an array, this method is run for each value, sequentially
// - If not, it's run for the original value, once
//
// - This method stacks with the .or options
//
async function parseFieldValue(
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    path: string,
    raw: Record<string, any>,
    value: any
): Promise<any> {
    if (isEmpty(value)) {
        if (field.required) {
            throw NesoiError.Message.FieldIsRequired({ field: field.alias, path, value });
        }
        else if (field.defaultValue !== undefined) {
            return field.defaultValue;
        }
        else {
            return undefined;
        }
    }

    if (field.array) {
        if (!Array.isArray(value)) {
            throw NesoiError.Message.InvalidFieldType({ field: field.alias, path, value, type: 'list' });
        }
        if (field.required && !value.length) {
            throw NesoiError.Message.FieldIsRequired({ field: field.alias, path, value });
        }
        const parsedValue = [];
        for (let i = 0; i < value.length; i++) {
            const v = value[i];
            const parsed = await _attemptUnion(trx, field, `${path}.${i}`, raw, v);
            parsedValue.push(parsed);
        }
        return parsedValue;
    }
    return _attemptUnion(trx, field, path, raw, value);
}

async function _attemptUnion(
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    path: string,
    raw: Record<string, any>,
    value: any,
    unionErrors: any[] = []
): Promise<any> {
    try {
        return await _runParseMethod(trx, field, path, raw, value)
    }
    catch(e) {
        // If failed and there's a second option, atempt it
        if (field.or) {
            return await _attemptUnion(trx, field.or, path, raw, value, [...unionErrors, e]);
        }
        // If this error was not the first attempt, and we have no other option
        // we throw a specific error
        // This avoid confusion for the client when parsing unions
        if (unionErrors.length) {
            throw NesoiError.Message.ValueDoesntMatchUnion({ field: field.alias, path, value, unionErrors: [...unionErrors, e] });
        }
        throw e;
    }
}


async function _runParseMethod(
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    path: string,
    raw: Record<string, any>,
    value: any,
): Promise<any> {
    
    switch (field.type) {
    case 'obj':
    case 'dict':
        return await parseParentField(trx, field, path, raw, value);
    case 'unknown':
        return value;
    case 'boolean':
        return parseBoolean(field, path, value)
    case 'date':
        return parseDate(field, path, value)
    case 'datetime':
        return parseDatetime(field, path, value)
    case 'duration':
        return parseDuration(field, path, value)
    case 'decimal':
        return parseDecimal(field, path, value)
    case 'enum':
        return parseEnum(raw, field, path, value, field.meta.enum!.options!, trx)
    case 'file':
        return parseFile(field, path, value, field.meta.file!)
    case 'float':
        return parseFloat_(field, path, value)
    case 'int':
        return parseInt_(field, path, value)
    case 'string':
        return parseString(field, path, value)
    case 'string_or_number':
        return parseStringOrNumber(field, path, value)
    case 'id':
        return await parseIdField(trx, field, path, value)
    }

    throw NesoiError.Builder.Message.UnknownTemplateFieldType(field.type);

}

async function parseParentField(
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    path: string,
    raw: Record<string, any>,
    value: any,
): Promise<any> {

    let children;
    if (field.type === 'obj') {
        children = parseObj(field, path, value)
    }
    else {
        children = parseDict(field, path, value)
    }

    const parsed: Record<string, any> = {};
    for (const key in children) {
        const child = children[key];
        parsed[key] = await parseFieldValue(trx, child.field, `${path}.${key}`, raw, child.value);
    }
    return parsed;
}

async function parseIdField(
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    path: string,
    value: any
): Promise<any> {
    const bucket = field.meta.id!.bucket;
    const type = field.meta.id!.type;
    const view = field.meta.id!.view;
    const parsed = await parseId(field, path, value, trx, bucket.refName, type, view) as any;
    if (field.array) {
        return parsed.map((p: any) => p.obj)
    }
    else {
        return parsed.obj
    }   
}


/**
 * Empty values: `{}`, `[]`, `''`, `null`, `undefined`
 */
export function isEmpty(value: any) {
    if (value === null || value === undefined) {
        return true;
    }
    if (Array.isArray(value)) {
        return value.length === 0
    }
    if (typeof value === 'object') {
        return Object.keys(value).length === 0
    }
    if (typeof value === 'string') {
        return value.length === 0;
    }
    return false;
}