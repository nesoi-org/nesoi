import type { AnyDaemon} from '../daemon';
import type { NesoiError } from '../data/error';

import { Daemon } from '../daemon';

export class i18n {

    static error(error: NesoiError.BaseError, daemon?: AnyDaemon) {
        if (!daemon) {
            return error.message;
        }
        const strings = Daemon.get(daemon, 'config')?.i18n || {};
        if (error.name in strings) {
            const msg = strings[error.name](error.data || {});
            error.message = msg;
            return msg;
        }
        return error.message;
    }

}