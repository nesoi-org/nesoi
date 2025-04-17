import fs from 'fs';
import crypto from 'crypto';

export class Hash {

    public static file(filepath: string, algorithm: 'sha256'|'sha1'|'md5') {
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

}
