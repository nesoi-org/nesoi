import * as ts from 'typescript';
import { Parser } from '../parser';

export function makeAppInjectTransformer(modules: string[]) {
    // @ts-expect-error This is according to documentation, but the type is broken for some reason
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
        let esnext = false;
        const visit = (node: ts.Node): { monolyth: boolean, node: ts.Node } => {
            
            // Find leaf node of builder which is a NewExpression
            if (ts.isNewExpression(node)) {
                const name = Parser.parseNode(node.expression).value
                if (name !== 'MonolythApp' && name !== 'BrowserApp') {
                    return { monolyth: false, node };
                }
                esnext = name === 'BrowserApp';
                return {
                    monolyth: true,
                    node: ts.factory.updateNewExpression(
                        node,
                        node.expression,
                        node.typeArguments,
                        [
                            node.arguments![0]
                        ]
                    )
                };
            }

            // Check children for a monolyth NewExpression
            let monolyth = false;
            const cNode = ts.visitEachChild(node, (child) => {
                const deep = visit(child);
                if (deep.monolyth) monolyth = true;
                return deep.node;
            }, context)
            
            // Transform .modules() into .inject()
            if (monolyth
                && ts.isCallExpression(cNode)
                && ts.isPropertyAccessExpression(cNode.expression)
                && ts.isIdentifier(cNode.expression.name)
                && cNode.expression.name.escapedText === 'modules') {

                return {
                    monolyth: true,
                    node: ts.factory.updateCallExpression(
                        cNode,
                        ts.factory.updatePropertyAccessExpression(
                            cNode.expression,
                            cNode.expression.expression,
                            ts.factory.createIdentifier('inject')
                        ),
                        cNode.typeArguments,
                        [
                            ts.factory.createArrayLiteralExpression(modules.map(module => 
                                esnext
                                    // (await import('...')).default
                                    ? ts.factory.createPropertyAccessExpression(
                                        ts.factory.createParenthesizedExpression(
                                            ts.factory.createAwaitExpression(
                                                ts.factory.createCallExpression(
                                                    ts.factory.createIdentifier('import'),
                                                    undefined,
                                                    [
                                                        ts.factory.createStringLiteral(`./modules/${module}`, true)
                                                    ]
                                                ),
                                            )
                                        ),
                                        ts.factory.createIdentifier('default')
                                    )

                                    // require('...').default
                                    : ts.factory.createPropertyAccessExpression(
                                        ts.factory.createCallExpression(
                                            ts.factory.createIdentifier('require'),
                                            undefined,
                                            [
                                                ts.factory.createStringLiteral(`./modules/${module}`, true)
                                            ]
                                        ),
                                        ts.factory.createIdentifier('default')
                                    )
                            ),
                            true
                            )
                        ]
                    )
                };
            }
            
            return {
                monolyth,
                node: cNode
            }
        };

        return (node) => ts.visitNode(node, (child) => {
            const { monolyth, node } = visit(child);
            return node
        })
    };
    return transformer;
}