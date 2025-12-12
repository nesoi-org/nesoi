/*
    Provider
*/

/**
 * @category Engine
 * @subcategory Auth
 */
export abstract class AuthProvider<
    U extends User,
    Eager extends boolean
> {
    /**
     * - If `true`, this provider is run at the start of all transactions.
     * - If `false`, it only runs once an element requires it, and if a token is present.
     */
    abstract eager: Eager

    abstract authenticate($: {
        trx: AnyTrxNode,
        token: Eager extends true ? (AuthToken|undefined) : AuthToken
    }): Promise<{
        token?: string,
        user: U
    }>
}