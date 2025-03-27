import Console from '../src/engine/util/console'
import Shell from '../src/engine/util/shell'
import File from './util/file'
import * as fs from 'fs';
import * as path from 'path';

/**
 * [ bundle ]
 * This script is run when building Nesoi for export.
 */

Console.header('Bundle')

async function main() {
    
    Console.step('(Step 1) Clean build folder')
    fs.rmSync('build', { recursive: true, force: true });

    Console.step('(Step 2) Transpile TypeScript source files')
    await Shell.cmd('.', 'npm run build')

    Console.step('(Step 3) Run Syntax Typing Tests')
    await Shell.cmd('.', 'npx tsd')

    Console.step('(Step 4) Run Unit Tests')
    await Shell.cmd('.', 'npx jest test/engine test/elements --verbose')

    Console.step('(Step 5) Rename "src" folder to "lib"')
    const oldLibPath = path.resolve('.', 'build', 'src');
    const newLibPath = path.resolve('.', 'build', 'lib');
    fs.renameSync(oldLibPath, newLibPath);

    Console.step('(Step 6) Replace "src" by "lib" on tools')
    const compileToolPath = path.resolve('.', 'build', 'tools', 'compile.js');
    File.replaceInContent(compileToolPath, /require\("\.\.\/src\//, 'require("../lib/');

    // Console.step('(Step 7) Copy "template" folder to build')
    // const sourceTemplatesPath = path.resolve('.', 'tools', 'bootstrap', 'templates');
    // const targetTemplatesPath = path.resolve('.', 'build', 'tools', 'bootstrap', 'templates');
    // fs.cpSync(sourceTemplatesPath, targetTemplatesPath, { recursive: true });

    Console.step('(Step 7) Include package.json file on build/');
    const packageJson = JSON.parse(fs.readFileSync('package.json').toString());
    delete packageJson['scripts']
    delete packageJson['files']
    delete packageJson['_moduleAliases']

    packageJson['peerDependencies'] = {
        '@types/node': '20.12.12'
    }
    delete packageJson['devDependencies']
    
    const buildPackageJson = path.resolve('.', 'build', 'package.json');
    fs.writeFileSync(buildPackageJson, JSON.stringify(packageJson, undefined, 4));
    
}

main();