export default class _Promise {

    public static async solve<T>(result: T | Promise<T>): Promise<T> {

        if (
            typeof result === 'object'
            && 'then' in (result as Promise<T>)
            && typeof (result as Promise<T>).then === 'function'
        ) {
            return result as Promise<T>;
        }

        return new Promise(resolve => { resolve(result); });

    }

}