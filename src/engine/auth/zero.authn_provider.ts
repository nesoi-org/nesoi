import { NesoiObjId } from '../data/obj';
import { AuthnProvider, AuthnToken } from './authn';

type ZeroUser = {
    id: NesoiObjId,
    name: string
}

export class ZeroAuthnProvider extends AuthnProvider<ZeroUser> {
    async authenticate(_token: AuthnToken) {
        return Promise.resolve({
            id: 0,
            name: 'User Zero'
        });
    }
}