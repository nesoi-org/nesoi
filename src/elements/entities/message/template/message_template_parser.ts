import { parseDict, parseBoolean, parseDate, parseDatetime, parseEnum, parseFile, parseFloat_, parseId, parseInt_, parseObj, parseString, parseStringOrNumber, parseDecimal, parseDuration } from '~/engine/util/parse';
import { $MessageTemplateField, $MessageTemplateFields } from './message_template.schema';
import { NesoiError } from '~/engine/data/error';
import { AnyTrxNode } from '~/engine/transaction/trx_node';

export async function MessageTemplateFieldParser(
    raw: Record<string, any>,
    trx: AnyTrxNode,
    field: $MessageTemplateField,
    value: any,
    parseFields: (trx: AnyTrxNode, fields: $MessageTemplateFields, obj: Record<string, any>) => any
): Promise<Record<string, any>> {
        
    if (field.type === 'unknown') {
        return {
            '': value
        };
    }
            
    if (field.type === 'boolean') {
        return {
            '': await parseBoolean(field, value, field.array)
        };
    }
        
    if (field.type === 'date') {        
        return {
            '': await parseDate(field, value, field.array)
        };
    }
         
    if (field.type === 'datetime') {
        return {
            '': await parseDatetime(field, value, field.array)
        };
    }
         
    if (field.type === 'duration') {
        return {
            '': await parseDuration(field, value, field.array)
        };
    }
         
    if (field.type === 'decimal') {
        return {
            '': await parseDecimal(field, value, field.array)
        };
    }
        
    if (field.type === 'enum') {
        const options = field.meta.enum!.options!;
        return {
            '': await parseEnum(raw, field, value, field.array, options, trx)
        };
    }
    
    if (field.type === 'file') {
        const config = field.meta.file!;
        return {
            '': await parseFile(field, value, field.array, config)
        };
    }
            
    if (field.type === 'float') {
        return {
            '': await parseFloat_(field, value, field.array)
        };
    }
        
    if (field.type === 'id') {
        const bucket = field.meta.id!.bucket;
        const type = field.meta.id!.type;
        const view = field.meta.id!.view;

        const parsed = await parseId(field, value, field.array, trx, bucket.refName, type, view) as any;
        return {
            '': parsed.obj
        };
    }
        
    if (field.type === 'int') {
        return {
            '': await parseInt_(field, value, field.array)
        };
    }
            
    if (field.type === 'string') {
        return {
            '': await parseString(field, value, field.array)
        };
    }
    
    if (field.type === 'string_or_number') {
        return {
            '': await parseStringOrNumber(field, value, field.array)
        };
    }
    
    if (field.type === 'obj') {
        return {
            '': await parseObj(field, value, field.array, trx, parseFields)
        };
    }

    if (field.type === 'dict') {
        return {
            '': await parseDict(field, value, field.array, trx, parseFields)
        };
    }
    
    throw NesoiError.Builder.Message.UnknownTemplateFieldType(field.type);
}