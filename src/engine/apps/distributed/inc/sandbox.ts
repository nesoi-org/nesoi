import { INCServer } from './inc.server';
import { INCClient } from './inc.client';
import { Log } from '~/engine/util/log';

Log.level = 'debug';

async function main () {

    const server = new INCServer({
        name: 'mandala-alpha-1',
        port: 2222
    });
    await server.start();
    
    const client = new INCClient({
        name: 'mandala-beta-2',
        server: {
            host: 'localhost',
            port: 2222
        }
    })
    await client.start();

    await client.send('Oi do cliente!')
    await server.send(Object.keys(server.clients)[0], 'Oi do servidor!')
}
main();