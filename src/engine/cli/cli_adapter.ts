import { AnyDaemon } from '../daemon';
import { colored } from '../util/string';

export abstract class CLICommand<
    T extends Record<string, any> = Record<string, any>
> {

    constructor(
        public name: string,
        public syntax: string,
        public description: string,
        public regex?: RegExp,
        public groups?: string[]
    ) {}

    public input(payload: string) {
        if (!this.regex) {
            return {}
        }
        const match = payload.match(this.regex);
        if (!match) {
            throw new Error(`Invalid input for command ${this.name}`);
        }
        const data: Record<string, any> = {};
        if (this.groups) {
            for (let i = 0; i < this.groups.length; i++) {
                const key = this.groups[i];
                data[key] = match[i+1];
            }
        }
        return data;
    }

    abstract run(daemon: AnyDaemon, input: T): Promise<void>;

}

export abstract class CLIAdapter {

    public name?: string;
    public commands: Record<string, CLICommand> = {}

    constructor() {}

    public async runCmd(daemon: AnyDaemon, payload: string) {
        payload = payload.trim();
        let cmd: CLICommand | undefined;
        for (const name in this.commands) {
            if (!payload.startsWith(name)) continue;
            payload = payload.replace(name, '').trim();
            cmd = this.commands[name];
        }
        if (!cmd) {
            return false;
        }
        const input = cmd.input(payload);
        await cmd.run(daemon, input);
        return true;
    }

    public help() {
        const name = this.name || '?';
        let str = `${colored(name, 'brown')}\n`;
        Object.values(this.commands).forEach(cmd => {
            str += `\t${colored(name + ' ' + cmd.syntax, 'lightcyan')}\n\t\t${cmd.description}\n`
        })
        return str;
    }

}