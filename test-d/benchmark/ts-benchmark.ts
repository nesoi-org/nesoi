import * as ts from 'typescript';
import { Log } from '~/engine/util/log';
import { colored } from '~/engine/util/string';
import { NesoiDatetime } from '~/engine/data/datetime';


Log.level = 'debug';

type BenchmarkResult = {
    title: string
    type_str: string
    probes: {
        time: number
        length: number
    }[]
}

type BenchmarkNode = {
    kind?: ts.SyntaxKind,
    comment: string,
    node: ts.Node
}

export class TypeScriptBenchmark {

    private program!: ts.Program;
    private checker!: ts.TypeChecker;

    constructor(
        public file: string
    ) {}

    private createProgram(files: string[]) {
        const options = {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            moduleResolution: ts.ModuleResolutionKind.Node10,
            noEmitOnError: true,
            declaration: false,
            strict: true,
            esModuleInterop: true,
            paths: {
                // ...(this.nesoiPath ? { 'nesoi/*': [`${this.nesoiPath}/*`] } : {}),
                '~/*': ['/home/aboud/git/nesoi/src/*']
            },
            // rootDir: Space.path(this.space),
            baseUrl: '.'
        }
        const host = ts.createCompilerHost(options);
        this.program = ts.createProgram({
            host,
            rootNames: files,
            options,
        });

        this.checker = this.program.getTypeChecker();
    }

    public benchmark(n = 30) {
        Log.info('benchmark' as any, 'check', `Benchmarking types of file ${colored(this.file, 'blue')}`)

        // // Copy file N times to avoid caching
        // const files: string[] = [];
        // for (let i = 0; i < n; i++) {
        //     const file = this.file.replace('.ts',`.tmp.${i}.ts`);
        //     const filestr = fs.readFileSync(this.file).toString();
        //     fs.writeFileSync(file, filestr);
        //     files.push(file);
        // }

        
        // Iterate N times, each going through all nodes of the
        // file and registering the result on a list.
        const results: BenchmarkResult[] = [];
        for (let i = 0; i < n; i++) {
            Log.debug('benchmark' as any, 'check', `Probe ${colored(i.toString(), 'lightpurple')}`)

            // Create program and get each file's @ts-benchmark nodes
            this.createProgram([this.file]);
            const nodes = this.getBenchmarkNodes(this.file);

            if (!nodes.length) {
                Log.warn('benchmark' as any, 'check', 'No @ts-benchmark leading comments found on the file.')
            }

            for (let j = 0; j < nodes.length; j++) {
                const node = nodes[j];
                const result = this.benchmarkNode(node);
                if (i == 0) {
                    results.push({
                        title: node.comment || '?',
                        type_str: result.str,
                        probes: []
                    })
                }
                else {
                    results[j].probes.push(result.probe);
                }
            }
        }
        
        for (const result of results) {
            console.log(this.describe(result));
        }

        // for (const file of files) {
        //     fs.rmSync(file);
        // }
    }

    public benchmarkNode(node: BenchmarkNode) {

        let start: NesoiDatetime;
        let end: NesoiDatetime;

        let str = '';
        if (ts.isCallExpression(node.node)) {
            start = NesoiDatetime.now();

            const signature = this.checker.getResolvedSignature(node.node);
            if (signature != null) {
                const params = signature.getParameters();
                for (const param of params) {
                    const type = this.checker.getTypeOfSymbolAtLocation(param, node.node);
                    // TODO: read props
                }
            }
            
            end = NesoiDatetime.now();
            str = '';
        }
        else {
            start = NesoiDatetime.now();
            const type = this.checker.getTypeAtLocation(node.node);
            if (type.isUnion()) {
                for (const t of type.types) {
                    t.getProperties().forEach(prop => {
                        const valuetype = this.checker.getTypeOfSymbolAtLocation(prop, node.node);
                        const valuetype_str = this.checker.typeToString(valuetype)
                        str += prop.escapedName + ':' + valuetype_str + '; ';
                    })
                }
            }
            else {
                type.getProperties().forEach(prop => {
                    const valuetype = this.checker.getTypeOfSymbolAtLocation(prop, node.node);
                    const valuetype_str = this.checker.typeToString(valuetype)
                    str += prop.escapedName + ':' + valuetype_str + '; ';
                })
            }
            end = NesoiDatetime.now();
        }
        
        // console.log({str});
        const time = end.epoch - start.epoch;

        return {
            str,
            probe: {
                time,
                length: str.length
            } as BenchmarkResult['probes'][number]
        }
    }

    public describe(result: BenchmarkResult) {
        let str = '';
        str += '┌\n';
        str += `│ Benchmark type: ${colored(result.title, 'lightcyan')}\n`;
        str += '└\n\n';
        str += '◆ Probes:\n'
        
        let sum = 0;
        result.probes.forEach(probe => {
            sum += probe.time;
            let color = 'red';
            if (probe.time < 100) color = 'lightgreen';
            else if (probe.time < 500) color = 'green';
            else if (probe.time < 1000) color = 'yellow';
            str += `└ (l: ${probe.length}) ${colored(probe.time + 'ms', color as any)}\n`;
        })
        const avg = sum / result.probes.length;
        str += '\n';
        str += `${colored('𝚺 sum:', 'lightcyan')}: ${sum}ms\n`;
        str += `${colored('⚖ avg:', 'lightcyan')}: ${avg}ms\n`;
        return str;
    }

    public getBenchmarkNodes(file: string) {
        const source = this.getSource(file);
        const text = source.getFullText();
        const nodes: BenchmarkNode[] = [];
        const visit: ts.Visitor = (node) => {
            const ranges = ts.getLeadingCommentRanges(
                text, 
                node.getFullStart());
            const comments = ranges?.map(r=>
                text.slice(r.pos,r.end)
            );
            if (comments) {
                const benchmarkComment = comments.find(c => c.includes('@ts-benchmark'));
                const match = benchmarkComment?.match(/@ts-benchmark(\[(.*)\])?(.*)/);
                const k = match?.[2]?.trim() || '?';
                const comment = match?.[3]?.trim() || '?';
                const kind = {
                    CallExpression: ts.SyntaxKind.CallExpression
                }[k]
                if ((!kind || node.kind === kind) && benchmarkComment) {
                    nodes.push({
                        kind,
                        comment,
                        node
                    })
                }
            }
            return node.forEachChild((child) => visit(child));
        }
        source.forEachChild(node => visit(node))
        return nodes;
    }

    private getSource(filename: string) {
        const source = this.program.getSourceFile(filename);
        if (!source) {
            throw new Error(`Unable to find SourceFile for file '${filename}'`);
        }
        return source;
    }

}

const bnmk = new TypeScriptBenchmark('/home/aboud/git/nesoi/test-d/benchmark/replace.bnmk.ts');

bnmk.benchmark();