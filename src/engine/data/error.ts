/* eslint-disable @typescript-eslint/no-namespace */
// eslint-disable-next-line unused-imports/no-unused-imports
import { AnyModule, Module } from '~/engine/module';
// eslint-disable-next-line unused-imports/no-unused-imports
import { $Job } from '~/elements/blocks/job/job.schema';
import { $MessageTemplateRule } from '~/elements/entities/message/template/message_template.schema';
import { $Resource } from '~/elements/blocks/resource/resource.schema';
// eslint-disable-next-line unused-imports/no-unused-imports
import { Bucket } from '~/elements/entities/bucket/bucket';
import { AnyQuery } from '~/elements/entities/bucket/query/nql.schema';

export namespace NesoiError {

    export class BaseError extends Error {
        constructor(
            public name: string,
            message: string,
            public status = 400,
            public data?: Record<string, any>
        ) {
            super(message);
        }

        toString() {
            return `[${this.name}] ${this.message}`;
        }
    }

    enum Status {
        BAD_REQUEST = 400,
        NOT_FOUND = 404,
        PRECONDITION_FAILED = 412,
        UNAUTHORIZED = 401,
        INTERNAL_ERROR = 500
    }

    export namespace Builder {


        export function UnmetModuleDependency($: { from: string, dep: string }) {
            return new BaseError(
                'Builder.UnmetModuleDependency',
                `Unment module dependency '${$.dep}' while building '${$.from}'.`,
                Status.INTERNAL_ERROR, $
            );
        }

        export function UnmetDependency($: { from: string, dep: string }) {
            return new BaseError(
                'Builder.UnmetDependency',
                `Unment dependency '${$.dep}' while building '${$.from}'.`,
                Status.INTERNAL_ERROR, $
            );
        }

        export function UnmetDependencyEnum($: { from: string, dep: string }) {
            return new BaseError(
                'Builder.UnmetDependencyEnum',
                `Unment dependency enum '${$.dep}' while building '${$.from}'.`,
                Status.INTERNAL_ERROR, $
            );
        }

        export function UnmetDependencyValue($: { from: string, dep: string }) {
            return new BaseError(
                'Builder.UnmetDependencyValue',
                `Unment dependency value '${$.dep}' while building '${$.from}'.`,
                Status.INTERNAL_ERROR, $
            );
        }

        export function NotImportedDependency($: { from: string, dep: string }) {
            return new BaseError(
                'Builder.NotImportedDependency',
                `Dependency '${$.dep}' must be included on '${$.from}' externals.`,
                Status.INTERNAL_ERROR, $
            );
        }

        export function CircularDependency($: {}) {
            return new BaseError(
                'Builder.CircularDependency',
                'Circular dependency found while building.',
                Status.INTERNAL_ERROR, $
            );
        }

        export namespace Job {
            export function NoMethod($: { job: string }) {
                return new BaseError(
                    'Builder.Job.NoMethod',
                    `Job '${$.job}' doesn't declare a method`,
                    Status.INTERNAL_ERROR, $
                );
            }
        }

        export namespace Bucket {
            export function UnknownModelField(path: string) {
                return new BaseError('Builder.Bucket.UnknownModelField', `Bucket model has no field ${path}`, Status.NOT_FOUND);
            }
            export function UnknownGraphLink(name: string) {
                return new BaseError('Builder.Bucket.UnknownGraphLink', `Bucket graph has no link ${name}`, Status.NOT_FOUND);
            }
            export function UnknownViewName(name: string) {
                return new BaseError('Builder.Bucket.UnknownViewName', `Bucket has no view ${name}`, Status.NOT_FOUND);
            }
            export function NoChildrenOnViewGroup(name: string) {
                return new BaseError('Builder.Bucket.NoChildrenOnViewGroup', `Bucket view group ${name} has no children`, Status.NOT_FOUND);
            }
            export function CompositionThroughPivotNotAllowed($: { bucket: string, link: string }) {
                return new BaseError(
                    'Builder.Bucket.CompositionThroughPivotNotAllowed',
                    `Link '${$.link}' on bucket '${$.bucket}' passes through pivot, so it cannot be a composition`,
                    Status.INTERNAL_ERROR
                );
            }
        }

