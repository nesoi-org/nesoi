import { Writable } from 'stream';
import * as readline from 'readline';

/**
 * @category Engine
 * @subcategory CLI
 */
export class CLIInputHandler {

    private items: string[] = []
    private history = 0

    private buffer: string = '';
    private cursor = 0;

    private suggestion?: {
        seed: string,
        idx: number
    };

    constructor(
        private suggestions: string[] = []
    ) {}

    /**
     * Wait for user input:
     * - Some text + Enter
     * - Special Keys: Up/Down/Tab
     */
    async input(ctx?: string): Promise<string|undefined> {
        return new Promise(resolve => {
            const mutableStdout = new Writable({
                write: function(chunk, encoding, callback) {
                }
            });

            this.buffer = '';
            this.cursor = 0;
            this.suggestion = undefined;

            const rl = readline.createInterface({
                input: process.stdin,
                output: mutableStdout,
                terminal: true
            });

            const print = () => {
                process.stdout.clearLine(0)
                process.stdout.cursorTo(0)
                process.stdout.write(ctx + ' ' + this.buffer)
                process.stdout.moveCursor(this.cursor - this.buffer.length, 0)
            }
            print();

            const onKeypress = (ch: any, key: any) => {

                // History

                if (key.name === 'up') {
                    this.buffer = this.up() || this.buffer;
                    this.cursor = this.buffer.length;
                    print()
                    return
                }
                if (key.name === 'down') {
                    this.buffer = this.down() || '';
                    this.cursor = this.buffer.length;
                    print()
                    return
                }

                // Suggestion

                if (key.name === 'tab') {
                    this.buffer = this.suggest(this.buffer) || this.buffer;
                    this.cursor = this.buffer.length;
                    print()
                    return
                }
                this.suggestion = undefined;
                
                // Text Editing

                if (key.name === 'left') {
                    if (this.cursor > 0) {
                        process.stdout.moveCursor(-1,0);
                        this.cursor -= 1;
                    }
                    print()
                    return
                }
                if (key.name === 'right') {
                    if (this.cursor < this.buffer.length) {
                        process.stdout.moveCursor(1,0);
                        this.cursor += 1;
                    }
                    print()
                    return
                }
                if (key.name === 'backspace') {
                    if (this.buffer.length == 0) {
                        return
                    }
                    this.buffer = this.buffer.slice(0,this.cursor-1)
                        + this.buffer.slice(this.cursor)
                    this.cursor -= 1;
                    print()
                    return
                }
                if (key.name === 'delete') {
                    if (this.buffer.length == 0) {
                        return
                    }
                    this.buffer = this.buffer.slice(0,this.cursor)
                        + this.buffer.slice(this.cursor+1)
                    print()
                    return
                }

                // Submit

                if (key.name === 'return') {
                    submit(this.buffer);
                    return
                }

                // Text Characters

                else {
                    this.buffer = this.buffer.slice(0,this.cursor)
                        + ch
                        + this.buffer.slice(this.cursor)
                    this.cursor += 1;
                    print()
                }
            };
            const onCancel = () => {
                if (!this.buffer.length) {
                    process.stdout.clearLine(0)
                    process.stdout.cursorTo(0)
                    process.exit();
                }
                submit(undefined);
            }

            const submit = (value: string|undefined) => {
                process.stdout.write('\n');
                rl.close();
                process.stdin.off('keypress', onKeypress);
                rl.off('SIGINT', onCancel);
                this.buffer = '';
                if (value !== undefined) {
                    this.add(value);
                }
                resolve(value);
            }

            process.stdin.on('keypress', onKeypress);
            rl.on('SIGINT', onCancel);
        });
    }

    public add(item: string) {
        this.history = 0;
        this.suggestion = undefined;
        if (this.items[0] === item) {
            return
        }
        this.items.unshift(item);
    }

    public up() {
        if (this.history >= this.items.length) return;
        const item = this.items[this.history];
        this.history += 1;
        return item;
    }

    public down() {
        if (this.history <= 0) return;
        const item = this.items[this.history];
        this.history -= 1;
        return item;
    }

    public suggest(_seed: string) {
        const idx = this.suggestion?.idx || 0;
        const seed = this.suggestion?.seed || _seed;

        for (let i = idx; i < this.suggestions.length; i++) {
            const sugg = this.suggestions[i];
            if (sugg.startsWith(seed)) {
                this.suggestion = {
                    seed,
                    idx: i+1
                };
                return sugg;
            }
        }

        this.suggestion = undefined;
        return seed;
    }

}
