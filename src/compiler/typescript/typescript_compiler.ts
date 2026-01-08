import type { AnySpace} from '~/engine/space';
import type { ElementType } from '~/schema';

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { Log } from '~/engine/util/log';
import { Space } from '~/engine/space';
import { makeReplaceImportTransformer } from './transformers/replace_import.transformer';
import { makeAppInjectTransformer } from './transformers/app_inject.transformer';
import { colored } from '~/engine/util/string';
import { Parser } from './parser';

export type tsImport = ts.ImportDeclaration
export type tsQueryResult<T = ts.Node> = {
    path: string,
    node: T
}
export type tsFnQueryResult = tsQueryResult<ts.FunctionExpression | ts.ArrowFunction>

export type tsBuilderFunction = {
    type: string,
    node: string
    owner?: string
    path?: string
    fn: ts.ArrowFunction | ts.FunctionExpression
}

export type tsTypeScanResult = {
    path: string,
    type: string
}[]

export type tsScanCallChain = tsScanTree[]

export type tsScanTree = {
    '>>'?: tsScanCallChain  // The call chain ending on this node
    '#'?: string            // The name of this name
    '%'?: ts.Node           // The actual AST node
} & {
    [x: string|number]: tsScanTree
};

export class TypeScriptCompiler {

    private files: string[]
    public program!: ts.Program
    public checker!: ts.TypeChecker

    constructor(
        public space: AnySpace,
        public nesoiPath: string =  'node_modules/nesoi'
    ) {
        this.files = TypeScriptCompiler.allFiles([
            Space.path(space, 'modules')
        ]);
        this.files.push(Space.path(space, 'nesoi.ts'));
        this.createProgram();
    }

    public createProgram() {

        const tsconfigPath = Space.path(this.space, 'tsconfig.json');
        let tsconfig;
        if (fs.existsSync(tsconfigPath)) {
            const tsconfigText = fs.readFileSync(tsconfigPath).toString();
            tsconfig = JSON.parse(tsconfigText).toString();
        }
        this.program = ts.createProgram({
            rootNames: this.files,
            options: {
                target: ts.ScriptTarget.ES2022,
                module: ts.ModuleKind.CommonJS,
                moduleResolution: ts.ModuleResolutionKind.Node10,
                noEmitOnError: true,
                declaration: false,
                strict: true,
                esModuleInterop: true,
                paths: {
                    ...(tsconfig?.compilerOptions?.paths ?? {}),
                    ...(this.nesoiPath ? { 'nesoi/*': [`${this.nesoiPath}/*`] } : {}),
                    '$': ['nesoi.ts']
                },
                rootDir: Space.path(this.space),
                baseUrl: '.'
            },
        });

        this.checker = this.program.getTypeChecker();
    }

    public check(filepath: string) {
        Log.debug('compiler', 'ts', `Diagnosing file ${colored(filepath, 'blue')}`)
        const source = this.getSource(filepath);

        const diagnostics = ts.getPreEmitDiagnostics(this.program, source);
        TypeScriptCompiler.logDiagnostics(diagnostics);
        if (diagnostics.length) {
            throw new Error('TypeScript errors found.');
        }
    }

