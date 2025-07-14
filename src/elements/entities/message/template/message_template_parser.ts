import { parseDict, parseBoolean, parseDate, parseDatetime, parseEnum, parseFile, parseFloat_, parseId, parseInt_, parseObj, parseString, parseStringOrNumber, parseDecimal, parseDuration, parseList } from '~/engine/util/parse';
import { $MessageTemplateField, $MessageTemplateFields } from './message_template.schema';
import { NesoiError } from '~/engine/data/error';
import { AnyTrxNode } from '~/engine/transaction/trx_node';

// TODO: OPTIMIZATION
// Parse everything that's static first, then move on to
// parsing ids etc.

export async function MessageTemplateFieldParser(
    trx: AnyTrxNode,
    fields: $MessageTemplateFields,
    raw: Record<string, any>
) {
    const parsed = {} as Record<string, any>;
    const inject = {} as Record<string, any>;
    for (const k in fields) {
        const field = fields[k];
        const key_raw = field.pathRaw.split('.')[0];
        const key_parsed = field.pathParsed.split('.')[0];
        
        const value = raw[key_raw as never];
        parsed[key_parsed as never] = await parseFieldValue(trx, field, [field.name], raw, value, inject);
    }
    Object.assign(parsed, inject);
    return parsed;
}

/**
 * [Parser Step 1]
 * 
 * - Check for empty fields ({}, [], '', null, undefined)
 * - If it's array, run step 2 for each value (with this field and path+i)
 *  - If not, run step 2 for the original value (with this field and path)
 */
async function parseFieldValue(
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    path: string[],
    raw: Record<string, any>,
    value: any,
    inject: Record<string, any>
): Promise<any> {
    sanitize(field, path, value);

    if (isEmpty(value)) {
        if (field.required) {
            throw NesoiError.Message.FieldIsRequired({ alias: field.alias, path: path.join('.'), value });
        }
        else if (field.defaultValue !== undefined) {
            return field.defaultValue;
        }
        else {
            return undefined;
        }
    }

    let output = await _attemptUnion(trx, field, path, raw, value, inject);
    output = await applyFieldRules(field, path, raw, output, inject);

    return output;
}

/**
 * [Parser Step 2]
 * 
 * - Attempt to run parse method (step 3) for field.
 *  - If it fails, attempt other union options (step 2) (if available), with same path
 * - If it works, apply field rules.
 */
async function _attemptUnion(
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    path: string[],
    raw: Record<string, any>,
    value: any,
    inject: Record<string, any>
): Promise<any> {
    if (field.type !== 'union') {
        return _runParseMethod(trx, field, path, raw, value, inject)
    }

    const unionErrors: any[] = [];
    let output: any = undefined;
    for (const k in field.children) {
        const option = field.children[k];
        try {
            output = await _runParseMethod(trx, option, path, raw, value, inject)
            break;
        }
        catch(e) {
            unionErrors.push(
                {
                    option: option.alias,
                    name: (e as any).name,
                    status: (e as any).status,
                    message: (e as any).message,
                    data: (e as any).data,
                }
            )
        }
    }
    if (unionErrors.length === Object.keys(field.children!).length) {
        throw NesoiError.Message.ValueDoesntMatchUnion({ alias: field.alias, path: path.join('.'), value, unionErrors });
    }

    return output;
}

/**
 * [Parser Step 3]
 * 
 * - Run a specific parsing method based on the field type
 */
async function _runParseMethod(
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    path: string[],
    raw: Record<string, any>,
    value: any,
    inject: Record<string, any>
): Promise<any> {
    
    switch (field.type) {
    case 'obj':
    case 'dict':
    case 'list':
        return parseParentField(trx, field, path, raw, value, inject);
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
        return parseIdField(trx, field, path, value)
    }

    throw NesoiError.Builder.Message.UnknownTemplateFieldType(field.type);

}

/**
 * [Parser Step 3-b]: 'obj' or 'dict' or 'list'
 * 
 * - The parser methods only return a tuple of field and value, to be parsed again by (step 1)
 * - When calling step 1, the child property name is appended to the path
 */
async function parseParentField(
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    path: string[],
    raw: Record<string, any>,
    value: any,
    inject: Record<string, any>
): Promise<any> {

    if (field.type === 'list') {
        const children = parseList(field, path, value)
        const parsedParent: any[] = [];
        for (const key in children) {
            const child = children[key];
            parsedParent.push(await parseFieldValue(trx, child.field, [...path, key], raw, child.value, inject));
        }
        return parsedParent;
    }
    else {
        
        let children;
        if (field.type === 'obj') {
            children = parseObj(field, path, value)
        }
        else {
            children = parseDict(field, path, value)
        }
        const parsedParent: Record<string, any> = {};
        for (const key in children) {
            const child = children[key];
            parsedParent[key] = await parseFieldValue(trx, child.field, [...path, key], raw, child.value, inject);
        }
        return parsedParent;
    }    
}

/**
 * [Parser Step 3-b]: 'id'
 * 
 * - Gathers the data for parsing a id
 */
async function parseIdField(
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    path: string[],
    value: any
): Promise<any> {
    const bucket = field.meta.id!.bucket;
    const type = field.meta.id!.type;
    const view = field.meta.id!.view;
    const parsed = await parseId(field, path, value, trx, bucket.refName, type, view) as any;
    return parsed.obj
}



function sanitize(field: $MessageTemplateField, path: string[], value: any) {
    if (typeof value === 'function') {
        throw NesoiError.Message.UnsanitaryValue({
            alias: field.alias, path: path.join('.'), details: 'Functions not allowed as message inputs.'
        });
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


/**
 * Rules
 */

async function applyFieldRules(
    field: $MessageTemplateField,
    path: string[],
    raw: Record<string, any>,
    value: any|undefined,
    inject: Record<string, any>
): Promise<any> {
    let output = value;
    const rules = field.rules;

    for (const r in rules) {
        const rule = rules[r];
        const res = await rule({ field, value, path: path.join('.'), msg: raw as never, inject });
        if (typeof res === 'object') {
            output = res.set;
        }
        else if (res !== true) {
            throw NesoiError.Message.RuleFailed({ alias: field.alias, path: path.join('.'), rule, error: res });
        }
    }

    return output;
}