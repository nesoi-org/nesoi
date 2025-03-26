// import { AnyTrxNode } from '~/engine/transaction/trx_node';
// import { NesoiObj } from '~/engine/data/obj';
// import { NesoiError } from '~/engine/data/error';
// import { Tree } from '~/engine/data/tree';
// import { $BucketView } from '../view/bucket_view.schema';
// import { BucketQuery } from '../query/bucket_query';
// import { BucketAdapter } from './bucket_adapter';
// import { MemoryBucketAdapter } from './memory.bucket_adapter';

// /**
//  * This is a slow implementation of the query engine for a Memory Bucket.
//  * 
//  * It goes through all objects and applies all rules. If one returns false,
//  * it skips and goes to the next.
//  */
// export class MemoryBucketQuery extends BucketQuery {

//     async run<Obj extends NesoiObj, V extends $BucketView>(
//         adapter: BucketAdapter<Obj>,
//         trx: AnyTrxNode,
//         view: V,
//         query: $BucketQuery,
//         pagination?: NQL_Pagination
//     ) {
//         const filtered: Obj[] = [];

//         await this.parse(trx, view, query);
//         const memory = adapter as MemoryBucketAdapter<Obj>;

//         for (const id in memory.data) {
//             const obj = (memory.data as any)[id] as Obj;
//             const match = await this.checkObj(view, obj, query);
//             if (match) {
//                 filtered.push(obj);
//             }
//         }

//         return filtered;
//     }

//     private async checkObj<Obj extends NesoiObj, V extends $BucketView>(
//         view: V,
//         obj: Obj,
//         query: $BucketQuery
//     ) {
//         for (const term of query.or) {
//             const match = ('$t' in term) && term.$t === 'bucket.query.rule'
//                 ? await this.applyRule(view, obj, term)
//                 : await this.checkObj(view, obj, term);
//             if (match) {
//                 return true;
//             }
//         }
//         for (const term of query.and) {
//             const match = ('$t' in term) && term.$t === 'bucket.query.rule'
//                 ? await this.applyRule(view, obj, term)
//                 : await this.checkObj(view, obj, term);
//             if (!match) {
//                 return false;
//             }
//         }
//         return true;
//     }

//     private async applyRule<Obj extends NesoiObj, V extends $BucketView>(
//         view: V,
//         obj: Obj,
//         rule: $BucketQueryRule
//     ) {
//         const field = rule.viewField;
        
//         const objVal = Tree.get(obj, rule.path);
//         let res;
//         switch (field.type) {
//         case 'id':
//             res = await this.applyIdRule(objVal, rule); break;
//         case 'int':
//         case 'float':
//             res = await this.applyNumberRule(objVal, rule); break;
//         case 'string':
//             res = await this.applyStringRule(objVal, rule); break;
//         case 'boolean':
//             res = await this.applyBooleanRule(objVal, rule); break;
//             // TODO
//             // case 'list':
//             //     return this.applyListRule(objVal, rule);
//             // case 'obj':
//             //     return this.applyObjRule(objVal, rule);
//         }
//         if (rule.not) {
//             res = !res;
//         }
//         return res;
//     }

//     private async applyIdRule(
//         objVal: number|string,
//         rule: $BucketQueryRule
//     ) {
//         switch (rule.op) {
//         case '==':
//             if (typeof rule.parsedValue !== 'number' && typeof rule.parsedValue !== 'string')
//                 throw NesoiError.Bucket.Query.InvalidRuleValueType(rule.path, 'id');
//             return objVal === rule.parsedValue;
//         case 'in':
//             if (!Array.isArray(rule.parsedValue))
//                 throw NesoiError.Bucket.Query.InvalidRuleValueType(rule.path, 'id[]');
//             return (rule.parsedValue as (number|string)[]).includes(objVal);
//         case 'present':
//             return (objVal !== undefined) === rule.parsedValue;
//         }
//     }

//     private async applyNumberRule(
//         objVal: number | number[],
//         rule: $BucketQueryRule
//     ) {
//         const isNumber = typeof objVal === 'number';
//         const isNumberList = Array.isArray(objVal) && !objVal.some(v => typeof v !== 'number');
//         if (!isNumber && !isNumberList) {
//             return false;
//         }

