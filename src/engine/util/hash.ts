import fs from 'fs';

/* @nesoi:browser ignore-start */
import crypto from 'crypto';
/* @nesoi:browser ignore-end */

/* @nesoi:browser add
const crypto = (window.crypto || window.msCrypto);
*/

export class Hash {

    public static file(filepath: string, algorithm: 'sha256'|'sha1'|'md5' = 'sha256') {
        return new Promise<string>(resolve => {
            const fd = fs.createReadStream(filepath);
            const hash = crypto.createHash(algorithm);
            hash.setEncoding('hex');
            fd.on('end', function() {
                hash.end();
                resolve(hash.read());
            });
            fd.pipe(hash);
        })
    }

    public static string(payload: string, algorithm: 'sha256'|'sha1'|'md5' = 'sha256') {
        const hash = crypto.createHash(algorithm);
        hash.update(payload);
        return hash.digest('hex');
    }

    public static merge(tree: Record<string, string>, algorithm: 'sha256'|'sha1'|'md5' = 'sha256') {
        const str = Object.entries(tree)
            .map((key, value) => `${key}:${value}`)
            .sort()
            .join('\n');
        return crypto.createHash(algorithm)
            .update(str)
            .digest('hex')
    }

}
