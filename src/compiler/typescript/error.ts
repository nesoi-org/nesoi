import * as ts from 'typescript';

export class MetaError extends Error {
    constructor(message: string) {
        super(message);
    }

    static DirectoryDoesntExists(dir: string) {
        return new MetaError(`Directory doesnt exists: ${dir}.`);
    }

    static FileDoesntExist(path: string) {
        return new MetaError(`File doesn't exist: ${path}`);
    }
    
    static NoModulesFolder() {
        return new MetaError('No modules folder found on project root.');
    }
}

export class ParserError extends Error {
    constructor(message: string) {
        super(message);
    }

    static ObjectPropertyIsNotAssignment() {
        return new MetaError('Object property is not an assignment.');
    }

    static StrangeValueKind(kind: ts.SyntaxKind) {
        throw new MetaError(`Strange value kind ${ts.SyntaxKind[kind]}`);
    }

    static StrangeTypeKind(kind: ts.SyntaxKind) {
        throw new MetaError(`Strange type kind ${ts.SyntaxKind[kind]}`);
    }

}

export class ConstParserError extends Error {
    constructor(message: string) {
        super(message);
    }

    static ConstValueIsWrongKind(kind: string) {
        throw new MetaError(`Constant value is of wrong kind (${kind})`);
    }
    
    static ConstValueIsStrange() {
        throw new MetaError('Constant value should be $.static or $.runtime');
    }
    
    static ConstEnumIsWrongKind(kind: string) {
        throw new MetaError(`Constant enum is of wrong kind (${kind})`);
    }
    
    static ConstEnumReturnIsWrongKind(kind: string) {
        throw new MetaError(`Constant enum return is of wrong kind (${kind})`);
    }

    static ConstEnumOptionIsWrongKind(kind: string) {
        throw new MetaError(`Constant enum option is of wrong kind (${kind})`);
    }

    static ConstEnumOptionIsStrange() {
        throw new MetaError('Constant enum option should be $.opt');
    }
}

export class ControllerParserError extends Error {
    constructor(message: string) {
        super(message);
    }

    static ControllerIsWrongKind(kind: string) {
        throw new MetaError(`Controller is of wrong kind (${kind})`);
    }

    static ControllerEndpointIsWrongKind(kind: string) {
        throw new MetaError(`Controller endpoint is of wrong kind (${kind})`);
    }

    static ControllerEndpointDefIsWrongKind(kind: string) {
        throw new MetaError(`Controller endpoint def is of wrong kind (${kind})`);
    }    
    
    static ControllerEndpointHasNoName() {
        throw new MetaError('Controller endpoint has no name');
    }
    
    static ControllerEndpointHasNoMessage() {
        throw new MetaError('Controller endpoint declares no .msg()');
    }
    
    static ControllerGroupIsWrongKind(kind: string) {
        throw new MetaError(`Controller group is of wrong kind (${kind})`);
    }
    
    static ControllerGroupHasNoName() {
        throw new MetaError('Controller group has no name');
    }
    
    static ControllerGroupDefIsWrongKind(kind: string) {
        throw new MetaError(`Controller group def is of wrong kind (${kind})`);
    }
    
}

export class MsgParserError extends Error {
    constructor(message: string) {
        super(message);
    }

    static MessageHasNoTemplate() {
        throw new MetaError('Message has no template');
    }

    static MessageTemplateIsWrongKind(kind: string) {
        throw new MetaError(`Message template is of wrong kind (${kind})`);
    }
    
    static MessageTemplateFieldIsWrongKind(kind: string) {
        throw new MetaError(`Message template field is of wrong kind (${kind})`);
    }
    
    static MessageTemplateFieldHasNoType() {
        throw new MetaError('Message template field has no type');
    }

    static MessageMultiTemplateIsWrongKind(kind: string) {
        throw new MetaError(`Message multi template is of wrong kind (${kind})`);
    }

