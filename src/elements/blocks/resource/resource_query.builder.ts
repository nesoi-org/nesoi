import { $Bucket, $Module, $Space } from '~/elements';
import { NQL_AnyQuery, NQL_Query } from '~/elements/entities/bucket/query/nql.schema';
import { $ResourceQueryRoutes } from '../job/internal/resource_job.schema';
import { $BlockAuth } from '../block.schema';

export class ResourceQueryRouteBuilder<
    Space extends $Space,
    Module extends $Module,
    Bucket extends $Bucket
> {

    protected _auth: $BlockAuth[] = [];
    protected _query?: NQL_AnyQuery;
    
    constructor(
        protected _view: string
    ) {}

    public auth<U extends keyof Space['authnUsers']>(
        provider: U,
        resolver?: (user: Space['authnUsers'][U]) => boolean
    ) {
        this._auth ??= [];
        
        // Replace by provider name
        const match = this._auth.findIndex(opt => opt.provider === provider as string);
        if (match >= 0) {
            this._auth.splice(match, 1);
        }

        this._auth.push({
            provider: provider as string,
            resolver
        } as $BlockAuth)
        return this;
    }

    public view<
        ViewName extends keyof Bucket['views'] & string
    >(view: ViewName) {
        this._view = view;
        return this;
    }

    public query(query: NQL_Query<Module, Bucket>) {
        this._query = query as NQL_AnyQuery;
        return this;
    }

    public static build(builder: ResourceQueryRouteBuilder<any, any, any>) {
        const meta: $ResourceQueryRoutes[string] = {
            view: builder._view,
            auth: builder._auth,
            query: builder._query
        };
        return meta;
    }
}

export type ResourceQueryRouteDef<
    Space extends $Space,
    Module extends $Module,
    Bucket extends $Bucket
> = (builder: ResourceQueryRouteBuilder<Space, Module, Bucket>) => ResourceQueryRouteBuilder<Space, Module, Bucket>