        export namespace Message {
            export function UnknownTemplateFieldType(type: string) {
                return new BaseError('Builder.Message.UnknownTemplateFieldType', `Message field has unknown type ${type}`, Status.NOT_FOUND);
            }
            export function UnknownModuleMessage(name: string) {
                return new BaseError('Builder.Message.UnknownModuleMessage', `Message ${name} not found on module`, Status.NOT_FOUND);
            }
        }

        export namespace Resource {
            export function BucketNotFound(resource: string, bucket: string) {
                return new BaseError('Builder.Resource.BucketRequired', `Resource ${resource} declares an unknown bucket ${bucket}`, Status.NOT_FOUND);
            }
            export function CustomInputRequiresPrepare(resource: string) {
                return new BaseError('Builder.Resource.CustomInputRequiresPrepare', `Resource job '${resource}' declares a custom input, so it must declare a prepare method.`, Status.NOT_FOUND);
            }
        }

    }

    export namespace Space {

        export function DirectoryDoesntExists(dir: string) {
            return new BaseError('Space.DirectoryDoesntExists', `Directory '${module}' not found on space`, Status.INTERNAL_ERROR);
        }

        export function NoModulesFolder() {
            return new BaseError('Space.NoModulesFolder', 'No modules folder found on space root', Status.INTERNAL_ERROR);
        }
    }

    export namespace App {

        export function ModuleNotFound(module: string) {
            return new BaseError('App.ModuleNotFound', `Module ${module} not found on app space`, Status.NOT_FOUND);
        }
    }

    export namespace Module {

        export function UnknownBuilderType(module: AnyModule, filename: string, key: string, $b: string) {
            return new BaseError('Module.UnknownBuilderType', `File ${filename} contains an unknown builder type '${$b}' exported as '${key}'`, Status.NOT_FOUND);
        }

        export function EnumNotFound(module: AnyModule, name: string) {
            return new BaseError('Module.EnumNotFound', `Enum ${name} not found on module ${module.name}`, Status.NOT_FOUND);
        }

        export function JobNotIncluded(module: AnyModule, job: string) {
            return new BaseError('Module.JobNotIncluded', `Job ${job} not included on module ${module.name}`, Status.NOT_FOUND);
        }

        export function ResourceNotIncluded(module: AnyModule, resource: string) {
            return new BaseError('Module.ResourceNotIncluded', `Resource ${resource} not included on module ${module.name}`, Status.NOT_FOUND);
        }

        export function MachineNotIncluded(module: AnyModule, machine: string) {
            return new BaseError('Module.MachineNotIncluded', `Machine ${machine} not included on module ${module.name}`, Status.NOT_FOUND);
        }

        export function QueueNotIncluded(module: AnyModule, queue: string) {
            return new BaseError('Module.QueueNotIncluded', `Queue ${queue} not included on module ${module.name}`, Status.NOT_FOUND);
        }

        export function TopicNotIncluded(module: AnyModule, topic: string) {
            return new BaseError('Module.TopicNotIncluded', `Topic ${topic} not included on module ${module.name}`, Status.NOT_FOUND);
        }

        export function ControllerNotIncluded(module: AnyModule, controller: string) {
            return new BaseError('Module.ControllerNotIncluded', `Controller ${controller} not included on module ${module.name}`, Status.NOT_FOUND);
        }

        export function InlineMessageNotFoundOnMerge(msg: string) {
            return new BaseError('Module.InlineMessageNotFoundOnMerge', `Inline message ${msg} not found during merge`, Status.NOT_FOUND);
        }

        export function InlineJobNotFoundOnMerge(job: string) {
            return new BaseError('Module.InlineJobNotFoundOnMerge', `Inline job ${job} not found during merge`, Status.NOT_FOUND);
        }
    }

    export namespace Auth {
        export function NoProvidersRegisteredForModule(module: string) {
            return new BaseError('Auth.NoProvidersRegisteredForModule', `No authentication providers registered for module ${module}`, Status.NOT_FOUND);
        }
        export function NoProviderRegisteredForModule(module: string, provider: string) {
            return new BaseError('Auth.NoProviderRegisteredForModule', `No authentication provider named ${provider} registered for module ${module}`, Status.NOT_FOUND);
        }
    }

