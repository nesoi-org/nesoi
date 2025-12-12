/* @nesoi:browser ignore-file */

import type { AnySpace} from '~/engine/space';
import type { Compiler } from './compiler';
import type { ObjTypeAsObj } from '~/engine/util/type';

import fs, { existsSync } from 'fs';
import { BuilderNode, Tag } from '~/engine/dependency';
import { Space } from '~/engine/space';
import { Hash } from '~/engine/util/hash';
import path from 'path';
import type { TagType, AnyElementSchema } from 'index';

export type ProgressiveBuildCache = {
    nesoidir: string,
    // Calculated on save or init
    // Used through the whole compiler
    hash: {
        $: string,
        space: string,
        modules: {
            [name: string]: {
                $: string,
                nodes: {
                    [tag: string]: string
                },
            }
        },
        files: {
            [filepath: string]: string
        }
    },
    // Used on treeshake
    // Updated by treeshake
    files: {
        [filepath: string]: {
            type: TagType[]
            elements: string[]
        }
    },
    // Used on dump
    // Updated by dump
    modules: {
        [name: string]: {
            dependencies: {
                modules: string[]
            }
        }
    },
    types: {
        space: ObjTypeAsObj
        modules: {
            [name:string]: ObjTypeAsObj
        }
        elements: {
            [tag:string]: string
        }
    }
}

export class ProgressiveBuild {
    
    public static cache(compiler: Compiler, $?: { init: boolean }) {
        const path = Space.path(compiler.space, '.nesoi', '.cache');
        if (!existsSync(path)) {
            return this.init(compiler);
        }
        const file = fs.readFileSync(path)
        return JSON.parse(file.toString()) as ProgressiveBuildCache;
    }

    public static async treeshake(cache: ProgressiveBuildCache, filepath: string) {
        const file = cache.files[filepath];

        // Currently, progressive build of constants and externals is
        // not supported, given that the schemas are merged, so checking
        // the hash of a single file is not enough to ensure changes
        if (!file.type.includes('constants') && !file.type.includes('externals')) {
            const hash = await Hash.file(filepath);
            if (hash === cache.hash.files[filepath]) {
                return ProgressiveBuild.nodes(cache, filepath);
            }
        }
    }

    public static empty() {

        const cache: ProgressiveBuildCache = {
            nesoidir: '',
            hash: {
                $: '',
                files: {},
                modules: {},
                space: ''
            },
            files: {},
            modules: {},
            types: {
                space: {},
                modules: {},
                elements: {}
            }
        }

        return cache;

    }

    public static async init(compiler: Compiler) {

        const cache: ProgressiveBuildCache = {
            nesoidir: Space.path(compiler.space, '.nesoi'),
            hash: await ProgressiveBuild.hash(compiler),
            files: {},
            modules: {},
            types: {
                space: {},
                modules: {},
                elements: {}
            }
        }

        return cache;

    }

    public static async save(space: AnySpace, cache: ProgressiveBuildCache, hash?: ProgressiveBuildCache['hash']) {
        
        if (!fs.existsSync(cache.nesoidir)) {
            fs.mkdirSync(cache.nesoidir, { recursive: true });
        }

        cache.hash = hash || cache.hash;

        const cachePath = path.join(cache.nesoidir, '.cache');
        const str = JSON.stringify(cache);
        fs.writeFileSync(cachePath, str);
    }

    public static async hash(compiler: Compiler) {

        const out: ProgressiveBuildCache['hash'] = {
            $: '',
            files: {},
            space: await Hash.file(Space.path(compiler.space, 'nesoi.ts')),
            modules: {}
        };

        // Calculate a hash for each module
        const modules = compiler.tree.allNodesByModule();
        for (const name in modules) {
            out.modules[name] = {
                $: '',
                nodes: {}
            };
            const module = modules[name];
            for (const node of module) {
                if (Array.isArray(node.filepath)) {
                    // Currently, progressive build of constants and externals is
                    // not supported, so these are ignore.
                    continue;
                }
                const hash = await Hash.file(node.filepath);
                out.files[node.filepath] = hash;
                out.modules[name].nodes[node.tag.full] = hash;
            }
            out.modules[name].$ = Hash.merge(out.modules[name].nodes);
        }

        out.$ = Hash.merge({
            __space: out.space,
            ...out.modules
        });

        return out;
    }

    // treeshake

    private static async nodes(cache: ProgressiveBuildCache, filepath: string) {
        const file = cache.files[filepath];
        const schemas = await this.schemas(cache, file);

        return schemas.map(schema => 
            new BuilderNode({
                tag: new Tag(schema.module, schema.$t, schema.name),
                filepath,
                dependencies: [],   
                builder: undefined as any,
                progressive: { schema }
            })
        );
    }

    private static async schemas(cache: ProgressiveBuildCache, file: ProgressiveBuildCache['files'][number]) {
        const schemas: AnyElementSchema[] = [];

        for (const schemaPath of file.elements) {
            const schema = (await import(schemaPath)).default as AnyElementSchema;
            schemas.push(schema);
        }

        return schemas;
    }

}