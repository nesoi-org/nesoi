import { NesoiError } from '../data/error';
import { AnyDaemon } from '../apps/app';

export class i18n {

    static error(error: NesoiError.BaseError, daemon?: AnyDaemon) {
        if (!daemon) {
            return error.toString();
        }
        const strings = daemon?.i18n || {};
        if (error.name in strings) {
            const msg = strings[error.name](error.data || {});
            error.message = msg;
            return msg;
        }
        return error.toString();
    }

}