    export namespace Trx {
        export function DaemonNotFound(module: string) {
            return new BaseError('Trx.DaemonNotFound', `Daemon not found for module ${module}`, Status.INTERNAL_ERROR);
        }
        export function ModuleNotFound(module: string) {
            return new BaseError('Trx.ModuleNotFound', `Module ${module} not found on app`, Status.INTERNAL_ERROR);
        }
        export function NodeNotFound(node: string, trx: string) {
            return new BaseError('Trx.NodeNotFoundOnTrx', `Node ${node} not found on transaction ${trx}`, Status.INTERNAL_ERROR);
        }
        export function Unauthorized($: { providers: string[] }) {
            return new BaseError(
                'Trx.Unauthorized',
                `Transaction not authenticated/authorized. Providers: ${$.providers}`,
                Status.UNAUTHORIZED, $
            );
        }
    }

    /*
        Elements / Entities
    */

    export namespace Bucket {

        export function InvalidId($: { bucket: string, id: any }) {
            return new BaseError(
                'Bucket.InvalidId',
                `Read attempt of '${$.bucket}' failed with invalid id '${$.id}'`,
                Status.BAD_REQUEST, $
            );
        }

        export function ObjNotFound($: { bucket: string, id: number | string }) {
            return new BaseError(
                'Bucket.ObjNotFound',
                `Bucket '${$.bucket}' has no object with id '${$.id}'`,
                Status.NOT_FOUND, $);
        }

        export function ViewNotFound($: { bucket: string, view: string }) {
            return new BaseError(
                'Bucket.ViewNotFound',
                `Bucket '${$.bucket}' has no view named '${$.view}'`,
                Status.NOT_FOUND, $);
        }

        export function NoUpdatedAtField($: { bucket: string, id: number | string, field: string }) {
            return new BaseError(
                'Bucket.NoUpdatedAtField',
                `Bucket '${$.bucket}' object with id '${$.id}' has no '${$.field}' field (required for cache)`,
                Status.PRECONDITION_FAILED, $);
        }

        export function MissingComposition($: { method: string, bucket: string, link: string }) {
            return new BaseError(
                'Bucket.MissingComposition',
                `Request to ${$.method} bucket '${$.bucket}' failed, missing composition for link ${$.link}`,
                Status.BAD_REQUEST);
        }

        export function CompositionValueShouldBeArray($: { method: string, bucket: string, link: string }) {
            return new BaseError(
                'Bucket.CompositionValueShouldBeArray',
                `Request to ${$.method} bucket '${$.bucket}' failed, composition for link ${$.link} should be an array`,
                Status.BAD_REQUEST, $);
        }

        export function FieldNotFound($: { path: string, bucket: string }) {
            return new BaseError(
                'Bucket.FieldNotFound',
                `Field '${$.path}' not found on bucket '${$.bucket}'`,
                Status.NOT_FOUND, $);
        }

        export namespace Graph {

            export function LinkNotFound($: { bucket: string, link: string }) {
                return new BaseError(
                    'Bucket.Graph.LinkNotFound',
                    `Bucket '${$.bucket}' has no graph link named '${$.link}'`,
                    Status.NOT_FOUND, $);
            }
            
            export function LinkManyRefOnSelfWithoutArrayValue(link: string) {
                return new BaseError('Bucket.Graph.LinkManyRefOnSelfWithoutArrayValue', `Link ${link} is a 1..n relation with key on self, which requires an array as value for reading`, Status.NOT_FOUND);
            }
            export function LinkManyRefOffSelfWithArrayValue(link: string) {
                return new BaseError('Bucket.Graph.LinkManyRefOffSelfWithArrayValue', `Link ${link} is a 1..n relation with key on other/pivot, which does not support an array as value for reading`, Status.NOT_FOUND);
            }
            export function LinkOneWithArrayValue(link: string) {
                return new BaseError('Bucket.Graph.LinkOneWithArrayValue', `Link ${link} is a 1..1 relation, which does not support an array as value for reading`, Status.NOT_FOUND);
            }
            export function PivotValueIsUndefined(link: string) {
                return new BaseError('Bucket.Graph.PivotValueIsUndefined', `Link ${link} has a pivot value with undefined/null on the other id`, Status.NOT_FOUND);
            }
            export function RequiredLinkNotFound($: { bucket: string, link: string, id: number|string }) {
                return new BaseError(
                    'Bucket.Graph.RequiredLinkNotFound',
                    `Link '${$.link}' of '${$.bucket}' not found for object with id ${$.id}`,
                    Status.PRECONDITION_FAILED, $);
            }
        }

