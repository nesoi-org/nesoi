import * as path from 'path';
import * as fs from 'fs';

type PathStep = {
    root: string,
    next: string[]
}

export class Path {
    
    public static expandWildcard(str: string) {

        const abs = path.isAbsolute(str);
        const nodes = str.split(path.sep);

        if (nodes.length === 1) {
            return [
                path.resolve(str)
            ]
        }

        const step = {
            root: abs ? nodes[0] + path.sep : nodes[0],
            next: nodes.slice(1)
        }
        
        const paths: string[] = [];

        let steps = [step];
        while (steps.length) {
            const nextSteps: PathStep[] = [];

            for (const step of steps) {
                
                if (step.next.length === 0 || step.next[0].length === 0) {
                    paths.push(step.root);
                    continue;
                }
                const nextNext = step.next.slice(1);

                if (step.next[0] === '*') {
                    if (fs.lstatSync(step.root).isDirectory()) {
                        fs.readdirSync(step.root, { withFileTypes: true })
                            .forEach(node => {
                                const nextRoot = path.resolve(step.root, node.name);
                                nextSteps.push({
                                    root: nextRoot,
                                    next: nextNext
                                });
                            });
                    }
                    else {
                        continue;
                    }
                }
                else {
                    const nextRoot = path.resolve(step.root, step.next[0]);
                    if (fs.existsSync(nextRoot)) {
                        nextSteps.push({
                            root: nextRoot,
                            next: nextNext
                        });
                    }
                }
            }

            steps = nextSteps;
        }

        return paths;
    }

    public static allFiles(dir: string, filelist: string[] = []) {
        const files = fs.readdirSync(dir);
        filelist ??= [];
        files.forEach(file => {
            const p = path.join(dir, file);
            if (fs.statSync(p).isDirectory()) {
                filelist = this.allFiles(p, filelist);
            }
            else {
                filelist.push(p);
            }
        });
        return filelist;
    }
}