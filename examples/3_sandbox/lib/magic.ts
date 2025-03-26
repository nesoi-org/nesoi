import { MANA } from './mana';

export function kapoof() {
    if (MANA > 1) {
        console.log('Kapoof!');
    }
}

export type Wat = {
    name: string
}