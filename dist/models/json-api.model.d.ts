import { Observable } from 'rxjs/Observable';
import { JsonApiDatastore } from '../services/json-api-datastore.service';
import { ModelConfig } from '../interfaces/model-config.interface';
export declare class JsonApiModel {
    private _datastore;
    id: string;
    modelInitialization: boolean;
    [key: string]: any;
    meta: Object;
    lastSyncModels: Array<any>;
    constructor(_datastore: JsonApiDatastore, data?: any);
    isModelInitialization(): boolean;
    syncRelationships(data: any, included: any, remainingModels?: Array<any>): void;
    save(params?: any, headers?: Headers): Observable<this>;
    readonly hasDirtyAttributes: boolean;
    private checkChanges();
    rollbackAttributes(): void;
    readonly modelConfig: ModelConfig;
    private parseHasMany(data, included, remainingModels);
    private parseBelongsTo(data, included, remainingModels);
    private getHasManyRelationship<T>(modelType, data, included, typeName, remainingModels);
    private getBelongsToRelationship<T>(modelType, data, included, typeName, remainingModels);
    private createOrPeek<T>(modelType, data);
}
