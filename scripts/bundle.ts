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

    Console.step('(Step 3) Rename "src" folder to "lib"')
    const oldLibPath = path.resolve('.', 'build', 'src');
    const newLibPath = path.resolve('.', 'build', 'lib');
    fs.renameSync(oldLibPath, newLibPath);

    Console.step('(Step 4) Replace "src" by "lib" on tools')
    const compileToolPath = path.resolve('.', 'build', 'tools', 'compile.js');
    File.replaceInContent(compileToolPath, /require\("\.\.\/src\//g, 'require("../lib/');
    const dotenvToolPath = path.resolve('.', 'build', 'tools', 'dotenv.js');
    File.replaceInContent(dotenvToolPath, /require\("\.\.\/src\//g, 'require("../lib/');
    const joaquinMockToolPath = path.resolve('.', 'build', 'tools', 'joaquin', 'mock.js');
    File.replaceInContent(joaquinMockToolPath, /require\("\.\.\/\.\.\/src\//g, 'require("../../lib/');
    const joaquinMockToolTypePath = path.resolve('.', 'build', 'tools', 'joaquin', 'mock.d.ts');
    File.replaceInContent(joaquinMockToolTypePath, /from "\.\.\/\.\.\/src\//g, 'from "../../lib/');

    Console.step('(Step 5) Run Syntax Typing Tests')
    await Shell.cmd('.', 'npx tsd')

    Console.step('(Step 6) Run Unit Tests')
    await Shell.cmd('.', 'npx jest test/engine test/elements --verbose')

    Console.step('(Step 7) Run Compiler Unit Tests')
    await Shell.cmd('.', 'npx jest test/compiler')

    Console.step('(Step 8) Include package.json file on build/');
    const packageJson = JSON.parse(fs.readFileSync('package.json').toString());
    delete packageJson['scripts']
    delete packageJson['files']
    delete packageJson['_moduleAliases']

    packageJson['peerDependencies'] = {
        '@types/node': '>=20'
    }
    delete packageJson['devDependencies']
    
    const buildPackageJson = path.resolve('.', 'build', 'package.json');
    fs.writeFileSync(buildPackageJson, JSON.stringify(packageJson, undefined, 4));

    Console.step('(Step 9) Include README.md file on build/');
    const readme = path.resolve('.', 'README.md')
    const buildReadme = path.resolve('.', 'build', 'README.md')
    fs.copyFileSync(readme, buildReadme);
    
}

main();