import { $Job, $Module, $Space } from '~/elements';
import { Job } from '~/elements/blocks/job/job';
import { Module } from '~/engine/module';

export class DistributedJob<
    S extends $Space,
    M extends $Module,
    $ extends $Job
> extends Job<S, M, $> {

    constructor(
        module: Module<S, M>,
        public node: string
    ) {
        super(module, {} as any)
    }

}