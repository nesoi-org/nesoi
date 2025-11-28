import type { BrowserBundler } from '../browser.bundler';

import * as fs from 'fs';
import { Log } from '~/engine/util/log';
import { Path } from '~/engine/util/path';

/**
 * [Browser Compiler Stage #8]
 * Replace 'nesoi' imports by '@nesoi/for-browser'
 * 
 * @category Monolyth Compiler
 * @subcategory Stages
 */
export class ReplaceNesoiForBrowserStage {
    
    public constructor(
        private bundler: BrowserBundler
    ) {}

    public async run() {
        Log.info('compiler', 'browser', 'Replacing \'nesoi\' imports by \'@nesoi/for-browser\'')

        const { dirs } = this.bundler;

        const files = Path.allFiles(dirs.build).map(path => ({
            path,
            content: fs.readFileSync(path).toString()
        }));
    
        // import ... from 'nesoi/...
        for (const file of files) {
            if (file.content.match(/import.*from ['"]nesoi\//)) {
                file.content = file.content.replace(/(import.*from ['"])nesoi\//g, '$1@nesoi/for-browser/');
                fs.writeFileSync(file.path, file.content);
            }
        }

        // await import('nesoi/...
        for (const file of files) {
            if (file.content.match(/await import\(['"]nesoi\//)) {
                file.content = file.content.replace(/(await import\(['"])nesoi\//g, '$1@nesoi/for-browser/');
                fs.writeFileSync(file.path, file.content);
            }
        }
    }
    
}