        export namespace Query {

            export function NoResults($: { bucket: string, query: AnyQuery<any, any> }) {
                return new BaseError(
                    'Bucket.Query.NoResults',
                    `Query to bucket '${$.bucket}' returned no results`,
                    Status.NOT_FOUND, $);
            }

            export function ViewNotFound(bucket: string, view: string) {
                return new BaseError('Bucket.Query.InvalidObjectValueType', `View ${view} not found on bucket ${bucket}, required for querying`, Status.NOT_FOUND);
            }
            export function PathNotFoundOnView(path: string, view: string) {
                return new BaseError('Bucket.Query.PathNotFoundOnView', `Path ${path} was not found on view ${view}`, Status.NOT_FOUND);
            }
            export function NonModelSearchNotImplemented(path: string, view: string) {
                return new BaseError('Bucket.Query.NonModelSearchNotImplemented', `Query for ${path} on view ${view} failed because it's not a model field. Computed and graph fields should be implemented soon.`, Status.NOT_FOUND);
            }
            export function InvalidRuleValueType(path: string, type: string) {
                return new BaseError('Bucket.Query.InvalidFieldValueType', `Rule ${path} is not a ${type}`, Status.NOT_FOUND);
            }
            export function InvalidOpForFieldType(path: string, op: string, type: string) {
                return new BaseError('Bucket.Query.InvalidOpForFieldType', `Rule ${path} op ${op} if not supported by field ${type}`, Status.NOT_FOUND);
            }
        }

        export namespace Fieldpath {
            export function InvalidIndexLength($: { fieldpath: string, index: (string|number)[] }) {
                return new BaseError(
                    'Bucket.Fieldpath.InvalidIndexLength',
                    `Attempt to parse fieldpath '${$.fieldpath}' failed due to invalid number of indexes: ${$.index}`,
                    Status.BAD_REQUEST, $);
            }
        }

        export namespace Model {
            export function InvalidEnum($: { bucket: string, value: string, options: string[] }) {
                return new BaseError(
                    'Bucket.Model.InvalidEnum',
                    `Value '${$.value}' for bucket '${$.bucket}' doesn't match the options: ${$.options}.`,
                    Status.BAD_REQUEST, $);
            }
            export function InvalidISODate($: { bucket: string, value: string }) {
                return new BaseError(
                    'Bucket.Model.InvalidISODate',
                    `Value '${$.value}' for bucket '${$.bucket}' is not an ISO date.`,
                    Status.BAD_REQUEST, $);
            }
            export function InvalidNesoiDate($: { bucket: string, value: string }) {
                return new BaseError(
                    'Bucket.Model.InvalidNesoiDate',
                    `Value '${$.value}' for bucket '${$.bucket}' is not a Nesoi date.`,
                    Status.BAD_REQUEST, $);
            }
            export function InvalidISODatetime($: { bucket: string, value: string }) {
                return new BaseError(
                    'Bucket.Model.InvalidISODatetime',
                    `Value '${$.value}' for bucket '${$.bucket}' is not an ISO date.`,
                    Status.BAD_REQUEST, $);
            }
            export function InvalidNesoiDatetime($: { bucket: string, value: string }) {
                return new BaseError(
                    'Bucket.Model.InvalidNesoiDatetime',
                    `Value '${$.value}' for bucket '${$.bucket}' is not a Nesoi date.`,
                    Status.BAD_REQUEST, $);
            }
        }

        export namespace Drive {
            export function NoAdapter($: { bucket: string }) {
                return new BaseError(
                    'Bucket.Drive.NoAdapter',
                    `Bucket '${$.bucket}' needs a DriveAdapter configured to handle files.`,
                    Status.BAD_REQUEST, $);
            }
        }

    }

    export namespace Data {

        export function InvalidISOString($: { value: string }) {
            return new BaseError(
                'Message.Data.InvalidISOString',
                `'${$.value}' is not a valid ISO string`,
                Status.BAD_REQUEST, $);
        }

