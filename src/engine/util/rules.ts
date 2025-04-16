export const requiredIf = (key: string, val: any, error: string) => {
    return ($: { value?: any, raw: Record<string, any> }) => {
        if ($.value) return true;
        return $.raw[key] !== val
            || error
    }
}