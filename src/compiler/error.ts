
export class CompilerError extends Error {
    constructor(message: string) {
        super(message);
    }

    static DirectoryDoesntExists(dir: string) {
        return new CompilerError(`Directory doesn't exists: ${dir}.`);
    }

    static FileDoesntExist(path: string) {
        return new CompilerError(`File doesn't exist: ${path}`);
    }
    
    static NoModulesFolder() {
        return new CompilerError('No modules folder found on project root.');
    }
    
    static UnmetModuleDependency(from: string, name: string) {
        return new CompilerError(`Unment module dependency '${name}' while building '${from}'.`);
    }
    
    static UnmetDependency(from: string, name: string) {
        return new CompilerError(`Unment dependency '${name}' while building '${from}'.`);
    }
    
    static CircularDependency() {
        return new CompilerError('Circular dependency found while building.');
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