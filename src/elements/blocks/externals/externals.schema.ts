import { $Dependency } from '~/engine/dependency';
export class $Externals { 
    public $t = 'externals' as const;
    
    public module = this.name
    constructor(
        public name: string,
        public buckets: Record<string, $Dependency> = {},
        public jobs: Record<string, $Dependency> = {},
        public machines: Record<string, $Dependency> = {}
    ) {}

    public static merge(to: $Externals, from: $Externals) {
        Object.assign(to.buckets, from.buckets);
        Object.assign(to.jobs, from.jobs);
        Object.assign(to.machines, from.machines);
    }
}
