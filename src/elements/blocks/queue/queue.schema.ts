import { $Dependency } from '~/engine/dependency';
import { $Block } from '../block.schema';

export class $Queue extends $Block {
    public $t = 'queue' as const;

    public dependencies: $Dependency[] = [];
    
    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public authn: string[],
        public msgs: $Dependency[]
    ) {
        super(module, name, alias, authn, msgs, {})
    }
}