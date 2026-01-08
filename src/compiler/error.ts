
export class CompilerError extends Error {
    constructor(message: string) {
        super(message);
    }

    static DirectoryDoesntExists(dir: string) {
        return new CompilerError(`Directory doesn't exists: ${dir}.`);
    }
    
    static ExternalEnumNotFound(name: string) {
        return new CompilerError(`External enum '${name}' not found`);
    }
    
    static ExternalValueNotFound(name: string) {
        return new CompilerError(`External value '${name}' not found`);
    }

    static TypeBuildFailed(error: string) {
        return new CompilerError(`Failed to build types: ${error}`);
    }
    static ElementBuildFailed(tag: string) {
        return new CompilerError(`Failed to build element '${tag}'`);
    }
}


export class HelperError extends Error {
    constructor(message: string) {
        super(message);
    }

    static ArrayElementIsNotString(kind: string) {
        throw new CompilerError(`Array element is not a string (${kind})`);
    }
    
    static NotAStringOrArray(kind: string) {
        throw new CompilerError(`Not a string or array (${kind})`);
    }
    
    static StringIsUndefined() {
        throw new CompilerError('String is undefined');
    }
    
    static NotAString(kind: string) {
        throw new CompilerError(`Not a string (${kind})`);
    }
}

export class TypegenError extends Error {
    constructor(message: string) {
        super(message);
    }

    static BuildMethodNotCalled(context: string) {
        return new CompilerError(`Build method not called on ${context}.`);
    }

    static Resource_BucketRequired(context: string) {
        return new CompilerError(`Resource ${context} should specify a bucket.`);
    }

}