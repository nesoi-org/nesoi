import type { AnyTrxNode } from '../transaction/trx_node'

export type AuthToken = string
export type AuthRequest<P extends keyof any> = {
    [K in P]?: AuthToken
}

export type AnyAuthnProviders = { [K: string]: AuthProvider<any, any> }
export type AnyUsers = { [K: string]: User }

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