import { AnyModule } from '../module';

/**
 * Service
 */

type OptionalFn<T> = (T extends undefined ? [] : never) | [cfg: () => T]

export abstract class Service<out Name extends string, Config = never> {
    /**
     * This property MUST be set on the implementation class.
     */
    public static defaultName: string;

    public name: Name
    private configFn: () => Config
    public config!: Config
    public libPaths?: string[]

    abstract up($: { modules: Record<string, AnyModule> }): void | Promise<void>
    abstract down(): void | Promise<void>
    
    public constructor(...cfg: OptionalFn<Config>);
    public constructor(name: Name, ...cfg: OptionalFn<Config>);
    public constructor(arg1?: string|(() => Config), arg2?: () => Config) {
        if (typeof arg1 === 'string') {
            this.name = arg1 as any;
        }
        else {
            this.name = (this.constructor as typeof Service).defaultName as any;
        }
        this.configFn = arg2 || (arg1 as () => Config);
    }

}
export type AnyService = Service<any, any>

export interface IService {
    name: string
    libPaths?: string[]
    up(this: IService, $: { modules: Record<string, AnyModule> }): void | Promise<void>
    down(this: IService): void | Promise<void>
}