        export function InvalidDuration($: { value: string }) {
            return new BaseError(
                'Message.Data.InvalidDuration',
                `'${$.value}' is not a valid duration`,
                Status.BAD_REQUEST, $);
        }

        export function InvalidDurationUnit($: { value: string, unit: string }) {
            return new BaseError(
                'Message.Data.InvalidDuration',
                `Invalid unit '${$.unit}' for duration '${$.value}'`,
                Status.BAD_REQUEST, $);
        }

        export function UnsupportedDecimalPrecision($: { left: number, right: number }) {
            return new BaseError(
                'Message.Data.UnsupportedDecimalPrecision',
                `Decimal precision [${$.left},${$.right}]' is invalid. Supported range: 1~12.`,
                Status.BAD_REQUEST, $);
        }

        export function DecimalLeftTooBig($: { value: string, prec: number }) {
            return new BaseError(
                'Message.Data.DecimalLeftTooBig',
                `Left part of decimal value '${$.value}' exceeds precision of ${$.prec}`,
                Status.BAD_REQUEST, $);
        }

        export function DecimalRightTooBig($: { value: string, prec: number }) {
            return new BaseError(
                'Message.Data.DecimalRightTooBig',
                `Right part of decimal value '${$.value}' exceeds precision of ${$.prec}`,
                Status.BAD_REQUEST, $);
        }

        export function InvalidDecimalValue($: { value: string }) {
            return new BaseError(
                'Message.Data.InvalidDecimalValue',
                `Invalid decimal value '${$.value}'`,
                Status.BAD_REQUEST, $);
        }
    }

    export namespace Message {
        
        export function NoType($: { raw: Record<string, any> }) {
            return new BaseError(
                'Message.NoType',
                'Message has no "$" prop',
                Status.BAD_REQUEST, $
            );
        }
        
        export function InvalidType($: { type: any }) {
            return new BaseError(
                'Message.InvalidType',
                `Message prop "$" is an invalid value: ${$.type}`,
                Status.BAD_REQUEST, $);
        }

        export function NotSupportedByModule($: { type: string, module: string }) {
            return new BaseError(
                'Message.NotSupportedByModule',
                `Message of type '${$.type}' is not supported by module '${$.module}'`,
                Status.BAD_REQUEST, $
            );
        }


        export function InvalidLiteral($: { alias: string, path: string, value: any, template: string }) {
            return new BaseError(
                'Message.InvalidLiteral',
                `Message field '${$.alias}' does not match the template '${$.template}'`,
                Status.BAD_REQUEST, $
            );
        }
        
        export function InvalidEnumScope($: { alias: string, path: string, value: any, fieldpath: string }) {
            return new BaseError(
                'Message.InvalidEnumScope',
                `${$.alias} is an enum with dynamic scope, and the path '${$.fieldpath}' of the message has an invalid value '${$.value}'`,
                Status.BAD_REQUEST, $
            );
        }
        
        export function InvalidFieldEnumValue($: { alias: string, path: string, value: any, type: string, options: string[] }) {
            return new BaseError(
                'Message.InvalidFieldEnumValue',
                `Message field '${$.alias}' value '${$.value}' should be one of the following: ${$.options?.join(',')}`,
                Status.BAD_REQUEST, $);
        }
        
        export function InvalidFieldType($: { alias: string, path: string, value: any, type: string }) {
            return new BaseError(
                'Message.InvalidFieldType',
                `Message field '${$.alias}' value '${$.value}' is not of type '${$.type}'`,
                Status.BAD_REQUEST, $);
        }
        
        export function ValueDoesntMatchUnion($: { alias: string, path: string, value: any, unionErrors: Record<string, any>[] }) {
            return new BaseError(
                'Message.ValueDoesntMatchUnion',
                `Message field '${$.alias}' (${$.path}) value '${$.value}' doesn't match any of the union options'`,
                Status.BAD_REQUEST, $);
        }

        export function UnsanitaryValue($: { alias: string, path: string, details: string }) {
            return new BaseError(
                'Message.UnsanitaryValue',
                $.details,
                Status.BAD_REQUEST, $
            );
        }

