import { UndefinedToOptional } from '../data/obj';

export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type DeepPartialNullable<T> = UndefinedToOptional<T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]> | null;
} : T>;
