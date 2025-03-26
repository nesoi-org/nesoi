import * as ts from 'typescript';
import { ParserError } from './error';

/**
 * TODO: DEPRECATE THIS
 */


const DEBUG_LOG = false;

export type ParsedType = string | ({ [x: string] : ParsedType } & { __array?: boolean, __optional?: boolean })

export class ParsedNode {
    
    expressionOperator?: ParsedNode;
    arrayElement?: ParsedNode;
    arguments?: ParsedNode[];
    members?: ParsedNodes;
    return?: ParsedNode;
    chain?: ParsedNode[];

    constructor(
        node: ts.Node,
        public superkind: 'value' | 'type',
        public kind: 'primitive' | 'string' | 'obj' | 'array' | 'fn' | 'identifier' | 'call' | 'chain' | 'expression' | 'token',
        public value: any,
        public type: string = 'unknown'
    ) {}

    withExpressionOperator(operator: ParsedNode) {
        this.expressionOperator = operator;
        return this;
    }

    withArrayElement(element: ParsedNode) {
        this.arrayElement = element;
        return this;
    }

    withArguments(args: ParsedNode[]) {
        this.arguments = args;
        return this;
    }
    
    withMembers(members: ParsedNodes) {
        this.members = members;
        return this;
    }
    
    withReturn(node: ParsedNode) {
        this.return = node;
        return this;
    }
    
    withChain(chain: ParsedNode[]) {
        this.chain = chain;
        return this;
    }

    toString(d = 0): string | undefined {
        const pad0 = '  '.repeat(d);
        const pad1 = '  '.repeat(d+1);
        if (this.kind === 'primitive') return this.value as string;
        if (this.kind === 'string') return `'${this.value}'` as string;
        if (this.kind === 'obj') {
            return '{\n'+
                Object.entries(this.members!).map(([key, val]) => 
                    `${pad1}${key}: ${val.toString(d+1)}`
                ).join(',\n')
            + `\n${pad0}}`;
        }
        if (this.kind === 'array') {
            return '[\n'+
                Object.values(this.members!).map((val) => 
                    `${pad1}${val.toString(d+1)}`
                ).join(',\n')
            + `\n${pad0}]`;
        }
        if (this.kind === 'fn') {
            return `${this.value}(`+
                Object.values(this.arguments!).map((val) => 
                    `${val.toString(d)}`
                ).join(', ')
            + ') => {\n' +
                `${pad1}${this.return!.toString(d+1)}`
            + `\n${pad0}}`;
        }
        if (this.kind === 'identifier') {
            return this.value as string;
        }
        if (this.kind === 'call') {
            if (!this.chain) {
                if (this.arguments) {
                    return `${this.value}(`+
                        Object.values(this.arguments).map((val) => 
                            `${val.toString(d)}`
                        ).join(',')
                    + ')';
                }
                return `${this.value}()`;
            }
        }
        if (this.kind === 'chain') {
            return '[\n'+
            this.chain!.map(call => pad1 + call.toString(d+1))
                .join(',\n')
            + `\n${pad0}]`;
        }
        if (this.kind === 'expression') {
            if (this.arguments!.length === 1) {
                return this.expressionOperator!.value + this.arguments![0].toString();
            }
            else if (this.arguments!.length === 2) {
                return this.arguments![0].toString() + this.expressionOperator!.value + this.arguments![1].toString();
            }
        }
    }
}

export type ParsedNodes = {
    [x: string]: ParsedNode
}

export class Parser {

    /* Value */

