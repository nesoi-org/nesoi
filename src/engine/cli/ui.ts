import * as readline from 'readline';
import { Writable } from 'stream';
import { colored } from '../util/string';

/**
 * @category Engine
 * @subcategory CLI
 */
export default class UI {

    /**
     * Show a list of options and let the user pick with up/down + enter
     */
    static async select<T>(
        title: string,
        options: T[],
        val: NoInfer<(o: T) => string> = (o => o as any),
        defaul=0
    ): Promise<{ i: number, value: T }> {
        return new Promise(resolve => {
            UI.step(title);
            let mute = true;
            const mutableStdout = new Writable({
                write: function(chunk, encoding, callback) {
                    if (!mute) {
                        process.stdout.write(chunk, encoding);
                    }
                    callback();
                }
            });

            const rl = readline.createInterface({
                input: process.stdin,
                output: mutableStdout,
                terminal: true
            });

            let selected = defaul;
            const print = () => {
                mute = false;
                for (let i = 0; i < options.length; i++) {
                    rl.write(colored(`${i === selected ? '» ' : '  '}` + val(options[i]) + '\n', i === selected ? 'lightgreen' : 'lightgray'));
                }
                mute = true;
            };
            const clear = () => {
                process.stdout.moveCursor(0, -options.length);
            };

            const onKeypress = function (ch: any, key: any) {
                if (!key) {
                    return;
                }
                if (key.name === 'up') {
                    if (selected > 0) {
                        selected -= 1;
                    }
                }
                else if (key.name === 'down') {
                    if (selected < options.length-1) {
                        selected += 1;
                    }
                }
                else if (key.name === 'return') {
                    rl.close();
                    process.stdin.off('keypress', onKeypress);
                    resolve({ i: selected, value: options[selected] });
                }
                clear();
                print();
            };
            process.stdin.on('keypress', onKeypress);

            print();
        });
    }

    /**
     * Ask a question and wait for the answer
     */
    static async question(text: string, defaul='', prefix=''): Promise<string> {
        return new Promise(resolve => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question(colored(text + ' ', 'cyan')+prefix, val => {
                rl.close();
                resolve(val);
            });
            rl.write(defaul);
        });
    }

    /**
     * Show a message and wait for the user to press any key
     */
    static waitForAnyKey(title = 'Press any key to continue...'): Promise<{ sequence: string, name: string, ctrl: boolean, shift: boolean }> {
        return new Promise(resolve => {
            process.stdin.write(title+' ');
            const mutableStdout = new Writable({
                write: function(chunk, encoding, callback) {
                }
            });

            const rl = readline.createInterface({
                input: process.stdin,
                output: mutableStdout,
                terminal: true
            });

            const onKeypress = function (ch: any, key: any) {
                rl.close();
                console.log(`${colored(ch, 'lightcyan')}\n`)
                process.stdin.off('keypress', onKeypress);
                resolve(key);
            };
            process.stdin.on('keypress', onKeypress);
        });
    }

    /**
     * Ask a yes or no question and wait for the answer
     */
    static async yesOrNo(text: string, defaul:'y'|'n' = 'n'): Promise<boolean> {
        const answer = await this.waitForAnyKey('\n\t» ' + colored(text, 'lightblue') + colored(' [y|n]', 'darkgray'));
        if (answer.name === 'y') return true;
        return false;
    }

    // Print

    static list(items: string[]) {
        items.forEach(item => {
            console.log(colored('▫ ', 'lightgreen') + item)
        })        
    }

    static result(outcome: 'ok'|'error', message: string, details?: any) {
        if (outcome === 'ok') {
            console.log(colored('✔ ' + message, 'lightgreen'))
        }
        else if (outcome === 'error') {
            console.log(colored('✕ ' + message, 'red'))
            if (details) {
                console.log('\t'+colored(details, 'lightred'))
            }
        }
    }

    /**
     * Print a step message to the terminal
     */
    static step(msg: string) {
        console.log(colored('- ' + msg, 'green'));
    }

    /**
     * Print a info message to the terminal
     */
    static info(msg: string) {
        console.log(colored(msg, 'lightblue'));
    }

    /**
     * Print a command to the terminal
     */
    static cmd(msg: string) {
        console.log(colored('\n\t> ' + msg + '\n', 'darkgray'));
    }

    /**
     * Print a error message to the terminal
     */
    static error(msg: string) {
        console.log(colored('! ' + msg, 'red'));
    }

}