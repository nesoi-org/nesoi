import { ControllerAdapter } from './adapters/controller_adapter';
import { $Controller } from './controller.schema';

export type ControllerConfig<
    B extends $Controller,
    Providers extends Record<string, any>
> = {
    /** Adapter used by this Controller to communicate with a data source */
    adapter?: (schema: B, providers: Providers) => ControllerAdapter,
}