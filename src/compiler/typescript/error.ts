import * as ts from 'typescript';

export class TypescriptParserError extends Error {
    constructor(message: string) {
        super(message);
    }

    static ObjectPropertyIsNotAssignment() {
        return new TypescriptParserError('Object property is not an assignment.');
    }

    static StrangeValueKind(kind: ts.SyntaxKind) {
        throw new TypescriptParserError(`Strange value kind ${ts.SyntaxKind[kind]}`);
    }

    static StrangeTypeKind(kind: ts.SyntaxKind) {
        throw new TypescriptParserError(`Strange type kind ${ts.SyntaxKind[kind]}`);
    }

}