import crypto from 'crypto';

export class Random {

    public static uuid() {
        return crypto.randomUUID();
    }

    public static bytes(n: number) {
        return crypto.randomBytes(n);
    }

}
