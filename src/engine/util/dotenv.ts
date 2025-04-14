import * as path from 'path';
import * as fs from 'fs';

export type DotEnvFile = Record<string,string>
export class DotEnv {

    static path = path.join(process.cwd(), '.env');

    static load() {
        if (!fs.existsSync(this.path)) return;
        const file = this.parse();
        for (const key in file) {
            process.env[key] = file[key];
        }
    }

    static parse(): DotEnvFile {
        const file = fs.readFileSync(this.path, 'utf-8');
        return file.split('\n').reduce((a: DotEnvFile, line) => {
            const p = line.split('=');
            if (p.length > 1) a[p[0]] = line.split('=')[1].trim();
            return a;
        }, {});
    }

    static save(dotenv: DotEnvFile) {
        const file = Object.keys(dotenv).map(p => p+'='+dotenv[p]).join('\n');
        fs.writeFileSync(this.path, file);
    } 

    static get(key: string) {
        const dotenv = this.parse();
        return dotenv[key];
    }

    static set(key: string, value: string) {
        const dotenv = this.parse();
        dotenv[key] = value;
        this.save(dotenv);
    }
    
}
