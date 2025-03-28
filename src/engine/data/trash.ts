import { NesoiDatetime } from './datetime'

export type TrashObj = {

    id: number
    
    bucket: string
    original_id: number | string

    data: Record<string, any>

    adapter: {
        name: string
        [x: string]: any
    }

    trx: Record<string, any>

    deleted_by?: number | string
    deleted_at: NesoiDatetime
}