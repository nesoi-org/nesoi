import { $Module } from '~/elements';
import { ControllerAdapter } from './adapters/controller_adapter';
import { $Controller } from './controller.schema';

export type ControllerConfig<
    M extends $Module,
    B extends $Controller,
    Providers extends Record<string, any>
> = {
    /** Adapter used by this Controller to communicate with a data source */
    adapter?: (module: M, schema: B, providers: Providers) => ControllerAdapter,
}