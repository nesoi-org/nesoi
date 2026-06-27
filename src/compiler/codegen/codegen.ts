import type { BucketModel } from '~/elements/entities/bucket/model/bucket_model';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiDecimal } from '~/engine/data/decimal';
import { NesoiDuration } from '~/engine/data/duration';
import { NesoiError } from '~/engine/data/error';

export const CodegenInject = {
    NesoiDate: NesoiDate,
    NesoiDatetime: NesoiDatetime,
    NesoiDuration: NesoiDuration,
    NesoiDecimal: NesoiDecimal
};


export const CodegenErrorHandler = {
    bucket_model: {
        required (this: BucketModel<any, any>, modelpath: string, id: number|string) {
            return NesoiError.Bucket.Model.CorruptedData({
                module: this.bucket.module,
                bucket: this.bucket.alias,
                id: id!,
                message: `Value at '${modelpath}' is required`
            });
        },
        type (this: BucketModel<any, any>, value: any, modelpath: string, exp: string, id: number|string) {
            return NesoiError.Bucket.Model.CorruptedData({
                module: this.bucket.module,
                bucket: this.bucket.alias,
                id: id!,
                message: `Value '${value}' at '${modelpath}' should be a ${exp}`
            });
        },
        data (this: BucketModel<any, any>, value: any, modelpath: string, msg: string, id: number|string) {
            return NesoiError.Bucket.Model.CorruptedData({
                module: this.bucket.module,
                bucket: this.bucket.alias,
                id: id!,
                message: `Value '${value}' at '${modelpath}' ${msg}`
            });
        },
        union (this: BucketModel<any, any>, value: any, modelpath: string, children: NesoiError.BaseError[], id: number|string) {
            return NesoiError.Bucket.Model.CorruptedData({
                module: this.bucket.module,
                bucket: this.bucket.alias,
                id: id!,
                message: `Value '${value}' at '${modelpath}' doesn't match any of the union options`,
                children
            });
        }
    }
}


export type Code = CodeLine | CodeIf | CodeFor | CodeBlock | CodeTry

export type CodeLine = {
    kind: 'line'
    str: string
}
export type CodeIf = {
    kind: 'if'
    cond: string
    if?: Code
    else_if?: {
        cond: string,
        code: Code
    }[],
    else?: Code
}
export type CodeFor = {
    kind: 'for'
    suffix: number|string
    i: string
    n: string
    for: Code
}
export type CodeBlock = {
    kind: 'block'
    children: Code[]
    isolated?: boolean
}
export type CodeTry = {
    kind: 'try'
    try: Code
    catch?: Code
}

export class c {
    public static line(str: string): CodeLine {
        return {
            kind: 'line', str
        }
    }
    public static if(cond: string, _if?: Code, _else_if?: [string, Code][], _else?: Code): CodeIf {
        return {
            kind: 'if', cond, if: _if, else_if: _else_if?.map(e => ({cond: e[0], code: e[1]})), else: _else
        };
    }
    public static for(suffix: number|string, i: string, n: string, _for: Code): CodeFor {
        return {
            kind: 'for', suffix, i, n, for: _for
        };
    }
    public static block(children: Code[], options?: { isolated?: boolean }): CodeBlock {
        return {
            kind: 'block', children, isolated: options?.isolated
        };
    }
    public static try(_try: Code, _catch?: Code): CodeTry {
        return {
            kind: 'try', try: _try, catch: _catch
        };
    }

    public static to_str(code: Code) {
        switch (code.kind) {
        case 'line':
            return code.str + (code.str.endsWith('\n') ? '' : '\n');
        case 'if': {
            let fn = '';
            fn += `if (${code.cond}) {`;
            if (code.if) {
                fn += '\n';
                fn += c.tab(c.to_str(code.if))
            }
            fn += '}\n';
            for (const e of code.else_if ?? []) {
                fn += `else if (${e.cond}) {\n`;
                fn += c.tab(c.to_str(e.code));
                fn += '}\n';
            }
            if (code.else) {
                fn += 'else {\n';
                fn += c.tab(c.to_str(code.else))
                fn += '}\n';
            }
            return fn;
        }
        case 'for': {
            let fn = '';
            fn += `let i${code.suffix} = ${code.i}; const n${code.suffix} = ${code.n};\n`;
            fn += `while(i${code.suffix} < n${code.suffix}) {\n`;
            fn += c.tab(c.to_str(code.for))
            fn += `  i${code.suffix}++;\n`;
            fn += '}\n';
            return fn;
        }
        case 'block': {
            let fn = '';
            if (code.isolated) {
                fn += '{\n';
                for (const child of code.children) {
                    fn += c.tab(c.to_str(child))
                }
                fn += '}\n';
            }
            else {
                for (const child of code.children) {
                    fn += c.to_str(child)
                }
            }
            return fn;
        }
        case 'try': {
            let fn = '';
            fn += 'try {\n'
            fn += c.tab(c.to_str(code.try))
            if (code.catch) {
                fn += '} catch(e) {\n';
                fn += c.tab(c.to_str(code.catch))
                fn += '}\n';
            }
            else {
                fn += '} catch {}\n';
            }
            return fn;
        }
        }
    }

    public static tab(text: string) {
        if (text[text.length-1] === '\n') {
            return '  ' + text.replaceAll('\n','\n  ').slice(0,-2);
        }
        return '  ' + text.replaceAll('\n','\n  ');
    }
}