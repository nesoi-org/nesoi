/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import Benchmark from 'benchmark';
import * as fs from 'fs';
import * as path from 'path';
import Shell from '~/engine/util/shell';

export class NesoiBenchmarkSuite<T> extends Benchmark.Suite {

    public results: {
        [option: string]: {
            n: number|string,
            mean: number
            rme: number
            op_sec: number
        }[]
    } = {}

    public n!: number|string;
    public data!: T;

    constructor(
        name: string,
        public config: {
            n: (number|string)[]
            data: (n: number|string) => T
        }
    )  {
        super (name, {
            onCycle: (event: any) => {
                const name = event.target.name.slice(1,-1).trim();
                this.results[name] ??= [];
                this.results[name].push({
                    n: this.n,
                    mean: event.target.stats.mean,
                    rme: event.target.stats.rme,
                    op_sec: event.target.hz
                });
                console.log(String(event.target));
            },
            onComplete: () => {
                console.log('Fastest is ' + this.filter('fastest').map('name'));
            }
        });
    }

    public add_(name: string, fn: (data: T) => void, options?: Benchmark.Options): NesoiBenchmarkSuite<T> {
        const _fn = () => fn(this.data);
        return super.add(name, _fn, options) as never;
    }

    public run_(filename: string) {
        for (const n of this.config.n) {
            console.log(`\n--- ${this.name} (n=${n}) ---`)

            this.n = n;
            this.data = this.config.data(n);
            super.run({ async: false })
        }

        fs.mkdirSync(path.dirname(filename), {
            recursive: true
        });
        fs.writeFileSync(filename, JSON.stringify(this.results, undefined, 2));

        const plot_output = path.join(path.dirname(filename), `${this.name}.png`)
        Shell.cmd(process.cwd(), `python3 lib/plot.py ${this.name} ${filename} ${plot_output}`);

        return this.results;
    } 

}