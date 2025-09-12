import { $Module, $Space } from '~/schema';
import { Module } from '../module';
import { AnyTrxNode, TrxNode, TrxNodeStatus } from './trx_node';
import { colored } from '../util/string';
import { anyScopeTag } from '../util/log';
import { AnyTrxEngine, TrxEngineOrigin } from './trx_engine';
import { AnyUsers, AuthRequest } from '../auth/authn';
import { NesoiDatetime } from '../data/datetime';
import { NesoiError } from '../data/error';

/*
    Types
*/

type TrxOrigin = TrxEngineOrigin | `trx:${string}`;
type TrxState = 'open' | 'ok' | 'error'

/*
    Transaction Status
*/

/**
 * @category Engine
 * @subcategory Transaction
 */
export class TrxStatus<Output> {
    constructor (
        public id: string,
        public origin: TrxOrigin,
        public start: NesoiDatetime,
        public end?: NesoiDatetime,
        public state?: TrxState,
        public output?: Output,
        public error?: NesoiError.BaseError,
        public nodes: TrxNodeStatus[] = []
    ) {}

    summary() {
        const state = this.state ? colored(`[${this.state}]`, {
            'open': 'lightblue' as const,
            'ok': 'lightgreen' as const,
            'error': 'lightred' as const
        }[this.state]) : 'unknown';

        let str = `${state} ${this.id} ${anyScopeTag(this.origin)} `;
        str += colored(`[${this.end ? (this.end.epoch - this.start.epoch) : -1}ms]\n`, 'brown')
        function print(nodes: TrxNodeStatus[], l = 1) {
            let str = '';
            nodes.forEach(node => {
                const state = node.state ? colored(`[${node.state}]`, {
                    'open': 'lightblue' as const,
                    'ok': 'lightgreen' as const,
                    'error': 'lightred' as const
                }[node.state] || 'lightred') : 'unknown';
                str += `${'-'.repeat(l)}${state} ${node.id} ${anyScopeTag(node.scope)} ${node.action}`;
                str += colored(` [${node.app}ms]\n`, 'brown')
                str += print(node.nodes, l+1);
            });
            return str;
        }
        return str + print(this.nodes);
    }
}

/**
 * @category Engine
 * @subcategory Transaction
 */
export class Trx<S extends $Space, M extends $Module, AuthUsers extends AnyUsers> {

    private module: Module<S, M>;
    
    public id: string;
    
    private origin: TrxOrigin;
    
    public root: TrxNode<S, M, AuthUsers>;
    public nodes: Record<string, TrxNode<S, M, AuthUsers>>;

    public start: NesoiDatetime = NesoiDatetime.now();
    public end?: NesoiDatetime;
    
    public ctx: Record<string, any> = {};

    constructor(
        public engine: AnyTrxEngine,
        module: Module<S, M>,
        origin: TrxOrigin,
        auth?: {
            tokens: AuthRequest<any>,
            users: AuthUsers,
        },
        id?: string,
        root?: TrxNode<S, M, AuthUsers>,
        nodes?: Record<string, TrxNode<S, M, AuthUsers>>
    ) {
        this.module = module;
        
        this.id = id || (Math.random() + 1).toString(36).substring(7);
        
        this.origin = origin;

        this.root = root || new TrxNode('root', this, undefined, module, auth, id);
        this.nodes = nodes || {};
    }

    addNode(node: TrxNode<S, M, AuthUsers>) {
        const nodeId = (node as any).id as TrxNode<S, M, AuthUsers>['id'];
        this.nodes[nodeId] = node;
    }

    status(): TrxStatus<any> {
        const state = (this.root as any).state as AnyTrxNode['state'];
        const output = (this.root as any).output as AnyTrxNode['output'];
        const error = (this.root as any).error as AnyTrxNode['error'];
        return new TrxStatus(
            this.id,
            this.origin,
            this.start,
            this.end,
            state,
            output,
            error,
            this.root.status().nodes
        );
    }

    /**
     * Context Manipulation
     * 
     * This should only be used by custom adapters to inject/read custom things
     * to the transaction. Elements should not modify the transaction.
     */
    public static get<T>(node: AnyTrxNode, key: string): T {
        const trx = (node as any).trx as AnyTrxNode['trx'];
        return trx.ctx[key];
    }

    /**
     * Context Manipulation
     * 
     * This should only be used by custom adapters to inject/read custom things
     * to the transaction. Elements should not modify the transaction.
     */
    public static set(node: AnyTrxNode, key: string, value: any) {
        const trx = (node as any).trx as AnyTrxNode['trx'];
        trx.ctx[key] = value;
        return trx;
    }

    //
    public static onFinish(trx: AnyTrx) {
        trx.end = NesoiDatetime.now();
    }
}

export type AnyTrx = Trx<any, any, any>