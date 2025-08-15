// TODO: Jest breaks with crypto types.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck

import crypto from 'crypto';

export class NesoiCrypto {

    public static C = {
        
        /**
         * NIST recommends 96 bits or 12 bytes IV for GCM
         * to promote interoperability, efficiency, and
         * simplicity of design
         */
        iv_bytes: 12,

        /**
         * Note: 256 (in algorithm name) is key size. 
         * Block size for AES is always 128
         */
        key_bytes: 32,

        /**
         * To prevent rainbow table attacks
         * */
        salt_bytes: 16
    }

    /**
     * 
     * @param {Buffer} password - The password to be used for generating key
     * 
     */
    public static getKeyFromPassword(password: string, salt: string) {
        const buffer = crypto.scryptSync(password, salt, this.C.key_bytes);
        const str = buffer.toString();
        buffer.fill(0);
        return str;
    }

    /**
     * 
     * @param {string} payload - The clear text message to be encrypted
     * @param {string} key - The key to be used for encryption
     */
    public static async encrypt(value: any, key: string) {

        const iv = crypto.randomBytes(this.C.iv_bytes);

        const aes_key = await crypto.subtle.importKey(
            'raw', Buffer.from(key),
            'AES-GCM',
            true, ['encrypt', 'decrypt']
        );
        const encrypted = await crypto.subtle.encrypt({
            name: 'AES-GCM',
            iv,
            tagLength: 128,
        }, aes_key, Buffer.from(JSON.stringify(value)));

        return Buffer.concat([Buffer.from(iv), Buffer.from(encrypted)]).toString('base64');
    }

    /**
     * 
     * @param {Buffer} ciphertext - Cipher text
     * @param {Buffer} key - The key to be used for decryption
     * 
     * The caller of this function has the responsibility to clear 
     * the Buffer after the decryption to prevent the message text 
     * and the key from lingering in the memory
     */
    public static async decrypt (ciphertext: string, key: string) {

        const buffer = Uint8Array.from(Buffer.from(ciphertext, 'base64'));

        const iv = buffer.slice(0, this.C.iv_bytes);
        const payload = buffer.slice(this.C.iv_bytes);
        
        const aes_key = await crypto.subtle.importKey(
            'raw', Buffer.from(key),
            'AES-GCM',
            true, ['encrypt', 'decrypt']
        );
        const decrypted = await crypto.subtle.decrypt({
            name: 'AES-GCM',
            iv: Buffer.from(iv),
            tagLength: 128
        }, aes_key, Buffer.from(payload));

        const decoded = Buffer.from(decrypted).toString('utf8')
        
        return JSON.parse(decoded);
    }

    public static createHmac(text: string, sigKey: string) {
        return crypto.createHmac('sha1', sigKey)
            .update(text)
            .digest('hex')
    }

}


