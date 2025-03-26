import { $Message as $Message } from './message.schema';
import crypto from 'crypto';

export class Message<$ extends $Message> {
    
    public $: string
    private __meta__: {
        sig?: string
    };

    private constructor(
        _$: string,
        data: Omit<$['#parsed'], '$'>,
        sigKey?: string
    ) {
        this.$ = _$;
        const { $, ...d } = data as any;
        Object.assign(this, d);

        this.__meta__ = {
            sig: sigKey ? this.sign(data, sigKey) : undefined
        };
    }

    private sign(data: Omit<$['#parsed'], '$'>, sigKey: string) {
        function dump(obj: Record<string, any>) {
            let str = '';
            const keys = Object.keys(obj).sort();
            for (const i in keys) {
                str += keys[i]+':';
                const val = obj[keys[i]];
                if (typeof val === 'object') {
                    str += dump(val);
                }
                else {
                    str += val.toString();
                }
                str += '\n';
            }
            return str;
        }
        const text = atob(dump(data));
        return crypto.createHmac('sha1', sigKey)
            .update(text)
            .digest('hex');
    }

    public getData() {
        const { $, __meta__, ...data } = this;
        return data;
    }

    public static new<
        $ extends $Message
    >(
        $: string,
        data: $['#parsed'],
        sigKey?: string
    ) {
        return new Message($, data, sigKey) as Message<$> & $['#parsed'];
    }

    public static clone<M extends Message<any>>(msg: M) {
        const clone = new Message(msg.$, msg as any);
        clone.__meta__ = msg.__meta__;
        return clone;
    }

}

export type AnyMessage = Message<any>