    static MessageTemplateFieldEnumIsWrongKind(kind: string) {
        throw new MetaError(`Message template field enum is of wrong kind (${kind})`);
    }

}

export class EnumParserError extends Error {
    constructor(message: string) {
        super(message);
    }

    static ModelFieldEnumIsWrongKind(kind: string) {
        throw new MetaError(`Model field enum is of wrong kind (${kind})`);
    }

}

export class BucketParserError extends Error {
    constructor(message: string) {
        super(message);
    }

    static BucketHasNoModel() {
        throw new MetaError('Bucket has no model');
    }

    static BucketModelIsWrongKind(kind: string) {
        throw new MetaError(`Bucket model is of wrong kind (${kind})`);
    }
    
    static BucketModelFieldIsWrongKind(kind: string) {
        throw new MetaError(`Bucket model field is of wrong kind (${kind})`);
    }
    
    static BucketModelFieldHasNoType() {
        throw new MetaError('Bucket model field has no type');
    }

    static BucketHasNoGraph() {
        throw new MetaError('Bucket has no graph');
    }

    static BucketGraphIsWrongKind(kind: string) {
        throw new MetaError(`Bucket graph is of wrong kind (${kind})`);
    }
    
    static BucketGraphLinkIsWrongKind(kind: string) {
        throw new MetaError(`Bucket graph field is of wrong kind (${kind})`);
    }
    
    static BucketGraphLinkHasNoType() {
        throw new MetaError('Bucket graph field has no type');
    }
    
    static BucketGraphLinkInvalid() {
        throw new MetaError('Bucket graph link is invalid');
    }

    static BucketHasNoView() {
        throw new MetaError('Bucket has no view');
    }

    static BucketViewHasNoTemplate() {
        throw new MetaError('Bucket view has no template');
    }
    

    static BucketViewIsWrongKind(kind: string) {
        throw new MetaError(`Bucket view is of wrong kind (${kind})`);
    }
    
    static BucketViewFieldIsWrongKind(kind: string) {
        throw new MetaError(`Bucket view field is of wrong kind (${kind})`);
    }
    
    static BucketViewFieldHasNoType() {
        throw new MetaError('Bucket view field has no type');
    }

    static BucketViewFieldInvalid() {
        throw new MetaError('Bucket view field is invalid');
    }

}

export class JobParserError extends Error {
    constructor(message: string) {
        super(message);
    }

    static JobHasNoTemplate() {
        throw new MetaError('Job has no template');
    }

    static JobTemplateIsWrongKind(kind: string) {
        throw new MetaError(`Job template is of wrong kind (${kind})`);
    }
    
    static JobTemplateFieldIsWrongKind(kind: string) {
        throw new MetaError(`Job template field is of wrong kind (${kind})`);
    }
    
    static JobTemplateFieldHasNoType() {
        throw new MetaError('Job template field has no type');
    }

    static JobAuthnHasInvalidValue() {
        throw new MetaError('Job authn has invalid value');
    }  

}

export class ResourceParserError extends Error {
    constructor(message: string) {
        super(message);
    }

    static ResourceJobInputHasNoTemplate() {
        throw new MetaError('Resource job input has no template');
    }

}

export class HelperError extends Error {
    constructor(message: string) {
        super(message);
    }

    static ArrayElementIsNotString(kind: string) {
        throw new MetaError(`Array element is not a string (${kind})`);
    }
    
    static NotAStringOrArray(kind: string) {
        throw new MetaError(`Not a string or array (${kind})`);
    }
    
    static StringIsUndefined() {
        throw new MetaError('String is undefined');
    }
    
    static NotAString(kind: string) {
        throw new MetaError(`Not a string (${kind})`);
    }
}

export class TypegenError extends Error {
    constructor(message: string) {
        super(message);
    }

    static BuildMethodNotCalled(context: string) {
        return new MetaError(`Build method not called on ${context}.`);
    }

    static Resource_BucketRequired(context: string) {
        return new MetaError(`Resource ${context} should specify a bucket.`);
    }

}