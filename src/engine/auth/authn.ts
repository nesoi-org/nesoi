import type { NesoiObjId } from '../data/obj';
import type { AnyTrxNode } from '../transaction/trx_node';

/*
    Not authentication
*/
export type AuthToken = string
export type AuthRequest<P extends keyof any> = {
    [K in P]?: AuthToken
}

/*
    Types
*/

export type User = {
    id: NesoiObjId,
    [x: string]: any
}

/*
    Provider
*/

/**
 * @category Engine
 * @subcategory Auth
 */
export abstract class AuthnProvider<
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

/*
    AnyTypes
*/

export type AnyAuthnProviders = { [K: string]: AuthnProvider<any, any> }
export type AnyUsers = { [K: string]: User }