    public static parseNode<T extends ts.Node | undefined>(node?: T, parseChain = true):
        undefined extends T ? undefined : ParsedNode 
    {
        const text = node?.getText();
        if (!node) {
            return undefined as any;
        }
        // Simple values
        if (node.kind === ts.SyntaxKind.NullKeyword) {
            if (DEBUG_LOG) console.log('Parsing value node as null', { text });
            return new ParsedNode(node, 'value', 'primitive', 'null', 'null') as any;
        }
        if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
            if (DEBUG_LOG) console.log('Parsing value node as undefined', { text });
            return new ParsedNode(node, 'value', 'primitive', 'undefined', 'undefined') as any;
        }
        if (node.kind === ts.SyntaxKind.TrueKeyword) {
            if (DEBUG_LOG) console.log('Parsing value node as true', { text });
            return new ParsedNode(node, 'value', 'primitive', 'true', 'boolean') as any;
        }
        if (node.kind === ts.SyntaxKind.FalseKeyword) {
            if (DEBUG_LOG) console.log('Parsing value node as false', { text });
            return new ParsedNode(node, 'value', 'primitive', 'false', 'boolean') as any;
        }
        if (ts.isNumericLiteral(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as number', { text });
            return new ParsedNode(node, 'value', 'primitive', node.text, 'number') as any;
        }
        if (ts.isStringLiteral(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as string', { text });
            return new ParsedNode(node, 'value', 'string', node.text, 'string') as any;
        }
        if (ts.isObjectLiteralExpression(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as object', { text });
            return new ParsedNode(node, 'value', 'obj', undefined)
                .withMembers(this.parseObjectMembers(node)) as any;
        }
        if (ts.isArrayLiteralExpression(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as array', { text });
            return new ParsedNode(node, 'value', 'array', undefined)
                .withMembers(this.parseArrayElements(node)) as any;
        }
        // Functions, Builders, Identifiers
        if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as function', { text });
            const name = this.parseFunctionName(node);
            return new ParsedNode(node, 'value', 'fn', name)
                .withArguments(this.parseFunctionParameters(node))
                .withReturn(this.parseNode(node.body)) as any;
        }
        if (ts.isIdentifier(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as identifier', { text });
            const name = node.escapedText.toString();
            return new ParsedNode(node,'value', 'identifier', name) as any;
        }
        if (ts.isParameter(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as parameter', { text });
            const name = this.parseNode(node.name);
            return new ParsedNode(node,'value', 'identifier', name) as any;
        }
        if (ts.isPropertyAccessExpression(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as property access expression', { text, parseChain });
            return this.parseGetterCall(node, parseChain) as any;
        }
        if (ts.isCallExpression(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as function call', { text, parseChain });
            return this.parseFunctionCall(node, parseChain) as any;
        }
        if (ts.isBlock(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as block output', { text });
            return this.parseBlockReturn(node) as any;
        }
        // Expressions
        if (ts.isParenthesizedExpression(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as parenthesized expression', { text });
            return this.parseNode(node.expression) as any;
        }
        if (ts.isAsExpression(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as block output', { text });
            return this.parseNode(node.expression) as any;
        }
        if (ts.isPrefixUnaryExpression(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as prefix unary expression', { text });
            return this.parsePrefixUnaryExpression(node) as any;
        }
        if (ts.isBinaryExpression(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as binary expression', { text });
            return this.parseBinaryExpression(node) as any;
        }
        if (ts.isConditionalExpression(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as binary expression', { text });
            return this.parseConditionalExpression(node) as any;
        }
        if (ts.isAwaitExpression(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as binary expression', { text });
            return this.parseAwaitExpression(node) as any;
        }
        // Tokens
        if (ts.isPlusToken(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as plus token', { text });
            return new ParsedNode(node, 'value', 'token', '+') as any;
        }
        if (ts.isMinusToken(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as minus token', { text });
            return new ParsedNode(node, 'value', 'token', '-') as any;
        }
        if (ts.isAsteriskToken(node)) {
            if (DEBUG_LOG) console.log('Parsing value node as asterisk token', { text });
            return new ParsedNode(node, 'value', 'token', '*') as any;
        }
        if (node.kind === ts.SyntaxKind.SlashToken) {
            if (DEBUG_LOG) console.log('Parsing value node as slash token', { text });
            return new ParsedNode(node, 'value', 'token', '/') as any;
        }
        if (node.kind === ts.SyntaxKind.EqualsEqualsToken) {
            if (DEBUG_LOG) console.log('Parsing value node as equals2 token', { text });
            return new ParsedNode(node, 'value', 'token', '==') as any;
        }
        if (node.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) {
            if (DEBUG_LOG) console.log('Parsing value node as equals3 token', { text });
            return new ParsedNode(node, 'value', 'token', '===') as any;
        }
        if (node.kind === ts.SyntaxKind.ExclamationEqualsToken) {
            if (DEBUG_LOG) console.log('Parsing value node as not_equals2 token', { text });
            return new ParsedNode(node, 'value', 'token', '!=') as any;
        }
        if (node.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) {
            if (DEBUG_LOG) console.log('Parsing value node as not_equals3 token', { text });
            return new ParsedNode(node, 'value', 'token', '!==') as any;
        }
        if (node.kind === ts.SyntaxKind.BarBarToken) {
            if (DEBUG_LOG) console.log('Parsing value node as bar bar token', { text });
            return new ParsedNode(node, 'value', 'token', '||') as any;
        }
        if (node.kind === ts.SyntaxKind.QuestionQuestionToken) {
            if (DEBUG_LOG) console.log('Parsing value node as question question token', { text });
            return new ParsedNode(node, 'value', 'token', '??') as any;
        }
        
        console.error(node.getText());
        throw ParserError.StrangeValueKind(node.kind);
    }

    private static parseObjectMembers(node: ts.ObjectLiteralExpression) {
        if (DEBUG_LOG) console.log('Parsing value node object members');
        const properties = {} as ParsedNodes;
        for (const p in node.properties) {
            const prop = node.properties[p];
            if (typeof prop !== 'object') { continue; }
            if (!ts.isPropertyAssignment(prop)) {
                throw ParserError.ObjectPropertyIsNotAssignment();
            }
            const name = Parser.parseNode(prop.name).value;
            properties[name] = Parser.parseNode(prop.initializer);
        }
        return properties;
    }

    private static parseArrayElements(node: ts.ArrayLiteralExpression) {
        if (DEBUG_LOG) console.log('Parsing value node array elements');
        const elements = {} as ParsedNodes;
        let i = 0;
        for (const p in node.elements) {
            const prop = node.elements[p];
            if (typeof prop !== 'object') { continue; }
            elements[i] = Parser.parseNode(prop);
            i++;
        }
        return elements;
    }

    private static parseFunctionName(node: ts.FunctionExpression | ts.ArrowFunction) {
        if (DEBUG_LOG) console.log('Parsing value node function name');
        if (ts.isArrowFunction(node)) {
            return '$';
        }
        return node.name?.escapedText;
    }

    private static parseFunctionParameters(node: ts.FunctionExpression | ts.ArrowFunction) {
        if (DEBUG_LOG) console.log('Parsing value node function parameters');
        const parameters = [] as ParsedNode[];
        for (const p in node.parameters) {
            const prop = node.parameters[p];
            if (typeof prop !== 'object') { continue; }
            parameters.push(Parser.parseNode(prop));
        }
        return parameters;
    }

    private static parseBlockReturn(node: ts.Block) {
        if (DEBUG_LOG) console.log('Parsing value node block return');
        for (const i in node.statements) {
            const statement = node.statements[i];
            if (ts.isReturnStatement(statement)) {
                if (statement.expression) {
                    return this.parseNode(statement.expression);
                }
                else {
                    break;
                }
            }
        }
        return new ParsedNode(node, 'value', 'primitive', 'undefined');
    }

    private static parseFunctionCall(node: ts.CallExpression, parseChain: boolean) {
        let name = '';
        if (ts.isIdentifier(node.expression)) {
            name = node.expression.escapedText.toString();
        }
        else if (ts.isPropertyAccessExpression(node.expression)) {
            name = node.expression.name.escapedText.toString();
        }
        const parsed = new ParsedNode(node,'value', parseChain ? 'chain' : 'call', name);
        if (parseChain) {
            parsed.withChain(this.parseCallChain(node));
        }
        else {
            parsed.withArguments(this.parseCallArguments(node));
        }
        return parsed;
    }

    private static parseGetterCall(node: ts.PropertyAccessExpression, parseChain: boolean) {
        let name = '';
        if (ts.isIdentifier(node.name)) {
            name = node.name.escapedText.toString();
        }
        const parsed = new ParsedNode(node,'value', parseChain ? 'chain' : 'call', name);
        if (parseChain) {
            parsed.withChain(this.parseCallChain(node));
        }
        return parsed;
    }

    private static parseCallArguments(node: ts.CallExpression) {
        if (DEBUG_LOG) console.log('Parsing value node function call arguments');
        const args = [] as ParsedNode[];
        for (const i in node.arguments) {
            const arg = node.arguments[i];
            if (typeof arg !== 'object') { continue; }
            args.push(this.parseNode(arg));
        }
        return args;
    }

    private static parsePrefixUnaryExpression(node: ts.PrefixUnaryExpression) {
        if (DEBUG_LOG) console.log('Parsing value node as prefix unary expression');
        const operator = new ParsedNode(node, 'value', 'token', {
            [ts.SyntaxKind.PlusPlusToken]: '++',
            [ts.SyntaxKind.MinusMinusToken]: '--',
            [ts.SyntaxKind.PlusToken]: '+',
            [ts.SyntaxKind.MinusToken]: '-',
            [ts.SyntaxKind.TildeToken]: '~',
            [ts.SyntaxKind.ExclamationToken]: '!',
        }[node.operator]);
        const operand = this.parseNode(node.operand);
        return new ParsedNode(node, 'value', 'expression', undefined, 'boolean')
            .withExpressionOperator(operator)
            .withArguments([operand]);
    }

    private static parseAwaitExpression(node: ts.AwaitExpression) {
        if (DEBUG_LOG) console.log('Parsing value node as binary expression');
        const operator = new ParsedNode(node, 'value', 'token', 'await');
        const expression = this.parseNode(node.expression);
        return new ParsedNode(node, 'value', 'expression', undefined, `Promise<${expression.type}>`)
            .withExpressionOperator(operator)
            .withArguments([expression]);
    }

    private static parseBinaryExpression(node: ts.BinaryExpression) {
        if (DEBUG_LOG) console.log('Parsing value node as binary expression');
        const left = this.parseNode(node.left);
        const right = this.parseNode(node.right);
        const token = this.parseNode(node.operatorToken);
        return new ParsedNode(node, 'value', 'expression', undefined, left.type)
            .withExpressionOperator(token)
            .withArguments([left, right]);
    }

    private static parseConditionalExpression(node: ts.ConditionalExpression) {
        if (DEBUG_LOG) console.log('Parsing value node as conditional expression');
        const condition = this.parseNode(node.condition);
        const left = this.parseNode(node.whenTrue);
        const right = this.parseNode(node.whenFalse);
        return new ParsedNode(node, 'value', 'expression', undefined, left.type + ' | ' + right.type)
            .withExpressionOperator(condition)
            .withArguments([left, right]);
    }

    private static parseCallChain(node: ts.CallExpression | ts.PropertyAccessExpression) {
        if (DEBUG_LOG) console.log('Parsing value node function call chain', node.getText());
        const upNodes = [] as ts.Node[];
        const downNodes = [] as ts.Node[];

        let downCall = ts.isCallExpression(node)
            ? (ts.isPropertyAccessExpression(node.expression) ? node.expression.expression : undefined) // function
            : (
                (ts.isCallExpression(node.expression) || ts.isPropertyAccessExpression(node.expression))
                    ? node.expression
                    : undefined);           // getter
        while (downCall) {
            if (DEBUG_LOG) console.log('Parsing value down node', downCall.getText());
            // function
            if (ts.isCallExpression(downCall)) {
                if (DEBUG_LOG) console.log('Parsing value down node as function');
                downNodes.push(downCall);
                if (!ts.isPropertyAccessExpression(downCall.expression)) { break; }
                downCall = downCall.expression.expression;
            }
            // getter
            else if (ts.isPropertyAccessExpression(downCall)) {
                if (DEBUG_LOG) console.log('Parsing value down node as getter');
                downNodes.push(downCall);
                downCall = downCall.expression;
            }
            else { break; }
        }

        let upCall = ts.isCallExpression(node)
            ? (ts.isPropertyAccessExpression(node.parent) ? node.parent.parent : undefined)     // function
            : (ts.isPropertyAccessExpression(node.parent) ? node.parent : undefined);    // getter
        while (upCall) {
            if (DEBUG_LOG) console.log('Parsing value up node', upCall.getText());
            // .something()
            if (ts.isCallExpression(upCall)) {
                if (DEBUG_LOG) console.log('Parsing value up node as function');
                upNodes.push(upCall);
                if (!ts.isPropertyAccessExpression(upCall.parent)) {
                    break;
                }
                upCall = upCall.parent.parent;
            }
            // .something
            else if (ts.isPropertyAccessExpression(upCall)) {
                if (DEBUG_LOG) console.log('Parsing value up node as getter');
                upNodes.push(upCall);
                upCall = upCall.parent;
            }
            else { break; }
        }
        
        const chain = [
            ...downNodes.reverse(),
            node,
            ...upNodes,
        ];

        return chain.map((call,i) => this.parseNode(call, false));
    }

    /* Type */

    public static parseType<T extends ts.Node | undefined>(node?: T):
        undefined extends T ? undefined : ParsedNode 
    {
        if (!node) {
            return undefined as any;
        }
        if (node.kind === ts.SyntaxKind.NullKeyword) {
            return new ParsedNode(node, 'type','primitive', 'null') as any;
        }
        if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
            return new ParsedNode(node, 'type','primitive', 'undefined') as any;
        }
        if (node.kind === ts.SyntaxKind.NumberKeyword) {
            return new ParsedNode(node, 'type','primitive', 'number') as any;
        }
        if (node.kind === ts.SyntaxKind.StringKeyword) {
            return new ParsedNode(node, 'type','primitive', 'string') as any;
        }
        if (node.kind === ts.SyntaxKind.BooleanKeyword) {
            return new ParsedNode(node, 'type', 'primitive', 'boolean') as any;
        }
        if (ts.isInterfaceDeclaration(node)) {
            const members = [...node.members];
            return new ParsedNode(node, 'type','obj', undefined)
                .withMembers(this.parseTypeMembers(members)) as any;
        }
        if (ts.isArrayTypeNode(node)) {
            const element = this.parseType(node.elementType);
            return new ParsedNode(node, 'type','array', undefined)
                .withArrayElement(element) as any;
        }
        if (ts.isTypeLiteralNode(node)) {
            const members = [...node.members];
            return new ParsedNode(node, 'type','obj', undefined)
                .withMembers(this.parseTypeMembers(members)) as any;
        }
        if (ts.isTypeReferenceNode(node)) {
            return new ParsedNode(node, 'type','identifier', this.parseNode(node.typeName)?.value) as any;
        }
        console.error(node);
        throw ParserError.StrangeTypeKind(node.kind);
    }

    private static parseTypeMembers(nodes: ts.Node[]) {
        const parsed = {} as ParsedNodes;
        for (const i in nodes) {
            const node = nodes[i];
            if (ts.isPropertySignature(node)) {
                const key = this.parseNode(node.name)!.value as string;
                if (!node.type) {
                    throw new Error('Property signature without type');
                }
                const type = this.parseType(node);
                parsed[key] = type;
                continue;
            }
            throw new Error(`Strange Type Member kind ${ts.SyntaxKind[node.kind]}`);
        }
        return parsed;
    }

}