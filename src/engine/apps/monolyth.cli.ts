import { AnyTrxEngine } from '../transaction/trx_engine';
import * as readline from 'readline';
import * as path from 'path';
import pack from '../../../package.json';
import { Writable } from 'stream';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { $Module } from '~/schema';
import { CLIControllerAdapter } from '~/elements/edge/controller/adapters/cli.controller_adapter';
import { TypeScriptCompiler } from '~/compiler/typescript/typescript_compiler';

export type CLIData<
    M extends $Module,
    Msg extends keyof M['messages']
> = Omit<M['messages'][Msg]['#raw'], '$'>

export class MonolythCLI {
    private module?: string;

    constructor(
        // private space: Space<any>,
        private trxEngines: Record<string, AnyTrxEngine>
    ) {}

    async run() {
        Console.header('CLI');
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const context = this.module ? `${this.module}>` : '>';
            const cmd = await Console.question(context);
            if (await this.runCmd(cmd)){
                break;
            }
        }
    }

    private async runCmd(cmd: string) {
        // > help
        // Exit the CLI
        if (cmd === 'help') {
            this.cmdHelp();
            return false;
        }
        // > exit
        if (cmd === 'exit') {
            return true;
        }
        // > clear
        if (cmd === 'clear') {
            this.cmdClear();
            return false;
        }
        // > @
        if (cmd === '@') {
            await this.cmdListModules();
            return false;
        }
        // > invoke
        if (cmd === 'invoke') {
            await this.cmdInvokeInteractive();
            return false;
        }
        // > @[MODULE_NAME]
        if (this.cmdPickModule(cmd)) {
            return false;
        }
        // > invoke [ENDPOINT_PATH] [DATA_JSON]
        if (await this.cmdInvoke(cmd)) {
            return false;
        }
        Console.error('Invalid command');
        return false;
    }

    private cmdHelp() {
        Console.step('Welcome to the Nesoi Monolyth CLI.');
        console.log('' +
                `\t${Console.colored('help', 'lightcyan')}\t\tShow this info\n` +
                `\t${Console.colored('exit', 'lightcyan')}\t\tClose the CLI\n` +
                `\t${Console.colored('@', 'lightcyan')}\t\tInteractively switch to a module\n` +
                `\t${Console.colored('@[MODULE_NAME]', 'lightcyan')}\tSwitch to a module by name\n` +
                `\t${Console.colored('invoke', 'lightcyan')}\t\tInteractively invoke a message to a controller\n`
        );
    }

    private async cmdClear() {
        console.clear();
    }

    private async cmdListModules() {
        const module = await Console.select('Pick a module from the list below:',
            Object.keys(this.trxEngines));
        this.cmdPickModule(`@${module}`);
    }

    private async cmdInvokeInteractive() {
        if (!this.module) {
            Console.error('No module selected. Use "@" to switch to the desired module first.');
            return;
        }
        const module = this.trxEngines[this.module].getModule();

        const adapters = Object.entries(module.controllers)
            .reduce((a,[name, controller]) => {
                if (controller.adapter instanceof CLIControllerAdapter) {
                    a[name] = controller.adapter;
                }
                return a;
            }, {} as Record<string, CLIControllerAdapter>);

        const controllerName = await Console.select('Pick a controller from the list below:',
            Object.keys(adapters));       
        const adapter = adapters[controllerName];

        const endpointName = await Console.select('Pick an endpoint from the list below:',
            Object.keys(adapter.endpoints));
        const endpoint = adapter.endpoints[endpointName];

        const tmpInputFile = (Math.random() + 1).toString(36).substring(7) + '.cli.tmp.ts';
        const tmpInputFilePath = path.join(process.cwd(), tmpInputFile);

        const tmpInput = ''
        + 'import { CLIData as _ } from \'nesoi/lib/engine/apps/monolyth.cli\';\n'
        + `import $ from '${path.join(process.cwd(), 'types', module.name+'.module')}';\n`
        + '\n'
        + `export const data: _<$, '${endpoint.schema.msg.refName}'> = {\n\t\n};`;
        fs.writeFileSync(tmpInputFilePath, tmpInput);

        Shell.cmd('', `code ${tmpInputFilePath}`);

        await Console.waitForAnyKey();

        const compiled = TypeScriptCompiler.compileFile(tmpInputFilePath);
        fs.writeFileSync(tmpInputFilePath, compiled);

        const data = (await import(tmpInputFilePath)).data;

        Console.cmd(`invoke ${endpoint.path} ${JSON.stringify(data)}`);
        
        Console.info(`Invoking endpoint ${endpoint.path}`);
        const response = await endpoint.invoke(data);
        console.log({ output: response.output });
        console.log(response.summary());

        fs.rmSync(tmpInputFile);
    }
    
    private cmdPickModule(cmd: string) {
        const module = /@(\w*)/.exec(cmd)?.[1];
        if (!module) {
            return false;
        }
        Console.info(`Switching to module '${module}'`);
        if (!(module in this.trxEngines)) {
            Console.error(`Module '${module}' not found on app`);
            return true;
        }
        this.module = module;
        return true;
    }
    
    private async cmdInvoke(cmd: string) {
        if (!this.module) {
            Console.error('No module selected. Use "@" to switch to the desired module first.');
            return true;
        }

        const parsed = /invoke (.*?) (.*)/.exec(cmd);
        if (!parsed) {
            return false;
        }
        const [_, endpointName, json] = parsed;

        const controllerName = /\/(.*?)\//.exec(endpointName)?.[1];
        if (!controllerName) {
            Console.error('Invalid endpoint format');
            return false;
        }

        const module = this.trxEngines[this.module].getModule();
        const adapters = Object.entries(module.controllers)
            .reduce((a,[name, controller]) => {
                if (controller.adapter instanceof CLIControllerAdapter) {
                    a[name] = controller.adapter;
                }
                return a;
            }, {} as Record<string, CLIControllerAdapter>);
        const adapter = adapters[controllerName];

        const endpoint = adapter.endpoints[endpointName];
        if (!endpoint) {
            Console.error('Endpoint not found');
            return false;
        }
        
        let data;
        try {
            data = JSON.parse(json);
        }
        catch {
            Console.error('Invalid json');
            return false;
        }

        Console.info(`Invoking endpoint ${endpoint.path}`);
        const response = await endpoint.invoke(data);
        console.log(response.summary());

        return true;
    }

}

