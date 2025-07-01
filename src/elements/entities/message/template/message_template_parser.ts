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
    return parseFieldValue(trx, field, raw, value, 0);
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
    raw: Record<string, any>,
    value: any,
    path_idx: number
): Promise<any> {
    if (isEmpty(value)) {
        if (field.required) {
            throw NesoiError.Message.FieldIsRequired({ field: field.alias, path: field.path_raw, value });
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
            throw NesoiError.Message.InvalidFieldType({ field: field.alias, path: field.path_raw, value, type: 'list' });
        }
        if (field.required && !value.length) {
            throw NesoiError.Message.FieldIsRequired({ field: field.alias, path: field.path_raw, value });
        }
        const parsedValue = [];
        for (let i = 0; i < value.length; i++) {
            const v = value[i];
            const parsed = await _attemptUnion(trx, field, raw, v, path_idx+1);
            parsedValue.push(parsed);
        }
        return parsedValue;
    }
    return _attemptUnion(trx, field, raw, value, path_idx);
}

async function _attemptUnion(
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    raw: Record<string, any>,
    value: any,
    path_idx: number,
    unionErrors: any[] = []
): Promise<any> {
    try {
        return await _runParseMethod(trx, field, raw, value, path_idx)
    }
    catch(e) {
        // If failed and there's a second option, atempt it
        if (field.or) {
            return await _attemptUnion(trx, field.or, raw, value, path_idx, [...unionErrors, e]);
        }
        // If this error was not the first attempt, and we have no other option
        // we throw a specific error
        // This avoid confusion for the client when parsing unions
        if (unionErrors.length) {
            throw NesoiError.Message.ValueDoesntMatchUnion({ field: field.alias, path: field.path_raw, value, unionErrors: [...unionErrors, e] });
        }
        throw e;
    }
}


async function _runParseMethod(
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    raw: Record<string, any>,
    value: any,
    path_idx: number
): Promise<any> {
    
    switch (field.type) {
    case 'obj':
    case 'dict':
        return await parseParentField(trx, field, raw, value, path_idx);
    case 'unknown':
        return value;
    case 'boolean':
        return parseBoolean(field, value)
    case 'date':
        return parseDate(field, value)
    case 'datetime':
        return parseDatetime(field, value)
    case 'duration':
        return parseDuration(field, value)
    case 'decimal':
        return parseDecimal(field, value)
    case 'enum':
        return parseEnum(raw, field, value, field.meta.enum!.options!, trx)
    case 'file':
        return parseFile(field, value, field.meta.file!)
    case 'float':
        return parseFloat_(field, value)
    case 'int':
        return parseInt_(field, value)
    case 'string':
        return parseString(field, value)
    case 'string_or_number':
        return parseStringOrNumber(field, value)
    case 'id':
        return await parseIdField(trx, field, value)
    }

    throw NesoiError.Builder.Message.UnknownTemplateFieldType(field.type);

}

async function parseParentField(
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    raw: Record<string, any>,
    value: any,
    path_idx: number
): Promise<any> {

    let children;
    if (field.type === 'obj') {
        children = parseObj(field, value, path_idx)
    }
    else {
        children = parseDict(field, value)
    }

    const parsed: Record<string, any> = {};
    for (const key in children) {
        const child = children[key];
        parsed[key] = await parseFieldValue(trx, child.field, raw, child.value, path_idx+1);
    }
    return parsed;
}

async function parseIdField(
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    value: any
): Promise<any> {
    const bucket = field.meta.id!.bucket;
    const type = field.meta.id!.type;
    const view = field.meta.id!.view;
    const parsed = await parseId(field, value, trx, bucket.refName, type, view) as any;
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