    /**
     * Extract all import nodes
     */
    public extractImports(filepath: string) {
        Log.trace('compiler', 'ts', `Extracting imports for file ${colored(filepath, 'blue')}`)
        const source = this.getSource(filepath);

        const imports = this.findAll(source, node => {
            if (!ts.isImportDeclaration(node)) {
                return
            }
            const spec = Parser.parseNode(node.moduleSpecifier).value as string;
            
            // Absolute import, use as it is
            let from;
            if (spec.startsWith(path.sep)) {
                from = spec;
            }
            // Relative import
            else if (spec.startsWith('.'+path.sep) || spec.startsWith('..'+path.sep)) {
                from = path.resolve(filepath, '..', spec);
            }
            // Typing import (future)
            else if (spec.startsWith('.nesoi'+path.sep)) {
                from = Space.path(this.space, spec);
            }
            // Non-relative import
            else {
                from = Space.path(this.space, spec);
                // Check if it exists rooted on the space path (usually libs)
                // If not, use the original (it comes from a path alias or node_modules)
                if (!fs.existsSync(from+'.ts')) from = spec;
            }

            const declarations: tsImport[] = [];

            // import Something from '...'
            if (node.importClause?.name) {
                declarations.push(ts.factory.createImportDeclaration(
                    node.modifiers,
                    ts.factory.createImportClause(node.importClause.isTypeOnly, node.importClause.name, undefined),
                    ts.factory.createStringLiteral(from, true)
                ))
            }
            // import { Something } from '...'
            if (node.importClause?.namedBindings) {

                // import * as Something from '...'
                if ((node.importClause?.namedBindings as ts.NamespaceImport).name) {
                    declarations.push(ts.factory.createImportDeclaration(
                        node.modifiers,
                        ts.factory.createImportClause(node.importClause.isTypeOnly, undefined, node.importClause?.namedBindings),
                        ts.factory.createStringLiteral(from, true)
                    ))
                }
                else {
                    for (const el of (node.importClause.namedBindings as ts.NamedImports).elements) {
                        declarations.push(ts.factory.createImportDeclaration(
                            node.modifiers,
                            ts.factory.createImportClause(node.importClause.isTypeOnly, undefined,
                                ts.factory.createNamedImports([el])
                            ),
                            ts.factory.createStringLiteral(from, true)
                        ))
                    }
                }
            }

            return declarations;
        });
        
        const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
        const importStrs = imports.map(node =>
            printer.printNode(ts.EmitHint.Unspecified, node, source)
        )

        return importStrs;
    }

    /**
     * Scan all nesoi relevant typescript nodes from a file
     */
    public scan(filepath: string) {
        Log.trace('compiler', 'ts', `Scanning file ${colored(filepath, 'blue')}`)
        const source = this.getSource(filepath);
        const builders = this.findAllNesoiBuilders(source);

        const result: tsScanTree = {}

        // Scans all relevant nodes and build a tree with them
        const scanNode = (
            node: ts.Node, result: tsScanTree, isChain?: boolean
        ) => {

            /* Chains */

            // Call expression
            if (ts.isCallExpression(node)) {
                // A call expression is always added to the result as a chain
                // So we create a chain node
                const chain_node: tsScanTree = {};

                // ts node
                chain_node['%'] = node;
                
                // expression name
                let fn_name;
                const child = node.expression;
                if (ts.isPropertyAccessExpression(child)) fn_name = child.name.text;
                else if (ts.isIdentifier(child)) fn_name = child.text;
                else fn_name = '?';
                chain_node['#'] = fn_name;
                
                // argument nodes
                node.arguments.map((arg, i) => {
                    chain_node[i] = {};
                    scanNode(arg, chain_node[i] as tsScanTree);
                })

                // Root chain exposes it's node to the result, since it
                // represents the whole expression
                if (!isChain) result['%'] = node;

                // if not on a call chain, start a new one
                result['>>'] ??= [];
                result['>>'].push(chain_node);

                // if it's a call to a property, avoid adding the property
                // to the chain, since the call itself was already added
                if (ts.isPropertyAccessExpression(child)) {
                    scanNode(child.expression, result, true);
                }
                else {
                    scanNode(child, result, true);
                }
            }
            // PropertyAccessExpression
            else if (ts.isPropertyAccessExpression(node)) {
                
                // A property access expression is always added to the result as a chain
                // So we create a chain node
                const chain_node: tsScanTree = {}
                chain_node['%'] = node;   
                chain_node['#'] = node.name.text;

                // Root chain exposes it's node to the result, since it
                // represents the whole expression
                if (!isChain) result['%'] = node;

                // if not on a call chain, start a new one
                result['>>'] ??= [];
                result['>>'].push(chain_node);

                // pass the result with the chain
                scanNode(node.expression, result, true);
            }
            // Identifier
            else if (ts.isIdentifier(node)) {   
                // A property access expression is always added to the result as a chain
                // So we create a chain node
                const chain_node: tsScanTree = {}
                chain_node['%'] = node;   
                chain_node['#'] = node.text;

                // Root chain exposes it's node to the result, since it
                // represents the whole expression
                if (!isChain) result['%'] = node;

                // if not on a call chain, start a new one
                result['>>'] ??= [];
                result['>>'].push(chain_node);
            }

            /* Not Chains */
            
            // Function
            else if (ts.isStringLiteral(node)) {
                result['#'] = node.text;
            }
            else if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
                // ts node
                result['%'] = node as any as ts.Node;

                // return
                const ts_return_node = this.getReturnNode(node);
                if (ts_return_node) {
                    const return_node: tsScanTree = {};
                    result['=>'] = return_node;
                    scanNode(ts_return_node, return_node)
                }
            }
            // Object
            else if (ts.isObjectLiteralExpression(node)) {
                // properties
                node.properties.map(prop => {
                    if (!ts.isPropertyAssignment(prop)) return;
                    let name = '';
                    if (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) {
                        name += prop.name.text;
                    }

                    const prop_node: tsScanTree = {};
                    result[name] = prop_node;
                    scanNode(prop.initializer, prop_node)
                })
            }          
                        
            /* All other nodes */

            else {
                node.forEachChild(child => scanNode(child, result));
            }
        }

