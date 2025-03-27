import { AnyDaemon, Daemon } from '../daemon';
import { NesoiError } from '../data/error';

export class i18n {

    static error(error: NesoiError.BaseError, daemon?: AnyDaemon) {
        if (!daemon) {
            return error.toString();
        }
        const strings = Daemon.get(daemon, 'app')?.i18n || {};
        if (error.name in strings) {
            const msg = strings[error.name](error.data || {});
            error.message = msg;
            return msg;
        }
        return error.toString();
    }

}