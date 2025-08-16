/* @nesoi:browser ignore-start */
import crypto from 'crypto';
/* @nesoi:browser ignore-end */

/* @nesoi:browser add
const crypto = (window.crypto || window.msCrypto);
*/

export class Random {

    public static uuid() {
        return crypto.randomUUID();
    }

    public static bytes(n: number) {
        /* @nesoi:browser ignore-start */
        return crypto.randomBytes(n);
        /* @nesoi:browser ignore-end */
        
        /* @nesoi:browser add
        const QUOTA = 65536;
        const a = new Uint8Array(n);
        for (let i = 0; i < n; i += QUOTA) {
            crypto.getRandomValues(a.subarray(i, i + Math.min(n - i, QUOTA)));
        }
        return a;
        */
    }

}
