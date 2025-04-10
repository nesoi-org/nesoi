import { colored } from '../util/string';
import UI from './ui';
import Console from '../util/console';
import { AnyDaemon, Daemon } from '../daemon';
import { CLIAdapter } from './cli_adapter';
import { Log } from '../util/log';
import { CLIInputHandler } from './cli_input';

export type CLIConfig<Providers> = {
    adapters?: {
        [x: string]: (providers: Providers) => CLIAdapter
    }
}

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
            this.adapters[key] = val(Daemon.get(daemon, 'providers'));
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

}
