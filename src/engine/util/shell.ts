import { spawn } from 'child_process';

export default class Shell {

    /**
     * Execute command in shell.
     */
    static cmd(cwd: string, cmd: string, stdin?: string[], stdout = true, stderr = true) {
        console.log(cwd + '$ ' + cmd);
        return new Promise(resolve => {
            const cmds = cmd.split(' ');
            const child = spawn(cmds[0], cmds.slice(1), {shell: true, stdio: [stdin?null:process.stdin, stdout?null:process.stdout, (process as any).error], cwd});
            if (stdin) stdin.map(input => child.stdin.write(input + '\n'));
            const out = {
                stdout: [] as string[],
                stderr: [] as string[]
            };
            child.stdout.on('data', msg => {
                if (stdout) {
                    process.stdout.write(msg.toString());
                }
                out.stdout.push(msg.toString());
            });
            child.stderr.on('data', msg => {
                if (stderr) {
                    process.stderr.write(msg.toString());
                }
                out.stderr.push(msg.toString());
            });
            child.on('error', msg => {
                console.error(msg);
                throw new Error('Something went wrong when running the shell command. Read the logs.');
            });
            child.on('close', code => {
                if (code !== 0) {
                    throw new Error(`Shell command returned ${code} != 0. Read the logs.`);
                }
                resolve(out);
            });
        });
    }
}