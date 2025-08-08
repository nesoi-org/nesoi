import * as net from 'net';
import { Log } from '~/engine/util/log';

export type INCClientConfig = {
    name: string,
    server: {
        host: string
        port: number
    }
}

export class INCClient {

    private client: net.Socket;

    constructor(
        public config: INCClientConfig
    ) {
        this.client  = new net.Socket();
        this.client.setEncoding('utf8');

        this.client.on('data', this.onData.bind(this));
    }
    
    public start() {
        Log.info('inc.client', this.config.name, 'Starting...')
        return new Promise<void>((resolve, reject) => {
            this.client.connect({
                host: this.config.server.host,
                port: this.config.server.port
            });

            const errorFn = (error: Error) => {
                Log.error('inc.server', this.config.name, error.toString(), error);
                reject(error)
            }
            this.client.on('error', errorFn);
            this.client.on('connect', () => {
                const address = this.client.address() as net.AddressInfo;
                Log.debug('inc.client', this.config.name, 'Connected', {
                    server: `${this.client.remoteAddress}:${this.client.remotePort}`,
                    client: `${address.address}:${address.port}`
                })    
                this.client.off('error', errorFn);
                this.client.on('error', this.onError.bind(this));
                resolve();
            });
        })
    }

    public stop() {
        Log.info('inc.client', this.config.name, 'Stop')
        return new Promise<void>((resolve) => {
            this.client.end('Bye bye server', () => {
                resolve();
            });
        })
    }

    public send(data: string | Buffer) {
        Log.debug('inc.client', this.config.name, 'Sending data', {
            data
        })
        return new Promise<void>((resolve, reject) => {
            this.client.write(data, error => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        })
    }

    // Callbacks
        
    private onError(error: any) {
        Log.error('inc.client', this.config.name, error.toString(), {
            error
        })
    }

    private onData(data: any) {
        Log.debug('inc.client', this.config.name, 'Data received', {
            data
        })
    }
}