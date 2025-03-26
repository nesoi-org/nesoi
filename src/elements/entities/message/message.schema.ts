import { $MessageTemplate } from './template/message_template.schema';

export class $Message {
    public $t = 'message' as const;
    
    public '#raw': { $: unknown };// typeonly
    public '#parsed': { $: unknown }; // typeonly

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public template: $MessageTemplate
    ) {}
}