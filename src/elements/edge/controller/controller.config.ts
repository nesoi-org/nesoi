import type { $Module, $Controller } from 'index';
import type { ControllerAdapter } from './adapters/controller_adapter';

export type ControllerConfig<
    M extends $Module,
    B extends $Controller,
    Services extends Record<string, any>
> = {
    /** Adapter used by this Controller to communicate with a data source */
    adapter?: (module: M, schema: B, services: Services) => ControllerAdapter,
}