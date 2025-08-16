import Console from '../src/engine/util/console'
import Shell from '../src/engine/util/shell'
import { Path } from '../src/engine/util/path';
import File from './util/file'
import * as fs from 'fs';
import * as path from 'path';

/**
 * [ bundle ]
 * This script is run when building Nesoi for export.
 */

Console.header('Bundle for Browsers')

async function main() {
    
    Console.step('(Step 1) Clean build folder')
    fs.rmSync('build_browser', { recursive: true, force: true });

    Console.step('(Step 2) Transpile TypeScript source files')
    await Shell.cmd('.', 'npm run build:browser')

    Console.step('(Step 3) Rename "src" folder to "lib"')
    const oldLibPath = path.resolve('.', 'build_browser', 'src');
    const newLibPath = path.resolve('.', 'build_browser', 'lib');
    fs.renameSync(oldLibPath, newLibPath);

    Console.step('(Step 4) Replace "src" by "lib" on tools')
    const compileToolPath = path.resolve('.', 'build_browser', 'tools', 'compile.js');
    File.replaceInContent(compileToolPath, /require\("\.\.\/src\//g, 'require("../lib/');
    const dotenvToolPath = path.resolve('.', 'build_browser', 'tools', 'dotenv.js');
    File.replaceInContent(dotenvToolPath, /require\("\.\.\/src\//g, 'require("../lib/');
    const joaquinMockToolPath = path.resolve('.', 'build_browser', 'tools', 'joaquin', 'mock.js');
    File.replaceInContent(joaquinMockToolPath, /require\("\.\.\/\.\.\/src\//g, 'require("../../lib/');
    const joaquinMockToolTypePath = path.resolve('.', 'build_browser', 'tools', 'joaquin', 'mock.d.ts');
    File.replaceInContent(joaquinMockToolTypePath, /from "\.\.\/\.\.\/src\//g, 'from "../../lib/');

    // Console.step('(Step 5) Run Syntax Typing Tests')
    // await Shell.cmd('.', 'npx tsd')

    // Console.step('(Step 6) Run Unit Tests')
    // await Shell.cmd('.', 'npx jest test/engine test/elements --verbose')

    // Console.step('(Step 7) Run Compiler Unit Tests')
    // await Shell.cmd('.', 'npx jest test/compiler')

    const buildPath = path.resolve('.', 'build_browser');
    
    Console.step('(Step 8) Remove all non-browser code')
    const files = Path.allFiles(buildPath).map(path => ({
        path,
        content: fs.readFileSync(path).toString()
    }));

    // ignore-file
    for (const file of files) {
        if (file.content.includes('/* @nesoi:browser ignore-file */')) {
            fs.rmSync(file.path);
            fs.rmSync(file.path.replace(/\.js$/, '.d.ts'));
        }
    }
    // ignore-start / ignore-end
    for (const file of files) {
        // break;
        if (file.content.includes('/* @nesoi:browser ignore-start */')) {
            // if (file.path.includes('treeshake')) console.log(file.content);
            file.content = file.content.replace(/\/\* @nesoi:browser ignore-start \*\/(.*?)\/\* @nesoi:browser ignore-end \*\//gs,'')
            // if (file.path.includes('treeshake')) console.log(file.content);
            fs.writeFileSync(file.path, file.content);
        }
    }
    // add
    for (const file of files) {
        if (file.content.includes('/* @nesoi:browser add')) {
            file.content = file.content.replace(/\/\* @nesoi:browser add(\s*)(.*?)(\s*)\*\//gs,'$2')
            fs.writeFileSync(file.path, file.content);
        }
    }

    Console.step('(Step 9) Include package.json file on build/');
    const packageJson = JSON.parse(fs.readFileSync('package.json').toString());
    delete packageJson['scripts']
    delete packageJson['files']
    delete packageJson['_moduleAliases']

    packageJson['name'] = '@nesoi/for-browser';

    packageJson['peerDependencies'] = {}
    delete packageJson['devDependencies']
    
    const buildPackageJson = path.resolve('.', 'build_browser', 'package.json');
    fs.writeFileSync(buildPackageJson, JSON.stringify(packageJson, undefined, 4));

    Console.step('(Step 10) Include README.md file on build/');
    const readme = path.resolve('.', 'README.md')
    const buildReadme = path.resolve('.', 'build_browser', 'README.md')
    fs.copyFileSync(readme, buildReadme);
    
}

main();