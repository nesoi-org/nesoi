import * as ts from 'typescript';
import { Parser } from '../parser';

export function makeAppInjectTransformer(modules: string[]) {
    // @ts-expect-error This is according to documentation, but the type is broken for some reason
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
        const visit = (node: ts.Node): { monolyth: boolean, node: ts.Node } => {
            
            // Find leaf node of builder which is a NewExpression
            if (ts.isNewExpression(node)) {
                if (Parser.parseNode(node.expression).value !== 'MonolythApp') {
                    return { monolyth: false, node };
                }
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
                                ts.factory.createPropertyAccessExpression(
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