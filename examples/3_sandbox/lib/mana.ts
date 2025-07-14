export const MANA = 3;


export function rule($: any) {
    return $.msg.sim || 'Não';
}

export function rule2($: any) {
    return $.msg.nao || 'Sim';
}