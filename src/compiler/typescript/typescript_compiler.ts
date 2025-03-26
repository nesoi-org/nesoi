import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { Log } from '~/engine/util/log';
import { AnySpace, Space } from '~/engine/space';
import { makeReplaceImportTransformer } from './transformers/replace_import.transformer';
import { makeAppInjectTransformer } from './transformers/app_inject.transformer';
import { colored } from '~/engine/util/string';
import { Parser } from './parser';
import { BuilderType } from '~/schema';
import { tsImport } from './bridge/organize';

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
        this.program = ts.createProgram({
            rootNames: this.files,
            options: {
                target: ts.ScriptTarget.ES2020,
                module: ts.ModuleKind.CommonJS,
                moduleResolution: ts.ModuleResolutionKind.Node10,
                noEmitOnError: true,
                declaration: false,
                strict: true,
                esModuleInterop: true,
                paths: {
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
    public extractImports(filepath: string, $?: {
        ignore?: string[]
    }) {
        Log.trace('compiler', 'ts', `Extracting imports for file ${colored(filepath, 'blue')}`)
        const source = this.getSource(filepath);

        const imports = this.findAll(source, node => {
            if (!ts.isImportDeclaration(node)) {
                return
            }
            const spec = Parser.parseNode(node.moduleSpecifier).value as string;
            // Not a relative import, use as it is
            if (!spec.startsWith('./') && !spec.startsWith('../')) {
                return node;
            }
            const from = path.resolve(filepath, '..', spec);
            if ($?.ignore?.includes(from)) {
                return
            }
            return ts.factory.createImportDeclaration(
                node.modifiers,
                node.importClause,
                ts.factory.createStringLiteral(from, true)
            )
        }) as tsImport[];
        
        const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
        const importStrs = imports.map(node =>
            printer.printNode(ts.EmitHint.Unspecified, node, source)
        )

        return importStrs;
    }

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

        const buildersOfType = builders[path[0] as BuilderType];
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

            // Filter step
            results = results.map(result => {
                const ptr = result.node;

                // TS API object
                if (ts.isCallExpression(ptr)) {
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
                    return this.findInCallChain(ptr, node => {
                        const name = this.getCallName(node)
                        return p === '*' || name === p;
                    }).map(node => {
                        const suffix = (ts.isCallExpression(node) && ts.isStringLiteral(node.arguments[0]))
                            ? '▹' + node.arguments[0].text
                            : '';
                        return {
                            path: result.path + '▹' + p + suffix,
                            node,
                        }
                    })
                }
                if (ts.isPropertyAccessExpression(ptr)) {
                    return this.findInCallChain(ptr, parent => {
                        const name = this.getCallName(parent)
                        return name === p;
                    }).map(node => ({
                        path: result.path + '▹' + p,
                        node,
                    }))
                }
                if (ts.isFunctionExpression(ptr) || ts.isArrowFunction(ptr)) {
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
                    throw new Error('You can only query functions with .return');
                }
                if (ts.isObjectLiteralExpression(ptr)) {
                    const parseObj = (node: ts.ObjectLiteralExpression, path: string, nested=false): tsQueryResult[] => {
                        return node.properties.map(prop => {
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
        if (ts.isCallExpression(node.body)) {
            return node.body;
        }
        if (ts.isIdentifier(node.body)) {
            return undefined;
        }
        throw new Error(`Unknown kind ${ts.SyntaxKind[node.body.kind]} for function body`);
        
    }

    public getReturnType(node: ts.FunctionExpression | ts.ArrowFunction) {
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

    public getFnText(node: ts.FunctionExpression | ts.ArrowFunction) {
        // This method is only used to generated intermediate schemas
        // (the ones on the .nesoi folder). The function should have been
        // evaluated before generating this schema, so the typing is useless here
        return `(${node.getFullText()}) as (...args: any[]) => any`
    }

    public getFnType(node: ts.FunctionExpression | ts.ArrowFunction) {
        const type = this.checker.getTypeAtLocation(node)
        return this.checker.typeToString(
            type,
            undefined,
            ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.NoTypeReduction
        )
    }

    public getCallName(node: ts.Node) {
        // Function Call
        if (ts.isCallExpression(node)) {
            if (!ts.isPropertyAccessExpression(node.expression)) {
                return undefined
            }
            if (!ts.isIdentifier(node.expression.name)) {
                return undefined
            }
            return node.expression.name.escapedText;
        }
        // Getter Call
        else if (ts.isPropertyAccessExpression(node)) {
            if (!ts.isCallExpression(node.expression)) {
                return undefined
            }
            return node.name.escapedText;
        }
        return undefined
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
        if (!source) {
            throw new Error(`Unable to find SourceFile for file '${filename}'`);
        }
        return source;
    }

    public getNesoiSymbol(name: string, path: string) {
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
        const Nesoi = this.getNesoiSymbol('Space', 'lib/engine/space.d.ts');
        const allBuilders = this.findAll(node, node => this.isCall(node, Nesoi) ? node : undefined);
        const builders: Partial<Record<BuilderType, Record<string, ts.Node>>> = {}
        allBuilders.forEach(b => {
            if (!ts.isCallExpression(b)) {
                throw new Error('A Space property is not being called as a function')
            }
            if (!ts.isPropertyAccessExpression(b.expression)) {
                throw new Error('A Space property is not being properly called')
            }
            const builderType = Parser.parseNode(b.expression.name).value as BuilderType;
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

    public findAll(node: ts.Node, predicate: (node: ts.Node) => ts.Node | undefined) {
        const found: ts.Node[] = [];

        const visit: ts.Visitor = (node) => {
            const result = predicate(node);
            if (result) {
                found.push(result);
            }
            return node.forEachChild((child) => visit(child));
        }
        node.forEachChild((child) => visit(child));

        return found;
    }

    private findParent(from: ts.Node, predicate: (node: ts.Node) => boolean) {
        let node = from;
        while (node.parent) {
            node = node.parent;
            if (predicate(node)) {
                return node
            }
        }
    }

    private findInCallChain(node: ts.Node, predicate: (node: ts.Node) => boolean) {
        const results: ts.Node[] = []
        const from = this.findCallsUntilRoot(node);
        const to = this.findCallsUntilLast(node);
        
        from.reverse();
        const calls = [
            ...from,
            ...(ts.isCallExpression(node) ? [node] : []),
            ...to
        ]
        
        for (const call of calls) {
            if (predicate(call)) {
                results.push(call);
            }
        }
        return results;
    }

    private findCallsUntilRoot(from: ts.Node) {
        const calls: (ts.CallExpression | ts.PropertyAccessExpression)[] = [];
        let node = from;
        while (node) {
            if (!ts.isCallExpression(node) && !ts.isPropertyAccessExpression(node)) {
                return calls;
            }
            if (!node.expression || !ts.isPropertyAccessExpression(node.expression)) {
                return calls;
            }
            if (!node.expression.expression) {
                return calls
            }
            if (ts.isCallExpression(node.expression.expression)) {
                calls.push(node.expression.expression);
                node = node.expression.expression;
            }
            else if (ts.isPropertyAccessExpression(node.expression.expression)) {
                calls.push(node.expression);
                node = node.expression;
            }
            else {
                return calls;
            }
        }
        return calls;
    }

    private findCallsUntilLast(from: ts.Node) {
        const calls: (ts.CallExpression | ts.PropertyAccessExpression)[] = [];
        let node = from;
        while (node) {
            if (!node.parent || !ts.isPropertyAccessExpression(node.parent)) {
                return calls;
            }
            if (!node.parent.parent) {
                return calls
            }
            if (ts.isPropertyAccessExpression(node.parent.parent)) {
                calls.push(node.parent);
                node = node.parent;
            }
            else if (ts.isCallExpression(node.parent.parent)) {
                calls.push(node.parent.parent);
                node = node.parent.parent;
            }
            else {
                return calls;
            }
        }
        return calls;
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
        target: ts.ScriptTarget.ES2020,
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
                        path = path.replace(/\.js$/, '.d.ts');
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