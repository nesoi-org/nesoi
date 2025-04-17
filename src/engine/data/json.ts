import { NesoiDate } from './date'
import { NesoiDatetime } from './datetime';
import { NesoiDecimal } from './decimal';

export class NesoiJSON {
    
    /**
     * Dumps an object to 
     */
    public static dump(obj: Record<string, any>) {

        return JSON.stringify(obj, (key, value) => {
            if (value instanceof NesoiDate) {
                return value.toISO();
            }
            if (value instanceof NesoiDatetime) {
                return value.toISO();
            }
            if (value instanceof NesoiDecimal) {
                return value.toString();
            }
            return value;
        })

    }

}