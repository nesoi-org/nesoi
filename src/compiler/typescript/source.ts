import * as ts from 'typescript';
import { Parser } from './parser';
import { BuilderType } from '~/schema';

export class MetaSource {

    public filename: string;
    
    public imports: ts.ImportDeclaration[] = [];
    public interfaces: Record<string, ts.InterfaceDeclaration> = {};
    public newExpressions: ts.NewExpression[] = [];
    public nesoiCallExpressions = {} as Partial<Record<
        BuilderType,
        Record<
            string,
            ts.CallExpression
        >
    >>;
    

    constructor(
        public sourceFile: ts.SourceFile
    ) {
        this.filename = this.sourceFile.fileName;
        this.parseFile();
    }

    private parseFile() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const _this = this;
        const transformerFactory: ts.TransformerFactory<ts.Node> = (
            context: ts.TransformationContext
        ) => {
            return (rootNode) => {
                function visit(node: ts.Node): ts.Node {
                    node = ts.visitEachChild(node, visit, context);
                    if (ts.isImportDeclaration(node)) {
                        _this.imports.push(node);
                    }
                    else if (ts.isInterfaceDeclaration(node)) {
                        const name = Parser.parseNode(node).value as string;
                        _this.interfaces[name] = node;
                    }
                    else if (ts.isNewExpression(node)) {
                        _this.newExpressions.push(node);
                    }

                    // TODO: Make this less strict (use something other than escapedText == Nesoi')
                    else if (
                        ts.isCallExpression(node)
                        && ts.isPropertyAccessExpression(node.expression)
                        && ts.isIdentifier(node.expression.expression)
                        && node.expression.expression.escapedText === 'Nesoi'
                    ) {
                        const builderType = Parser.parseNode(node.expression).value as string;
                        if (!(builderType in _this.nesoiCallExpressions)) {
                            (_this.nesoiCallExpressions as any)[builderType] = {};
                        }
                        const globalName = Parser.parseNode(node.arguments[0]).value as string;
                        const [moduleName, lowName] = globalName.split(':');
                        (_this.nesoiCallExpressions as any)[builderType][lowName] = node;
                    }
                    return node;
                }
                return ts.visitNode(rootNode, visit);
            };
        };
        ts.transform(this.sourceFile, [transformerFactory]);
    }

}