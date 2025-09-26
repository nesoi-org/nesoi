import * as path from 'path';
import * as fs from 'fs';

export type DotEnvFile = Record<string,string>
export class DotEnv {

    static load(filename = '.env') {
        const filepath = path.join(process.cwd(), filename)
        if (!fs.existsSync(filepath)) return;
        const file = this.parse(filename);
        for (const key in file) {
            process.env[key] = file[key];
        }
    }

    static parse(filename = '.env'): DotEnvFile {
        const filepath = path.join(process.cwd(), filename)
        const file = fs.readFileSync(filepath, 'utf-8');
        return file.split('\n').reduce((a: DotEnvFile, line) => {
            const p = line.split('=');
            if (p.length > 1) a[p[0]] = line.split('=')[1].trim();
            return a;
        }, {});
    }

    static save(dotenv: DotEnvFile, filename = '.env') {
        const filepath = path.join(process.cwd(), filename)
        const file = Object.keys(dotenv).map(p => p+'='+dotenv[p]).join('\n');
        fs.writeFileSync(filepath, file);
    } 

    static get(key: string, filename = '.env') {
        const dotenv = this.parse(filename);
        return dotenv[key];
    }

    static set(key: string, value: string, filename = '.env') {
        const dotenv = this.parse(filename);
        dotenv[key] = value;
        this.save(dotenv);
    }
    
}
