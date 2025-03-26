export enum Color {
    black = '0;30',
    red = '0;31',
    green = '0;32',
    brown = '0;33',
    blue = '0;34',
    purple = '0;35',
    cyan = '0;36',
    lightgray = '0;37',
    darkgray = '1;30',
    lightred = '1;31',
    lightgreen = '1;32',
    yellow = '1;33',
    lightblue = '1;34',
    lightpurple = '1;35',
    lightcyan = '1;36'
}

export function colored(msg: string, color: keyof typeof Color) {
    return '\x1b[' + Color[color] + 'm' + msg + '\x1b[0m';
}