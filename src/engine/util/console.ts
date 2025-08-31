import pack from '../../../package.json';
import { Log } from './log';
import { colored } from './string';

export default class Console {

    // Prints a step message to the terminal
    static step(msg: string) {
        console.log(colored('- ' + msg, 'green'));
    }

    // Prints the header
    static header(module: string) {
        if (['off','error','warn'].includes(Log.level)) return;
        console.log(colored('┏          ┓', 'lightcyan'));
        console.log(colored('  ┏┓┳┓┏┏┓┏', 'lightblue'));
        console.log(colored('  ┛╹┗ ┛┗┛╹', 'lightblue'));      
        console.log(colored('┗          ┛', 'lightcyan'));
        console.log(colored('       '+pack.version, 'lightblue'));
        console.log(colored('\n[ ' + module + ' ]', 'lightpurple'));
        console.log();
    }

}


