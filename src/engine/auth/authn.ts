import { NesoiObjId } from '../data/obj';

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

export abstract class AuthnProvider<
    U extends User
> {
    abstract authenticate(token: AuthnToken): Promise<U>
}

/*
    AnyTypes
*/

export type AnyAuthnProviders = { [K: string]: AuthnProvider<any> }
export type AnyUsers = { [K: string]: User }