

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
        public routes?: $ResourceQueryRoutes
    ) {}
}

/**
 * @category Schemas
 * @subcategory Block
 */
export type $ResourceQueryRoutes = {  
    [route: string]: {
        view: string
        auth: $BlockAuth[]
        query?: NQL_AnyQuery
        serialize: boolean
    }
}