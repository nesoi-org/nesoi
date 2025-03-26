import { $Message } from '~/elements/entities/message/message.schema';
import { AnyUsers } from '~/engine/auth/authn';
import { $Dependency } from '~/engine/dependency';

export class $ControllerEndpoint {
    public $t = 'controller.endpoint';
    
    constructor(
        public name: string,
        public alias: string,
        public authn: string[],
        public tags: string[],
        public msg: $Dependency,
        public target: $Dependency
    ) {}
}

export class $ControllerGroup {
    public $t = 'controller.group';
    
    constructor(
        public name: string,
        public alias: string,
        public authn: string[],
        public groups: Record<string, $ControllerGroup> = {},
        public endpoints: Record<string, $ControllerEndpoint> = {},
    ) {}
}

export class $ControllerDomain extends $ControllerGroup {
    public $t = 'controller.domain';
    
    constructor(
        public name: string,
        public alias: string,
        public authn: string[],
        public version: string,
        public groups: Record<string, $ControllerGroup> = {},
        public endpoints: Record<string, $ControllerEndpoint> = {},
    ) {
        super(name, alias, authn,  groups, endpoints);
    }
}

export class $Controller {
    public $t = 'controller' as const;
    public '#authn'!: AnyUsers;
    public '#input'!: $Message;

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public authn: string[],
        public input: $Dependency[],
        public domains: Record<string, $ControllerDomain> = {}
    ) {}
}