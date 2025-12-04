import * as fs from 'fs';
import path from 'path';
import { Compiler } from '~/compiler/compiler';
import { Random } from '~/engine/util/random';

export class CompilerTest {

    private path: {
        nesoi: string
        space: string
        nesoiFile: string
        module: string
    }

    constructor() {
        const nesoiPath = path.join(process.cwd(), 'build');

        const spacePath = path.join(process.cwd(), 'tmp','test', Random.uuid());
        fs.mkdirSync(spacePath, { recursive: true });

        const nesoiFilePath = path.join(spacePath, 'nesoi.ts');
        const nesoiFile = ''
        + 'import { Space } from \'../../../build/lib/engine/space\'\n'
        + '\n'
        + 'const Nesoi = new Space<any>(__dirname)\n'
        + '  .name(\'Test\')\n'
        + '\n'
        + 'export default Nesoi\n';
        fs.writeFileSync(nesoiFilePath, nesoiFile);

        const modulePath = path.join(spacePath, 'modules', 'core')
        fs.mkdirSync(modulePath, { recursive: true });

        this.path = {
            nesoi: nesoiPath,
            space: spacePath,
            nesoiFile: nesoiFilePath,
            module: modulePath
        }
    }

    cleanup() {
        fs.rmSync(this.path.space, { force: true, recursive: true });
    }

    addMessage(template: string, name = 'test') {
        const msgPath = path.join(this.path.module, `${name}.message.ts`);
        const msg = ''
        + 'import nesoi from \'../../nesoi\'\n'
        + '\n'
        + `export default nesoi.message('core::${name}')\n`
        + '  .template($ => ({\n'
        + template
        + '  }));'
        fs.writeFileSync(msgPath, msg);
    }

    addJob(def: string, name = 'test', plus?: {
        prepend?: string,
    }) {
        const msgPath = path.join(this.path.module, `${name}.job.ts`);
        const msg = ''
        + 'import nesoi from \'../../nesoi\'\n'
        + '\n'
        + (plus?.prepend ?? '')
        + '\n'
        + `export default nesoi.job('core::${name}')\n`
        + def
        fs.writeFileSync(msgPath, msg);
    }

    addBucket(def: string, name = 'test') {
        const msgPath = path.join(this.path.module, `${name}.bucket.ts`);
        const msg = ''
        + 'import nesoi from \'../../nesoi\'\n'
        + '\n'
        + `export default nesoi.bucket('core::${name}')\n`
        + def
        fs.writeFileSync(msgPath, msg);
    }

    addResource(def: string, name = 'test') {
        const msgPath = path.join(this.path.module, `${name}.resource.ts`);
        const msg = ''
        + 'import nesoi from \'../../nesoi\'\n'
        + '\n'
        + `export default nesoi.resource('core::${name}')\n`
        + def
        fs.writeFileSync(msgPath, msg);
    }

    async compile() {
        const Nesoi = await import(this.path.nesoiFile).then(i => i.default);
        await new Compiler(
            Nesoi,
            {
                nesoiPath: this.path.nesoi
            }
        ).run();
    }

    get schema_file() {
        return {
            message: (name: string = 'test') => {
                const msgPath = path.join(this.path.space, '.nesoi', 'core', `message__${name}.ts`);
                return fs.readFileSync(msgPath).toString();
            },
            job: (name: string = 'test') => {
                const msgPath = path.join(this.path.space, '.nesoi', 'core', `job__${name}.ts`);
                return fs.readFileSync(msgPath).toString();
            },
            bucket: (name: string = 'test') => {
                const msgPath = path.join(this.path.space, '.nesoi', 'core', `bucket__${name}.ts`);
                return fs.readFileSync(msgPath).toString();
            },
            resource: (name: string = 'test') => {
                const msgPath = path.join(this.path.space, '.nesoi', 'core', `resource__${name}.ts`);
                return fs.readFileSync(msgPath).toString();
            }
        }
    }

    get schema() {
        return {
            message: async (name: string = 'test') => {
                const msgPath = path.join(this.path.space, '.nesoi', 'core', `message__${name}.ts`);
                try {
                    const r = await import(msgPath)
                    return r.default;
                }
                catch (e) {
                    console.error(e);
                    throw e;
                }
            },
            job: async (name: string = 'test') => {
                const jobPath = path.join(this.path.space, '.nesoi', 'core', `job__${name}.ts`);
                try {
                    const r = await import(jobPath)
                    return r.default;
                }
                catch (e) {
                    console.error(e);
                    throw e;
                }
            },
            bucket: async (name: string = 'test') => {
                const bucketPath = path.join(this.path.space, '.nesoi', 'core', `bucket__${name}.ts`);
                try {
                    const r = await import(bucketPath)
                    return r.default;
                }
                catch (e) {
                    console.error(e);
                    throw e;
                }
            },
            resource: async (name: string = 'test') => {
                const resourcePath = path.join(this.path.space, '.nesoi', 'core', `resource__${name}.ts`);
                try {
                    const r = await import(resourcePath)
                    return r.default;
                }
                catch (e) {
                    console.error(e);
                    throw e;
                }
            }
        }
    }

}