import { Tag } from '~/engine/dependency';
/**
 * @category Schemas
 * @subcategory Edge
 */
export class $Externals { 
    public $t = 'externals' as const;
    
    public module = this.name
    constructor(
        public name: string,
        public values: Record<string, Tag> = {},
        public enums: Record<string, Tag> = {},
        public buckets: Record<string, Tag> = {},
        public messages: Record<string, Tag> = {},
        public jobs: Record<string, Tag> = {},
        public machines: Record<string, Tag> = {}
    ) {}

    public static merge(to: $Externals, from: $Externals) {
        Object.assign(to.values, from.values);
        Object.assign(to.enums, from.enums);
        Object.assign(to.buckets, from.buckets);
        Object.assign(to.messages, from.messages);
        Object.assign(to.jobs, from.jobs);
        Object.assign(to.machines, from.machines);
    }
}
