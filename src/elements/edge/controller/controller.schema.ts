
export type ControllerEndpointPath = ($ControllerDomain | $ControllerGroup | $ControllerEndpoint)[]

/**
 * @category Schemas
 * @subcategory Edge
 */
export class $ControllerEndpoint {
    public $t = 'controller.endpoint' as const;
    
    constructor(
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public tags: string[],
        public msg: Tag,
        public target: Tag,
        public implicit?: Record<string, any>,
        public idempotent = false
    ) {}
}

/**
 * @category Schemas
 * @subcategory Edge
 */
export class $ControllerTopic {
    public $t = 'controller.topic' as const;
    
    constructor(
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public tags: string[],
        public msgs: Tag[],
        public topic: Tag
    ) {}
}

/**
 * @category Schemas
 * @subcategory Edge
 */
export class $ControllerGroup {
    public $t = 'controller.group' as 'controller.group'|'controller.domain';
    
    constructor(
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public groups: Record<string, $ControllerGroup> = {},
        public endpoints: Record<string, $ControllerEndpoint> = {},
    ) {}
}

/**
 * @category Schemas
 * @subcategory Edge
 */
export class $ControllerDomain extends $ControllerGroup {
    public $t = 'controller.domain' as const;
    
    constructor(
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public version: string,
        public groups: Record<string, $ControllerGroup> = {},
        public endpoints: Record<string, $ControllerEndpoint> = {},
    ) {
        super(name, alias, auth, groups, endpoints);
    }
}

/**
 * @category Schemas
 * @subcategory Edge
 */
export class $Controller {
    public $t = 'controller' as const;
    public '#auth'!: Record<string, User>;
    public '#input'!: $Message;
    public '#path'!: Record<string, $Message>;

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public input: Tag[],
        public domains: Record<string, $ControllerDomain> = {},
        public topics: Record<string, $ControllerTopic> = {},
    ) {}

    public static endpoints(schema: $Controller) {
        const endpoints: {
            [path_str: string] : {
                path: ControllerEndpointPath,
                endpoint: $ControllerEndpoint
            }
        } = {}

        const _endpoint = (endpoint: $ControllerEndpoint, path: ControllerEndpointPath) => {
            const path_str = this.makePath(schema, path, endpoint);
            endpoints[path_str] = {
                path,
                endpoint
            };
        }
        const _group = (group: $ControllerGroup, path: ControllerEndpointPath) => {
            for (const g in group.groups) {
                _group(group.groups[g], [...path, group]);
            }
            for (const e in group.endpoints) {
                _endpoint(group.endpoints[e], [...path, group]);
            }
        }
        const _domain = (domain: $ControllerDomain) => {
            for (const g in domain.groups) {
                _group(domain.groups[g], [domain]);
            }
            for (const e in domain.endpoints) {
                _endpoint(domain.endpoints[e], [domain]);
            }
        }
        for (const d in schema.domains) {
            _domain(schema.domains[d])
        }

        return endpoints;
    }

    public static makePath(schema: $Controller, path: ControllerEndpointPath, endpoint: $ControllerEndpoint) {
        const domain = path[0] as $ControllerDomain;
        const root = `${domain.name ?? schema.name}@${domain.version}`;

        const list = [
            root,
            ...path.slice(1).map(node => node.name),
            endpoint.name
        ];
        return list.join('/');
    }
}