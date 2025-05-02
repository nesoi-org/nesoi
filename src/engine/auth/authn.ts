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
    abstract authenticate($: {
        trx: AnyTrxNode,
        token: AuthnToken
    }): Promise<U>
}

/*
    AnyTypes
*/

export type AnyAuthnProviders = { [K: string]: AuthnProvider<any> }
export type AnyUsers = { [K: string]: User }