// Console helpers (this should be moved somewhere when the CLI matures)

export enum Color {
    black = '0;30',
    red = '0;31',
    green = '0;32',
    brown = '0;33',
    blue = '0;34',
    purple = '0;35',
    cyan = '0;36',
    lightgray = '0;37',
    darkgray = '1;30',
    lightred = '1;31',
    lightgreen = '1;32',
    yellow = '1;33',
    lightblue = '1;34',
    lightpurple = '1;35',
    lightcyan = '1;36'
}

export default class Console {

    // Returns colored message
    static colored(msg: string, color: keyof typeof Color) {
        return '\x1b[' + Color[color] + 'm' + msg + '\x1b[0m';
    }

    // Show a list of options and let the user pick with up/down + enter
    static async select(title: string, options: string[], defaul=0): Promise<string> {
        return new Promise(resolve => {
            Console.step(title);
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
                    rl.write(this.colored(`${i === selected ? '» ' : '  '}` + options[i] + '\n', i === selected ? 'lightgreen' : 'lightgray'));
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
                    resolve(options[selected]);
                }
                clear();
                print();
            };
            process.stdin.on('keypress', onKeypress);

            print();
        });
    }

    // Ask a question and wait for the answer
    static async question(text: string, defaul='', prefix=''): Promise<string> {
        return new Promise(resolve => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question(this.colored(text + ' ', 'cyan')+prefix, val => {
                rl.close();
                resolve(val);
            });
            rl.write(defaul);
        });
    }

    static waitForAnyKey(title = 'Press any key to continue...'): Promise<void> {
        return new Promise<void>(resolve => {
            Console.step(title);
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
                process.stdin.off('keypress', onKeypress);
                resolve();
            };
            process.stdin.on('keypress', onKeypress);
        });
    }

    // Ask a yes or no question and wait for the answer
    static async yesOrNo(text: string, defaul:'y'|'n' = 'n'): Promise<boolean> {
        let answer = await this.question(text + ' [y|n]', defaul);
        answer = answer.toLowerCase();
        if (answer === 'y' || answer === 'yes') return true;
        return false;
    }

    // Prints a step message to the terminal
    static step(msg: string) {
        console.log(this.colored('- ' + msg, 'green'));
    }

    // Prints a info message to the terminal
    static info(msg: string) {
        console.log(this.colored(msg, 'lightblue'));
    }

    // Prints a info message to the terminal
    static cmd(msg: string) {
        console.log(this.colored('\n\t> ' + msg + '\n', 'darkgray'));
    }

    // Prints a error message to the terminal
    static error(msg: string) {
        console.log(this.colored('! ' + msg, 'red'));
    }

    // Prints the header
    static header(module: string) {
             
        console.log(this.colored('                              __', 'lightblue'));
        console.log(this.colored('  ___      __    ____    ___ /\\_\\', 'lightblue'));
        console.log(this.colored(' /\'_ `\\  /\'__`\\ /\',__\\  / __`\\/\\ \\', 'lightblue'));
        console.log(this.colored('/\\ \\/\\ \\/\\  __//\\__, `\\/\\ \\L\\ \\ \\ \\', 'lightblue'));
        console.log(this.colored('\\ \\_\\ \\_\\ \\____\\/\\____/\\ \\____/\\ \\_\\', 'lightblue'));
        console.log(this.colored(' \\/_/\\/_/\\/____/\\/___/  \\/___/  \\/_/', 'lightblue'));
        console.log(this.colored('                          '+pack.version, 'cyan'));
        console.log('[ ' + module + ' ]');
        console.log();
    
    }

}

class Shell {

    /**
     * Execute command in shell.
     */
    static cmd(cwd: string, cmd: string, stdin?: string[], stdout = true, stderr = true) {
        console.log(cwd + '$ ' + cmd);
        return new Promise(resolve => {
            const cmds = cmd.split(' ');
            const child = spawn(cmds[0], cmds.slice(1), {shell: true, stdio: [stdin?null:process.stdin, stdout?null:process.stdout, (process as any).error], cwd});
            if (stdin) stdin.map(input => child.stdin.write(input + '\n'));
            const out = {
                stdout: [] as string[],
                stderr: [] as string[]
            };
            child.stdout.on('data', msg => {
                if (stdout) {
                    process.stdout.write(msg.toString());
                }
                out.stdout.push(msg.toString());
            });
            child.stderr.on('data', msg => {
                if (stderr) {
                    process.stderr.write(msg.toString());
                }
                out.stderr.push(msg.toString());
            });
            child.on('error', msg => {
                console.error(msg);
                throw 'Something went wrong when running the shell command. Read the logs.';
            });
            child.on('close', code => {
                if (code !== 0) {
                    throw `Shell command returned ${code} != 0. Read the logs.`;
                }
                resolve(out);
            });
        });
    }
}