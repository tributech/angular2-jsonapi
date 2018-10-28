import { ModelConfig } from '../interfaces/model-config.interface';
import { JsonApiModel } from './json-api.model';
export declare class JsonApiNestedModel {
    [key: string]: any;
    nestedDataSerialization: boolean;
    constructor(data?: any);
    readonly modelConfig: ModelConfig;
    fill(data: any): void;
    serialize(): Object;
    protected transformSerializedNamesToPropertyNames<T extends JsonApiModel>(): any;
    protected getModelPropertyNames(): any;
}
