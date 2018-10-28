import { PropertyConverter } from '../..';
export declare class JsonModelConverter<T> implements PropertyConverter {
    nullValue: boolean;
    private modelType;
    constructor(model: T, nullValue?: boolean);
    mask(value: any): T;
    unmask(value: any): any;
}
