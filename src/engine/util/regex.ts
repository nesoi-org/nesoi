export class NesoiRegex {

    public static toTemplateString(regex: string) {
        const str = regex;

        // eslint-disable-next-line no-useless-escape
        if (str.match(/[\[\]\{\}]/)) {
        // Not supported syntax
            return 'string';
        }
    
        let template = '';
        let state: string[] = [];
        const special_char = false;

        const v = (t: string) => {
            const v: string[] = [];
            for (let tt of t.split('|')) {
                if (tt === '.') tt = 'string'
                else tt = `'${tt}'`;
                v.push(tt);
            }
            return v.join('|');
        }

        const g = (t: string) => {
            const par = t.match(/(.*?)\((.+)\)/);
            if (par) {
                return [par[1], v(par[2])];
            }
            else {
                return [t.slice(0,-1), v(t[t.length-1])];
            }
        }

        const m = (state: string[], opt = false) => {
            const t = state.join('');
            const [t0, t1] = g(t);
            return t0 + `\${${t1}${opt?'|\'\'':''}}`;
        }

        for (const c of str) {
            if (c === '^') continue;
            if (c === '$') continue;
            if (c === '\\') continue;
            if (c === '?') {
                template += m(state, true);
                state = [];
            }
            else if (c === '+') {
                template += m(state);
                state = [];
            }
            else if (c === '*') {
                template += m(state);
                state = [];
            }
            else {
                if (state[state.length-1] === '.') {
                    template += state.slice(0,-1);
                    state = ['.'];
                }
                else {
                    state.push(c);
                }
            }
        }

        if (state.length) {
            const is_g = [')'].includes(state[state.length-1])
            if (is_g) {
                const t = state.join('');
                const [t0, t1] = g(t);
                template += t0 + `\${${t1}}`;
            }
            else template += state.join('');
        }

        return template;
    }

}