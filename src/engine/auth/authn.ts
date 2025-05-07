import { NesoiObjId } from '../data/obj';
import { AnyTrxNode } from '../transaction/trx_node';

/*
    Types
*/

export type User = {
    id: NesoiObjId,
    [x: string]: any
}

export type AuthnToken = string

export type AuthnRequest<P extends keyof any> = {
    [K in P]?: AuthnToken
}

/*
    Provider
*/

/**
 * @category Engine
 * @subcategory Auth
 */
export abstract class AuthnProvider<
    U extends User
> {
    /**
     * - If `true`, this provider is run for all transactions, regardless
     * of a token being sent on the authentication request.
     * - If `false`, the `$.token` is always defined.
     */
    abstract eager: boolean

    abstract authenticate($: {
        trx: AnyTrxNode,
        token?: AuthnToken
    }): Promise<{
        token: AuthnToken,
        user: U
    }>
}

/*
    AnyTypes
*/

export type AnyAuthnProviders = { [K: string]: AuthnProvider<any> }
export type AnyUsers = { [K: string]: User }