//         switch (rule.op) {
//         case '<':
//             return (objVal as number) < (rule.parsedValue as number);
//         case '<=':
//             return (objVal as number) <= (rule.parsedValue as number);
//         case '>':
//             return (objVal as number) > (rule.parsedValue as number);
//         case '>=':
//             return (objVal as number) >= (rule.parsedValue as number);
//         case '==':
//             return (objVal as number) === (rule.parsedValue as number);
//         case 'in':
//             return (rule.parsedValue as number[]).includes(objVal as number);
//         case 'contains':
//             return (rule.parsedValue as boolean[]).includes(rule.parsedValue as boolean);
//         case 'contains_any':
//             return (rule.parsedValue as boolean[]).some(v => (rule.parsedValue as boolean[]).includes(v));
//         case 'present':
//             return (objVal !== undefined) === rule.parsedValue;
//         }
//     }

//     private async applyStringRule(
//         objVal: string | string[],
//         rule: $BucketQueryRule
//     ) {
//         const isString = typeof objVal === 'string';
//         const isStringList = Array.isArray(objVal) && !objVal.some(v => typeof v !== 'string');
//         if (!isString && !isStringList) {
//             return false;
//         }

//         switch (rule.op) {
//         case '==':
//             if (rule.case_sensitive) {
//                 return objVal === rule.parsedValue;
//             }
//             return (objVal as string).toLowerCase() === (rule.parsedValue as string).toLowerCase()
//         case 'contains':
//             if (rule.case_sensitive) {
//                 return objVal.includes(rule.parsedValue as string);
//             }
//             return (objVal as string).toLowerCase().includes((rule.parsedValue as string).toLowerCase());
//         case 'contains_any':
//             if (rule.case_sensitive) {
//                 return (rule.parsedValue as string[]).some(v => objVal.includes(v.toString()));
//             }
//             return (rule.parsedValue as string[])
//                 .map(o => o.toString().toLowerCase())
//                 .some(v => objVal.includes(v.toString()));
//         case 'in':
//             return (rule.parsedValue as string|string[]).includes(objVal as string);
//         case 'present':
//             return (objVal !== undefined) === rule.parsedValue;
//         }
//     }

//     private async applyBooleanRule(
//         objVal: boolean | boolean[],
//         rule: $BucketQueryRule
//     ) {
//         const isBoolean = typeof objVal === 'boolean';
//         const isBooleanList = Array.isArray(objVal) && !objVal.some(v => typeof v !== 'boolean');
//         if (!isBoolean && !isBooleanList) {
//             return false;
//         }

//         switch (rule.op) {
//         case '==':
//             return objVal === rule.parsedValue;
//         case 'in':
//             return (rule.parsedValue as boolean[]).includes(objVal as boolean);
//         case 'contains':
//             return (objVal as boolean[]).includes(rule.parsedValue as boolean);
//         case 'contains_any':
//             return (rule.parsedValue as boolean[]).some(v => (objVal as boolean[]).includes(v));
//         case 'present':
//             return (objVal !== undefined) === rule.parsedValue;
//         }
//     }

//     // private async applyObjRule<Obj extends NesoiObj, V extends $BucketView>(
//     //     objVal: Record<string, any>,
//     //     rule: $BucketQueryRule
//     // ) {
//     //     if (typeof objVal !== 'object' && !Array.isArray(objVal)) {
//     //         return false;
//     //     }
//     //     switch (rule.op) {
//     //     // case '==':
//     //     //     if (typeof rule.parsedValue !== 'object' && !Array.isArray(rule.parsedValue))
//     //     //         throw NesoiError.Bucket.Query.InvalidRuleValueType(rule.path, 'object');
//     //     //     return objVal === rule.parsedValue;
//     //     case 'contains':
//     //         if (typeof rule.parsedValue !== 'string')
//     //             throw NesoiError.Bucket.Query.InvalidRuleValueType(rule.path, 'string');
//     //         return Object.keys(objVal).includes(rule.parsedValue);
//     //         // case 'contains_any':
//     //         //     if (!Array.isArray(rule.parsedValue))
//     //         //         throw NesoiError.Bucket.Query.InvalidRuleValueType(rule.path, 'object');
//     //         //     return rule.parsedValue.some(v => Object.keys(objVal).includes(v));
//     //         // case 'in':
//     //         //     if (!Array.isArray(rule.parsedValue))
//     //         //         throw NesoiError.Bucket.Query.InvalidRuleValueType(rule.path, 'object');
//     //         //     return (rule.parsedValue as Record<string, any>[]).includes(objVal);
//     //     case 'present':
//     //         return objVal !== undefined;
//     //     }
//     // }

// }