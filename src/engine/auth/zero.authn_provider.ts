import type { NesoiObjId } from '../data/obj';

import { AuthnProvider } from './authn';

type ZeroUser = {
    id: NesoiObjId,
    name: string
}

/**
 * @category Engine
 * @subcategory Auth
 */
export class ZeroAuthnProvider extends AuthnProvider<ZeroUser, false> {
    eager = false as const;

    authenticate($: { token: string; }) {
        return Promise.resolve({
            user: {
                id: 0,
                name: $.token
            }
        });
    }
}