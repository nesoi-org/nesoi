import { $BlockAuth } from '~/elements/blocks/block.schema';
import { $Message } from '~/elements/entities/message/message.schema';
import { AnyUsers } from '~/engine/auth/authn';
import { $Dependency } from '~/engine/dependency';

/**
 * @category Schemas
 * @subcategory Edge
 */
export class $ControllerEndpoint {
    public $t = 'controller.endpoint';
    
    constructor(
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public tags: string[],
        public msg: $Dependency,
        public target: $Dependency,
        public implicit?: Record<string, any>
    ) {}
}

/**
 * @category Schemas
 * @subcategory Edge
 */
export class $ControllerTopic {
    public $t = 'controller.topic';
    
    constructor(
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public tags: string[],
        public msgs: $Dependency[],
        public topic: $Dependency
    ) {}
}

/**
 * @category Schemas
 * @subcategory Edge
 */
export class $ControllerGroup {
    public $t = 'controller.group';
    
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
    public $t = 'controller.domain';
    
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
    public '#authn'!: AnyUsers;
    public '#input'!: $Message;

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public input: $Dependency[],
        public domains: Record<string, $ControllerDomain> = {},
        public topics: Record<string, $ControllerTopic> = {},
    ) {}
}