        export function FieldIsRequired($: { alias: string, path: string, value: any }) {
            return new BaseError(
                'Message.FieldIsRequired',
                `Field ${$.alias} (${$.path}) is required`,
                Status.BAD_REQUEST, $);
        }

        export function RuleFailed($: { alias: string, path: string, rule: $MessageTemplateRule, error: string }) {
            return new BaseError(
                'Message.RuleFailed',
                $.error,
                Status.BAD_REQUEST, $
            );
        }

        export function FileTooBig($: { alias: string, path: string, maxsize: number }) {
            return new BaseError(
                'Message.FileTooBig',
                `${$.alias} size exceeds max (${$.maxsize})`,
                Status.BAD_REQUEST, $
            );
        }

        export function FileExtNotAllowed($: { alias: string, path: string, options: string[] }) {
            return new BaseError(
                'Message.FileExtNotAllowed',
                `${$.alias} extension not allowed. Options: ${$.options}`,
                Status.BAD_REQUEST, $
            );
        }

    }

    /*
        Elements / Blocks
    */

    export namespace Block {

        export function InvalidSchema($: { name: string, type: string, expectedType: string }) {
            return new BaseError(
                'Block.InvalidSchema',
                `Schema '${$.name}' has invalid type '${$.type}'. Expected ${$.expectedType}.`,
                Status.INTERNAL_ERROR, $);
        }

        export function MessageNotSupported($: { block: string, message: string }) {
            return new BaseError(
                'Block.MessageNotSupported',
                `Block '${$.block}' expects no message of type '${$.message}'.`,
                Status.BAD_REQUEST, $);
        }

    }

    export namespace Job {

        export function ConditionUnmet($: { job: string, error: string }) {
            return new BaseError(
                'Job.ConditionUnmet',
                `${$.job} condition unmet: ${$.error}`,
                Status.BAD_REQUEST, $);
        }

    }

    export namespace Resource {

        export function ViewNotSupported(resource: $Resource) {
            return new BaseError('Resource.ViewNotSupported', `Resource ${resource.name} doesn't support 'view'.`, Status.NOT_FOUND);
        }

        export function QueryNotSupported(resource: $Resource) {
            return new BaseError('Resource.QueryNotSupported', `Resource ${resource.name} doesn't support 'query'.`, Status.NOT_FOUND);
        }

        export function CreateNotSupported(resource: $Resource) {
            return new BaseError('Resource.CreateNotSupported', `Resource ${resource.name} doesn't support 'create'.`, Status.NOT_FOUND);
        }

        export function UpdateNotSupported(resource: $Resource) {
            return new BaseError('Resource.UpdateNotSupported', `Resource ${resource.name} doesn't support 'update'.`, Status.NOT_FOUND);
        }

        export function DeleteNotSupported(resource: $Resource) {
            return new BaseError('Resource.DeleteNotSupported', `Resource ${resource.name} doesn't support 'delete'.`, Status.NOT_FOUND);
        }


    }

    export namespace Machine {

        export function MessageHasNoId(alias: string) {
            return new BaseError('Machine.MessageHasNoId', `${alias} received message has no 'id'`, Status.NOT_FOUND);
        }

        export function ObjNotFound(alias: string, id: number | string) {
            return new BaseError('Machine.ObjNotFound', `${alias} object with id ${id} not found`, Status.NOT_FOUND);
        }

        export function StateNotFound(alias: string, id: number | string) {
            return new BaseError('Machine.StateNotFound', `${alias} state with id ${id} not found`, Status.NOT_FOUND);
        }

        export function UnmetCondition(alias: string, msg: string) {
            return new BaseError('Machine.UnmetCondition', `${alias}: ${msg}`, Status.NOT_FOUND);
        }

    }

    /*
        Elements / Edge
    */

    export namespace Controller {

        export function SubscribeFailed($: { topic: string }) {
            return new BaseError(
                'Controller.SubscribeFailed',
                `Failed to subscribe to topic '${$.topic}'`,
                Status.BAD_REQUEST, $);
        }

        export function UnsubscribeFailed($: { topic: string }) {
            return new BaseError(
                'Controller.UnsubscribeFailed',
                `Failed to unsubscribe to topic '${$.topic}'`,
                Status.BAD_REQUEST, $);
        }

    }
    
}