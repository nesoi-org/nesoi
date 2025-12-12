import type { $BlockAuth, Tag, User, $Message } from 'index';

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

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public input: Tag[],
        public domains: Record<string, $ControllerDomain> = {},
        public topics: Record<string, $ControllerTopic> = {},
    ) {}
}