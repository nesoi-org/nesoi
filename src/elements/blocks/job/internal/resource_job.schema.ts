import { $JobMethod } from '../job.schema';

/**
 * @category Schemas
 * @subcategory Block
 */
export class $ResourceJobScope {  
    constructor(
        public module: string,
        public resource: string,
        public bucket: string,
        public method: 'view' | 'query' | 'create' | 'update' | 'delete',
        public prepareMethod: $JobMethod<any, any, any, any>,
        public execMethod?: $JobMethod<any, any, any, any>,
        public afterMethod?: $JobMethod<any, any, any, any>,
    ) {}
}