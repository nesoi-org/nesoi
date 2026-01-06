;

/**
 * @category Schemas
 * @subcategory Block
 */
export class $Block {
    public $t: $BlockType = 'block' as any;
    public '#auth'!: {};
    public '#input'!: $Message;
    public '#output'!: unknown;

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public auth: $BlockAuth[],
        public input: Tag[],
        public output?: $BlockOutput
    ) {}
}