        const parseChains = (tree: tsScanTree) => {
            for (const key in tree) {
                if (key === '>>') {
                    (tree['>>'] as tsScanCallChain).reverse();
                }
                if (typeof tree[key] === 'object' && key !== '%') {
                    parseChains(tree[key] as tsScanTree);
                }
            }
        }

        //

        
        for (const type in builders) {
            for (const name in builders[type as never] as Record<string, ts.Node>) {
                const node = builders[type as never][name] as ts.Node;
                const root = this.seekChainUntilRoot(node as any).at(-1)!.parent;

                const next = {} as tsScanTree;
                result[type] ??= next;
                next[name] ??= {}
                scanNode(root, next[name] as tsScanTree);
                parseChains(next[name] as tsScanTree);
            }
        }

        const debug = false;
        
        if (debug) {
            console.log(source.getText(source))
            console.log(JSON.stringify(result, (key, node) => (typeof node === 'object' && 'kind' in node as any) ? ts.SyntaxKind[(node as any).kind] : node, 2))
        }
        
        return result;
    }

    /**
     * 
     * Query syntax:
     * 
     * call_expr.#     = any argument
     * call_expr.9     = argument by position number
     * call_expr.~     = any call in the chain
     *  
     * prop_expr.~     = any call in the chain
     * 
     * function.return = return node of function
     * 
     * object.*        = any key
     * object.**       = any key, recursively
     * object.<string> = A specific key 
     * 
     */
    public query(filepath: string, $: {
        query: string,
        expectedKinds: ts.SyntaxKind[]
    }) {
        Log.trace('compiler', 'ts', `Querying '${$.query}' for file ${colored(filepath, 'blue')}`)
        const source = this.getSource(filepath);
        const builders = this.findAllNesoiBuilders(source);
        
        const path = $.query.split('.');
        if (path.length < 2) {
            throw new Error('Query must start with builder_type.(*|builder_name)');
        }

        const buildersOfType = builders[path[0] as ElementType];
        if (!buildersOfType) {
            throw new Error(`Invalid builder type ${path[0]}`);
        }

        const nodes = Object.entries(buildersOfType).filter(([name, node]) =>
            path[1] === '*' || path[1] === name
        ).map(([name, node]) => {
            const [mod, el] = name.split('::');
            return {
                path: `${mod}::${path[0]}:${el}`,
                node
            }
        })

        const results = this.runQuery(nodes, {
            ...$,
            query: path.slice(2).join('.')
        });

        Log.trace('compiler', 'ts', 'Query results:', results.map(res => ({
            path: res.path,
            kind: ts.SyntaxKind[res.node.kind]
        })))

        return results;
    }

    private runQuery(nodes: tsQueryResult[], $: {
        query: string,
        expectedKinds: ts.SyntaxKind[]
    }) {
        let results = [...nodes];

        const path = $.query.split('.');        
        const loop = {
            query: undefined as string | undefined
        }

        path.forEach(p => {
            // Loop behavior
            let loopStart = false;
            let loopEnd = false;            
            if (p.startsWith('{')) {
                p = p.slice(1);
                loop.query = p;
                loopStart = true;
            }
            if (p.endsWith('}')) {
                if (loop.query === undefined) {
                    throw new Error('In order to close a loop query, you must open one first');
                }
                p = p.slice(0,-1);
                loopEnd = true;
            }
            if (!loopStart && loop.query !== undefined) {
                loop.query += '.' + p;
            }

            // Optional
            let optional = false;
            if (p.endsWith('?')) {
                optional = true;
                p = p.slice(0,-1);
            }

            // Filter step
            const new_results = results.map(result => {
                const ptr = result.node;

                // Function Call
                if (ts.isCallExpression(ptr)) {
                    
                    // '#': any argument
                    if (p === '#') {
                        return ptr.arguments.map((arg, i) => ({
                            path: result.path + '▹' + i.toString(),
                            node: arg
                        }))
                    }

                    // Integer: argument by position
                    const argIdx = parseInt(p);
                    if (!isNaN(argIdx)) {
                        if (argIdx >= ptr.arguments.length) {
                            return []
                        }
                        return {
                            path: result.path + '▹' + argIdx.toString(),
                            node: ptr.arguments[argIdx]
                        };
                    }
                    const ps = p.includes('|') ? p.split('|') : [p];

                    // '~': Any call in the chain 
                    // string: chain property by name
                    return this.findInCallChain(ptr, $ => {
                        return ps.includes('~') || ps.includes($.path.at(-1) || '~');
                    }).map($ => {
                        const firstArg = $.firstArg === '' ? '@' : $.firstArg;
                        return {
                            path: result.path + '▹' + $.path.at(-1) + (firstArg ? ('▹' + firstArg) : ''),
                            node: $.isCall ? $.node.parent : $.node,
                        }
                    })
                }

                // Property Access
                else if (ts.isPropertyAccessExpression(ptr)) {
                    const ps = p.includes('|') ? p.split('|') : [p];

                    // '~': Any call in the chain 
                    // string: chain property by name
                    return this.findInCallChain(ptr, $ => {
                        return ps.includes('~') || ps.includes($.path.at(-1) || '~');
                    }).map($ => {
                        const firstArg = $.firstArg === '' ? '@' : $.firstArg;
                        return {
                            path: result.path + '▹' + $.path.at(-1) + (firstArg ? ('▹' + firstArg) : ''),
                            node: $.isCall ? $.node.parent : $.node,
                        }
                    })
                }

                // Function
                else if (ts.isFunctionExpression(ptr) || ts.isArrowFunction(ptr)) {
                    
                    // 'return': Return node of function
                    if (p === 'return') {
                        const node = this.getReturnNode(ptr);
                        if (!node) {
                            return []
                        }
                        return {
                            path: result.path + '▹return',
                            node
                        };
                    }
                    return []
                }

                // Object
                else if (ts.isObjectLiteralExpression(ptr)) {
                    
                    // '*': Any key
                    // '**': Any key, recursively
                    // string: A specific key
                    const parseObj = (node: ts.ObjectLiteralExpression, path: string, nested=false): tsQueryResult[] => {
                        return node.properties.map(prop => {
                            if (ts.isSpreadAssignment(prop)) {
                                return []
                            }
                            if (!ts.isPropertyAssignment(prop)) {
                                throw new Error('A nesoi builder object property must be an assignment');
                            }
                            let name;
                            if (ts.isIdentifier(prop.name)) {
                                name = prop.name.escapedText;
                            }
                            else if (ts.isStringLiteral(prop.name)) {
                                name = prop.name.text;
                            }
                            else {
                                throw new Error('A nesoi builder object property assignment name must be an identifier or string literal');
                            }
                            if (p === '**') {
                                if (ts.isObjectLiteralExpression(prop.initializer)) {
                                    const nestedPath = path + '▹' + name;
                                    return parseObj(prop.initializer, nestedPath, true);
                                }
                            }
                            if (p === '*' || p === '**' || name === p) {
                                return {
                                    path: path + (nested?'.':'▹') + name,
                                    node: prop.initializer
                                };
                            }
                        })
                            .flat(1)
                            .filter(p => !!p) as tsQueryResult[];
                    }
                    return parseObj(ptr, result.path);
                }
                return []
            }).flat(1);
            
            if (optional) {
                results = [...results, ...new_results];
            }
            else {
                results = new_results;
            }

            // Loop behavior
            if (loopEnd) {
                let loopResults = results;
                while (loopResults.length) {
                    loopResults = this.runQuery(loopResults, { query: loop.query!, expectedKinds: [] });
                    results.push(...loopResults)
                }
                loop.query = undefined;
            }
        })

        if ($.expectedKinds.length) {
            results.forEach(ptr => {
                if (!$.expectedKinds.includes(ptr.node.kind)) {
                    throw new Error(`Unexpected kind ${ts.SyntaxKind[ptr.node.kind]} on query result`)
                }
            })
        }

        return results;
    }

    public getReturnNode(node: ts.FunctionExpression | ts.ArrowFunction) {
        if (!ts.isFunctionExpression(node) && !ts.isArrowFunction(node)) {
            return
        }
        if (ts.isBlock(node.body)) {
            // Warning: this only returns the first "return"
            // to appear on the AST
            const ret = node.body.statements.find(st => ts.isReturnStatement(st)) as ts.ReturnStatement | undefined
            return ret?.expression;
        }
        if (ts.isParenthesizedExpression(node.body)) {
            return node.body.expression;
        }
        if (ts.isPropertyAccessExpression(node.body)) {
            return node.body.expression;
        }
        return node.body;        
    }

    public getReturnType(node: ts.Node) {
        const type = this.checker.getTypeAtLocation(node)
        const signatures = this.checker.getSignaturesOfType(type, ts.SignatureKind.Call)
        let fnReturnType = this.checker.getReturnTypeOfSignature(signatures[0]);
        
        if (fnReturnType.symbol?.escapedName === 'Promise') {
            fnReturnType = this.checker.getTypeArguments(fnReturnType as ts.TypeReference)[0];
        }

        return this.checker.typeToString(
            fnReturnType,
            undefined,
            ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.NoTypeReduction | ts.TypeFormatFlags.UseFullyQualifiedType // TODO: this causes freaky imports
        )
    }

    public getCode(node: ts.Node, type?: string) {
        // This method is only used to generated intermediate schemas
        // (the ones on the .nesoi folder). The function should have been
        // evaluated before generating this schema, so the typing is useless here
        return `(${node.getFullText()})${type?.length ? (' as ' + type) : ''}`
    }

    public isCall(node: ts.Node, from: ts.Symbol, method?: string) {
        if (
            ts.isCallExpression(node)
            && ts.isPropertyAccessExpression(node.expression)
            && ts.isIdentifier(node.expression.name)
            && (!method || node.expression.name.escapedText === method)
        ) {
            const $ = node.expression.expression;
            const symbol = this.checker.getTypeAtLocation($).getSymbol(); 
            return symbol == from
        }
        return false;
    }

    private getSource(filename: string) {
        const source = this.program.getSourceFile(filename);
        const files = this.program.getSourceFiles();
        if (!source) {
            throw new Error(`Unable to find SourceFile for file '${filename}'`);
        }
        return source;
    }

    public getNesoiSpaceSymbol() {
        try {
            return this.getNesoiSymbol('Space', 'lib/engine/space.d.ts');
        }
        catch {
            // When running the compiler with non-compiled nesoi
            return this.getNesoiSymbol('Space', 'src/engine/space.ts');
        }
    }

    // This should not be used directly, only through the method above
    private getNesoiSymbol(name: string, path: string) {
        const factorySource = this.getSource(`${this.nesoiPath}/${path}`)
        const factorySourceSymbol = this.checker.getSymbolAtLocation(factorySource)
        if (!factorySourceSymbol) {
            throw new Error(`Unable to find Nesoi symbol named '${name}' at '${path}'`);
        }
        const factorySourceExports = this.checker.getExportsOfModule(factorySourceSymbol);
        for (const expt of factorySourceExports) {
            if (expt.escapedName === name) {
                return expt;
            }
        }
        throw new Error(`Unable to find Nesoi symbol named '${name}' at '${path}'`);
    }

    public getPropPath(node: ts.PropertyAssignment) {
        const path: string[] = [
            Parser.parseNode(node.name).value
        ];
        let ptr = node;
        while (ptr.parent?.parent) {
            ptr = ptr.parent?.parent as any;
            if (!ts.isPropertyAssignment(ptr)) {
                break;
            }
            path.unshift(
                Parser.parseNode(ptr.name).value
            )
        }
        return path.join('.');
    }

    public findAllNesoiBuilders(node: ts.Node) {
        const Nesoi = this.getNesoiSpaceSymbol();
        const allBuilders = this.findAll(node, node => this.isCall(node, Nesoi) ? [node] : undefined);
        const builders: Partial<Record<ElementType, Record<string, ts.Node>>> = {}
        allBuilders.forEach(b => {
            if (!ts.isCallExpression(b)) {
                throw new Error('A Space property is not being called as a function')
            }
            if (!ts.isPropertyAccessExpression(b.expression)) {
                throw new Error('A Space property is not being properly called')
            }
            const builderType = Parser.parseNode(b.expression.name).value as ElementType;
            if (!builderType) {
                throw new Error('Unable to identify builder type')
            }
            if (![
                'externals',
                'constants',
                'bucket',
                'message',
                'job',
                'resource',
                'machine',
                'controller',
                'queue',
                'topic',
            ].includes(builderType)) {
                throw new Error(`Unknown builder type ${builderType}`)
            }

            builders[builderType] ??= {}

            if (b.arguments.length != 1) {
                throw new Error('A builder initial call requires a single string argument')
            }
            if (!ts.isStringLiteral(b.arguments[0])) {
                throw new Error('A builder name must be a string (to be known at compile time)')
            }

            const name = Parser.parseNode(b.arguments[0]).value as string;

            builders[builderType]![name] = b;
        });
        return builders
    }

    public findAll(node: ts.Node, predicate: (node: ts.Node) => ts.Node[] | undefined) {
        const found: ts.Node[] = [];

        const visit: ts.Visitor = (node) => {
            const result = predicate(node);
            if (result) {
                found.push(...result);
            }
            return node.forEachChild((child) => visit(child));
        }
        node.forEachChild((child) => visit(child));

        return found;
    }

    private findInCallChain(node: ts.CallExpression | ts.PropertyAccessExpression, predicate: ($: { node: ts.PropertyAccessExpression, path: string[], isCall: boolean, firstArg?: string }) => boolean) {
        const results: { node: ts.PropertyAccessExpression, path: string[], isCall: boolean, firstArg?: string }[] = []
        const from = this.seekChainUntilLeaf(node);
        const to = this.seekChainUntilRoot(node);
        
        from.reverse();
        const calls = [
            ...from,
            ...(ts.isPropertyAccessExpression(node) ? [node] : []),
            ...to
        ]

        const path: string[] = [];
        for (const node of calls) {
            path.push(node.name.text);

            const isCall = ts.isCallExpression(node.parent) && node.parent.expression === node;

            // [Nesoi Syntax]
            // If the first argument of a call expression is a string,
            // we assume it's relevant to the path
            // So we add it after the call expresion name
            let firstArg: string|undefined = undefined;
            if (isCall
                && (node.parent as ts.CallExpression).arguments.length
                && ts.isStringLiteral((node.parent as ts.CallExpression).arguments[0])
            ) {
                firstArg = ((node.parent as ts.CallExpression).arguments[0] as ts.StringLiteral).text
            }

            if (predicate({ node, path, isCall, firstArg })) {
                results.push({ node, path: [...path], isCall, firstArg });
            }
        }
        return results;
    }

    private seekChainUntilLeaf(from: ts.CallExpression | ts.PropertyAccessExpression) {
        const chain: ts.PropertyAccessExpression[] = [];
        let child = from.expression;
        while (child) {
            if (!ts.isCallExpression(child) && !ts.isPropertyAccessExpression(child)) {
                break;
            }
            if (ts.isCallExpression(child)) {
                child = child.expression;
            }
            else if (ts.isPropertyAccessExpression(child)) {
                chain.push(child);
                child = child.expression;
            }
            else {
                break;
            }
        }   
        return chain;
    }

    private seekChainUntilRoot(from: ts.CallExpression | ts.PropertyAccessExpression) {
        const chain: ts.PropertyAccessExpression[] = [];
        let parent = from.parent;
        while (parent) {
            if (!ts.isCallExpression(parent) && !ts.isPropertyAccessExpression(parent)) {
                break;
            }
            if (ts.isCallExpression(parent)) {
                parent = parent.parent;
            }
            else if (ts.isPropertyAccessExpression(parent)) {
                chain.push(parent);
                parent = parent.parent;
            }
            else {
                break;
            }
        }
        return chain;
    }

    private static logDiagnostics(diagnostics: readonly ts.Diagnostic[]) {
        if (!diagnostics.length) {
            return
        }
        Log.error('compiler', 'ts', 'TypeScript errors found:')
        diagnostics.forEach(diagnostic => {
            if (diagnostic.file) {
                const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
                const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                console.log(`${colored(diagnostic.file.fileName, 'blue')}:${colored(line + 1 + '', 'purple')},${colored(character + 1 + '', 'purple')}: ${colored(message, 'red')}`);
            } else {
                console.log(colored(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'), 'red'));
            }
        });
    }

    public static allFiles (dirPaths: string[]) {
        const arrayOfFiles: string[] = [];
        for (const dirPath of dirPaths) {
            const files = fs.readdirSync(dirPath);
          
            files.forEach(function(file) {
                const filepath = path.join(dirPath, file);
                if (fs.lstatSync(filepath).isDirectory()) {
                    arrayOfFiles.push(
                        ...TypeScriptCompiler.allFiles([filepath])
                    )
                } else if (file.endsWith('.ts')) {
                    arrayOfFiles.push(path.join(dirPath, file));
                }
            });
        }
      
        return arrayOfFiles;
    }

    /**
     * 
     */
    public static compileFile(fileName: string, options: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.Node10
    }) {
        Log.debug('compiler', 'ts', `Building file ${fileName}`)
        const program = ts.createProgram([fileName], options);

        const source = program.getSourceFile(fileName)!;

        const diagnostics = ts.getPreEmitDiagnostics(program, source);
        this.logDiagnostics(diagnostics);
        if (diagnostics.length) {
            throw new Error('TypeScript errors found.');
        }

        const result = ts.transpileModule(source.getFullText(), { compilerOptions: options});
        return result.outputText;
    }

    /**
     * !The first file is currently expected to be the app file
     */
    public static compileApp(modules: string[], fileNames: string[], options: ts.CompilerOptions, spacePath: string, buildPath: string, paths: Record<string, string | { __remove: boolean }> = {}) {
        // const host = ts.createCompilerHost(options);
        const program = ts.createProgram(fileNames, options);
        
        let exitCode = 0;
        for (const fileName of fileNames) {
            Log.debug('compiler', 'ts', `Building file ${fileName}`)
            const source = program.getSourceFile(fileName);
            const emitResult = program.emit(source, (_: string, text: string) => {
                let path = _;
                const resolvedPath = paths[fileName];
                if (resolvedPath && typeof resolvedPath === 'string') {
                    path = resolvedPath;
                    if (_.endsWith('.d.ts')) {
                        path = path.replace(/\.[j|t]s$/, '.d.ts');
                    }
                    else {
                        path = path.replace(/\.[j|t]s$/, '.js');
                    }
                }
                ts.sys.writeFile(path, text)
            }, undefined, undefined, {
                before: [
                    makeReplaceImportTransformer(spacePath, buildPath, paths),
                    ...(fileName === fileNames[0] ? [makeAppInjectTransformer(modules)] : [])
                ],
                afterDeclarations: [makeReplaceImportTransformer(spacePath, buildPath, paths) as ts.TransformerFactory<ts.SourceFile | ts.Bundle>]
            });

            emitResult.diagnostics.forEach(diagnostic => {
                if (diagnostic.file) {
                    const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
                    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                    Log.error('compiler', 'ts', `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
                } else {
                    Log.error('compiler', 'ts', ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
                }
            });

            const stepExitCode = emitResult.emitSkipped ? 1 : 0;
            Log.trace('compiler', 'ts', `Compiler resulted code '${exitCode}'.`);

            if (stepExitCode) exitCode = stepExitCode;
        }

        return exitCode;
    }
}