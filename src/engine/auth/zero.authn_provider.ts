import type { NesoiObjId } from '../data/obj';

import { AuthProvider } from './authn';

type ZeroUser = {
    id: NesoiObjId,
    name: string
}

/**
 * @category Engine
 * @subcategory Auth
 */
export class ZeroAuthnProvider extends AuthProvider<ZeroUser, false> {
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