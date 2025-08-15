/* @nesoi:browser ignore-file */

import * as fs from 'fs';
import * as path from 'path';
import { colored } from '../util/string';
import UI from './ui';
import Console from '../util/console';
import { AnyDaemon, Daemon } from '../daemon';
import { CLIAdapter } from './cli_adapter';
import { Log } from '../util/log';
import { CLIInputHandler } from './cli_input';
import Shell from '../util/shell';
import { Random } from '../util/random';

export type CLIConfig<Services> = {
    editor?: string,
    adapters?: {
        [x: string]: (cli: CLI, services: Services) => CLIAdapter
    }
}

/**
 * @category Engine
 * @subcategory CLI
 */
export class CLI {

    private app: string;
    private ctx: string = '';

    private adapters: Record<string, CLIAdapter> = {}
    private input: CLIInputHandler;

    constructor(
        private daemon: AnyDaemon,
        public config?: CLIConfig<any>
    ) {
        this.app = Daemon.get(daemon, 'name') || 'app';

        // Build adapters
        this.adapters = {};
        Object.entries(config?.adapters || {}).forEach(([key, val]) => {
            this.adapters[key] = val(this, Daemon.get(daemon, 'services'));
            this.adapters[key].name = key;
        });

        this.input = new CLIInputHandler(this.getCmds());
    }

    async run(cmd?: string) {
        if (cmd) {
            this.runCmd(cmd);
            return;
        }
        
        Console.header('CLI');
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const ctx = `${colored(this.app, 'darkgray')}:${colored(this.ctx, 'lightcyan')}${colored('$', 'brown')}`;
            const cmd = await this.input.input(ctx);
            if (!cmd) continue;
            try {
                if (await this.runCmd(cmd)){
                    break;
                }
            }
            catch (e) {
                console.error(e);
                Log.error('cli' as any, Daemon.get(this.daemon, 'name'), `Failed to run command: ${cmd}`);
            }
        }
    }

    private async runCmd(payload: string) {
        payload = payload.trim();
        // > help
        // Exit the CLI
        if (payload === 'help') {
            this.cmdHelp();
            return false;
        }
        // > exit
        if (payload === 'exit') {
            return true;
        }
        // > clear
        if (payload === 'clear') {
            this.cmdClear();
            return false;
        }
        // > invoke
        const invoke = payload.match(/invoke (.*)/);
        if (invoke) {
            await this.cmdInvoke(invoke[1]);
            return false;
        }
        for (const name in this.adapters) {
            if (!payload.startsWith(name)) continue;
            payload = payload.replace(name, '').trim();

            const adapter = this.adapters[name];
            if (await adapter.runCmd(this.daemon, payload)) {
                return false;
            }
        }

        UI.error(`Invalid command '${payload}'`);
        return false;
    }

    private cmdHelp() {
        UI.step('\nWelcome to the Nesoi CLI!\n');
        let str = '' +
                `${colored('general', 'brown')}\n` +
                `\t${colored('help', 'lightcyan')}\n\t\tShow this info\n` +
                `\t${colored('invoke [JOB]', 'lightcyan')}\n\t\tInvoke a job by refName (module::name)\n` +
                `\t${colored('exit', 'lightcyan')}\n\t\tClose the CLI\n` +
                `\t${colored('clear', 'lightcyan')}\n\t\tClear the sceen\n`;
        Object.values(this.adapters).forEach(adapter => {
            str += adapter.help()
        })
        console.log(str);
    }

    private async cmdClear() {
        console.clear();
    }

    private async cmdInvoke(job: string) {
        const [module, name] = job.split('::');
        if (!module || !name) {
            UI.error(`Invalid job '${job}'. Expected "module::name"`);
            return;
        }

        const tmpFile = 'job_input__'+Random.bytes(8).toString('hex')+'.js';
        const tmpPath = path.join(process.cwd(), tmpFile);
        
        fs.writeFileSync(tmpPath, 'export const input = {\n  \n}');
        
        await this.daemon.trx(module).run(async trx => {
            const job = trx.job(name);

            let done = false;
            while (!done) {
                if (await this.openEditor(tmpPath)) break;
                try {
                    delete require.cache[tmpPath];
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    const input = require(tmpPath).input;
                    await job.run(input);
                    done = true;
                }
                catch (e: any) {
                    UI.error(e.toString());
                }
            }
        })

        fs.rmSync(tmpPath);
    }

    private getCmds() {
        const cmds: string[] = [];
        for (const a in this.adapters) {
            const adapter = this.adapters[a]
            for (const c in adapter.commands) {
                const command = adapter.commands[c];
                cmds.push(adapter.name + ' ' + command.name);
            }
        }
        return cmds;
    }

    public async openEditor(file: string) {
        const editor = this.config?.editor || 'code';
        Shell.cmd(process.cwd(), `${editor} ${file}`);
        if (!['vi','vim','nano'].includes(editor)) {
            const res = await UI.waitForAnyKey('Aperte qualquer tecla após salvar o arquivo');
            if (res.sequence === '\x03') return true;
        }
        return false;
    }

}
