// TODO: Jest breaks with crypto types.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck

import crypto from 'crypto';

export class Crypto {


    public static DEFAULTS = {
        
        algorithm: 'aes-256',

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
     * To prevent rainbow table attacks
     * */
    public static getIV() {
        return crypto.randomBytes(this.DEFAULTS.iv_bytes)
    }

    /**
     * To prevent rainbow table attacks
     * */
    public static getSalt() {
        return crypto.randomBytes(this.DEFAULTS.salt_bytes)
    }

    /**
     * 
     * @param {Buffer} password - The password to be used for generating key
     * 
     */
    public static getKeyFromPassword(password: string, salt: string) {
        const buffer = crypto.scryptSync(password, salt, this.DEFAULTS.key_bytes);
        const str = buffer.toString();
        buffer.fill(0);
        return str;
    }

    /**
     * 
     * @param {string} payload - The clear text message to be encrypted
     * @param {string} key - The key to be used for encryption
     */
    public static encrypt(value: any, key: string) {
        const payload = JSON.stringify(value);

        const iv = this.getIV();
        const cipher = crypto.createCipheriv(this.DEFAULTS.algorithm, key, iv);
        let encrypted = cipher.update(payload);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        const buffer = Buffer.concat([iv as Buffer, encrypted]);
        const str = buffer.toString();
        
        buffer.fill(0);
        return str;
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
    public static decrypt (ciphertext: string, key: string) {
        const iv = ciphertext.slice(0, 12);
        const encryptedMessage = ciphertext.slice(12, -16);
        const decipher = crypto.createDecipheriv(this.DEFAULTS.algorithm, key, iv);

        const payload = decipher.update(encryptedMessage, 'utf8');
        
        const buffer = Buffer.concat([payload, decipher.final()]);
        const str = buffer.toString();
        
        buffer.fill(0);

        return JSON.parse(str);
    }

}


