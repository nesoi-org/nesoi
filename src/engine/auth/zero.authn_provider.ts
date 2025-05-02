import { NesoiObjId } from '../data/obj';
import { AuthnProvider } from './authn';

type ZeroUser = {
    id: NesoiObjId,
    name: string
}

/**
 * @category Engine
 * @subcategory Auth
 */
export class ZeroAuthnProvider extends AuthnProvider<ZeroUser> {
    authenticate($: { token: string; }) {
        return Promise.resolve({
            id: 0,
            name: $.token
        });
    }
}