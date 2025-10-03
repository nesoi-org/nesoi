import * as net from 'net';
import { Log } from '~/engine/util/log';
import { Random } from '~/engine/util/random';

export type INCServerConfig = {
    name: string
    port: number
    maxConnections?: number
}

export class INCServer {

    private server: net.Server;
    public clients: Record<string, net.Socket> = {};

    constructor(
        public config: INCServerConfig
    ) {
        this.server = net.createServer();
        this.server.on('close', this.onClose.bind(this));
        this.server.on('connection', this.onConnection.bind(this));
        this.server.maxConnections = this.config.maxConnections || 1;
    }

    public start() {
        Log.info('inc.server', this.config.name, 'Starting...')
        return new Promise<void>((resolve, reject) => {
            this.server.listen(this.config.port);
            
            const errorFn = (error: Error) => {
                Log.error('inc.server', this.config.name, error.toString(), error);
                reject(error)
            }
            this.server.on('error', errorFn);
            this.server.on('listening', () => {
                Log.info('inc.server', this.config.name, `Listening on port ${this.config.port}`)
                this.server.off('error', errorFn);
                this.server.on('error', this.onError.bind(this));
                resolve()
            });
            
            if (!this.server.listening) {
                throw new Error('Failed to start INC server');
            }
        })
    }

    public stop() {
        Log.info('inc.server', this.config.name, 'Stop')
        return new Promise<void>((resolve) => {
            this.server.close(() => {
                resolve();
            });
        })
    }

    public send(client: string, data: string | Uint8Array) {
        Log.debug('inc.server', this.config.name, 'Sending data', {
            data
        })
        return new Promise<void>((resolve, reject) => {
            this.clients[client].write(data, error => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        })
    }

    // Utils
    private getClientCount() {
        return new Promise((resolve, reject) => {
            this.server.getConnections(function(error,count){
                if (error) {
                    reject(error);
                }
                resolve(count);
            });
        })
    }

    // Callbacks

    private onError(error: Error){
        Log.error('inc.server', this.config.name, error.toString(), error);
    }

    private onClose() {
        Log.warn('inc.server', this.config.name, 'Closed')
    }

    private async onConnection(socket: net.Socket & { id: string }) {

        const id = Random.uuid();
        socket.id = id;
        this.clients[id] = socket;

        const serverAddress = this.server.address() as net.AddressInfo;
        Log.debug('inc.server', this.config.name, 'New client connected', {
            id,
            server: `${serverAddress.address}:${serverAddress.port}`,
            client: `${socket.remoteAddress}:${socket.remotePort}`,
            clientCount: await this.getClientCount()
        })
        
        socket.setEncoding('utf8');
        socket.setTimeout(1000*60*15); // 15 mins
    
        socket.on('data', (data) => {
            Log.debug('inc.server', this.config.name, 'Data received', {
                client: socket.id,
                data
            })    
        });
    
        socket.on('drain',function(){
            socket.resume();
        });
    
        socket.on('error',(error) => {
            delete this.clients[id];
            Log.error('inc.server', this.config.name, 'Client error', {
                client: socket.id,
                error
            })
        });
    
        socket.on('timeout',() => {
            delete this.clients[id];
            Log.warn('inc.server', this.config.name, 'Client timed-out', {
                client: socket.id
            })
            socket.end('{"$":"__inc.timed_out"}');
        });
    
        socket.on('end',(data: any) => {
            delete this.clients[id];
            Log.debug('inc.server', this.config.name, 'Client disconnected', {
                client: socket.id,
                bytes_read: socket.bytesRead,
                bytes_written: socket.bytesWritten,
                data
            })
        });
    
        socket.on('close',(error) => {
            delete this.clients[id];
            if (error) {
                Log.error('inc.server', this.config.name, 'Client disconnected with error', {
                    client: socket.id,
                    bytes_read: socket.bytesRead,
                    bytes_written: socket.bytesWritten,
                    error
                })
                return
            }
            Log.debug('inc.server', this.config.name, 'Client disconnected', {
                client: socket.id,
                bytes_read: socket.bytesRead,
                bytes_written: socket.bytesWritten
            })
        });
    }
}