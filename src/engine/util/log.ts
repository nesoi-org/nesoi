import type { Color} from './string';

import { colored } from './string';
import { NesoiDatetime } from '../data/datetime';

const LogLevel = ['off', 'error', 'warn', 'info', 'debug', 'trace'] as const;

export type LogLevel = typeof LogLevel[number]

export function scopeTag(scope: string, scope_id: string) {
    const color: keyof typeof Color = {
        compiler: 'brown' as const,
        trx: 'purple' as const,
        daemon: 'lightcyan' as const,
        app: 'lightcyan' as const,
        module: 'lightcyan' as const,
        layer: 'lightgreen' as const,
        virtual: 'lightgreen' as const,

        constants: 'lightblue' as const,
        externals: 'lightpurple' as const,
        message: 'lightblue' as const,
        bucket: 'lightblue' as const,
        job: 'lightblue' as const,
        resource: 'lightblue' as const,
        controller: 'lightblue' as const,
        machine: 'lightblue' as const,
        queue: 'lightblue' as const,
        topic: 'lightblue' as const,

        nql: 'lightpurple' as const,

        'inc.server': 'lightgreen' as const,
        'inc.client': 'lightcyan' as const,
    }[scope] || 'lightgray';
    return colored(`${scope}:${scope_id}`, color);
}

export function anyScopeTag(scopeWithId: string) {
    const [_, module, type, name] = scopeWithId.match(/(\w+::)?(\w+):?(.+)?/) || [];
    return (module ? module : '') + scopeTag(type as any, name || '');
}

export class Log {

    public static level: LogLevel = 'warn';

    private static l = {
        off: colored('', 'black'),
        error: colored('ERROR', 'lightred'),
        warn: colored('WARN', 'yellow'),
        info: colored('INFO', 'lightblue'),
        debug: colored('DEBUG', 'lightgreen'),
        trace: colored('TRACE', 'lightpurple'),
    };

    public static error(
        scope: string,
        scope_id: string,
        message: string,
        obj?: Record<string, any>
    ) {
        if (LogLevel.indexOf(Log.level) < 1) { return; }
        this.push('error', scope, scope_id, message, obj);
    }
    public static warn(
        scope: string,
        scope_id: string,
        message: string,
        obj?: Record<string, any>
    ) {
        if (LogLevel.indexOf(Log.level) < 2) { return; }
        this.push('warn', scope, scope_id, message, obj);
    }
    public static info(
        scope: string,
        scope_id: string,
        message: string,
        obj?: Record<string, any>
    ) {
        if (LogLevel.indexOf(Log.level) < 3) { return; }
        this.push('info', scope, scope_id, message, obj);
    }
    public static debug(
        scope: string,
        scope_id: string,
        message: string,
        obj?: Record<string, any>
    ) {
        if (LogLevel.indexOf(Log.level) < 4) { return; }
        this.push('debug', scope, scope_id, message, obj);
    }
    public static trace(
        scope: string,
        scope_id: string,
        message: string,
        obj?: Record<string, any>
    ) {
        if (LogLevel.indexOf(Log.level) < 5) { return; }
        this.push('trace', scope, scope_id, message, obj);
    }
    
    private static push(
        level: LogLevel,
        scope: string,
        scope_id: string,
        message: string,
        obj?: Record<string, any>
    ) {
        const time = colored(`${NesoiDatetime.shortIsoNow()}`, 'darkgray');
        const head = scopeTag(scope, scope_id);
        if (level === 'error') {
            console.log(`${time} ${this.l[level]} ${head}\t${colored(message, 'lightred')}`);
            if (obj) {
                let text = JSON.stringify(obj, undefined, 2);
                text = text.replace(/\\n/g, '\n');
                console.log(colored(text, 'red'));
            }
        }
        else {
            console.log(`${time} ${this.l[level]} ${head}\t${message}`);
            if (obj) {
                console.debug(obj);
            }
        }
    }

}