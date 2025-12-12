import type { $BlockAuth } from '~/elements/blocks/block.schema';
import type { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import type { $Message } from '~/elements/entities/message/message.schema';

import { $Block } from '~/elements/blocks/block.schema';
import { Tag } from '~/engine/dependency';

/**
 * @category Schemas
 * @subcategory Block
 */
export class $Resource extends $Block {
    public $t = 'resource' as const;
    public '#bucket'!: $Bucket;

    public '#input.query'!: $Message
    public '#input.create'!: $Message
    public '#input.update'!: $Message
    public '#input.delete'!: $Message
    
    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public bucket: Tag,
        public jobs: {
            query?: Tag,
            create?: Tag,
            update?: Tag,
            delete?: Tag
        }
    ) {
        const input: Tag[] = [];
        if (jobs.query) input.push(new Tag(module, 'message', jobs.query.name));
        if (jobs.create) input.push(new Tag(module, 'message', jobs.create.name));
        if (jobs.update) input.push(new Tag(module, 'message', jobs.update.name));
        if (jobs.delete) input.push(new Tag(module, 'message', jobs.delete.name));

        // TODO: Input dependencies

        super(module, name, alias, auth, input, {});
    }
}