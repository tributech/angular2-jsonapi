import { Headers } from '@angular/http';
import find from 'lodash-es/find';
import includes from 'lodash-es/includes';
import { Observable } from 'rxjs/Observable';
import { JsonApiDatastore, ModelType } from '../services/json-api-datastore.service';
import { ModelConfig } from '../interfaces/model-config.interface';
import * as _ from 'lodash';
import { AttributeMetadata, HasManyRelationshipMetadata } from '../constants/symbols';

export type ModelData = {
  id?: string;
  attributes?: object;
  relationships?: object;
};

export class JsonApiModel {
  public id: string | undefined;
  [key: string]: any;

  constructor(
    private datastore: JsonApiDatastore,
    private modelData: ModelData
  ) {
    this.id = modelData.id;
    this.updateModel(modelData.attributes, modelData.relationships);
  }

  public updateModel(attributes: any, relationships: object = {}) {
    const serializedAttributes = this.transformSerializedNamesToPropertyNames(attributes);
    Object.assign(this, serializedAttributes);
    this.relationships = relationships || {};

    Object.keys(this.relationships).forEach((relationshipName: string) => {
      const relationshipData = this.relationships[relationshipName] || {};

      if (relationshipData.data) {
        // HasMany
        if (relationshipData.data instanceof Array) {
          Object.defineProperty(this, relationshipName, {
            get: () => {
              const modelTypes = Reflect.getMetadata('JsonApiDatastoreConfig', this.datastore.constructor).models;

              const models = relationshipData.data.map((modelData: any) => {
                // TODO type should be fetched from model's metadata
                const modelType = modelTypes[modelData.type];
                return this.datastore.peekRecord(modelType, modelData.id);
              });

              const hasMissingModels: boolean = models.some((model: any) => !model);

              return hasMissingModels ? undefined : models;
            }
          });
        } else {
          Object.defineProperty(this, relationshipName, {
            get: () => {
              const modelTypes = Reflect.getMetadata('JsonApiDatastoreConfig', this.datastore.constructor).models;
              // TODO type should be fetched from model's metadata
              const modelType = modelTypes[relationshipData.data.type];
              return this.datastore.peekRecord(modelType, relationshipData.data.id);
            }
          });
        }
      }
    });
  }

  public save(params?: any, headers?: Headers): Observable<this> {
    const attributesMetadata: any = this[AttributeMetadata];
    return this.datastore.saveRecord(attributesMetadata, this, params, headers);
  }

  get hasDirtyAttributes() {
    const attributesMetadata: any = this[AttributeMetadata];
    let hasDirtyAttributes = false;
    for (const propertyName in attributesMetadata) {
      if (attributesMetadata.hasOwnProperty(propertyName)) {
        const metadata: any = attributesMetadata[propertyName];

        if (metadata.hasDirtyAttributes) {
          hasDirtyAttributes = true;
          break;
        }
      }
    }
    return hasDirtyAttributes;
  }

  rollbackAttributes(): void {
    const attributesMetadata: any = this[AttributeMetadata];
    let metadata: any;
    for (const propertyName in attributesMetadata) {
      if (attributesMetadata.hasOwnProperty(propertyName)) {
        if (attributesMetadata[propertyName].hasDirtyAttributes) {
          this[propertyName] = attributesMetadata[propertyName].oldValue;
          metadata = {
            hasDirtyAttributes: false,
            newValue: attributesMetadata[propertyName].oldValue,
            oldValue: undefined
          };
          attributesMetadata[propertyName] = metadata;
        }
      }
    }

    this[AttributeMetadata] = attributesMetadata;
  }

  get modelConfig(): ModelConfig {
    return Reflect.getMetadata('JsonApiModelConfig', this.constructor);
  }

  private transformSerializedNamesToPropertyNames<T extends JsonApiModel>(attributes: any = {}) {
    const serializedNameToPropertyName = Reflect.getMetadata('AttributeMapping', this) || {};
    const properties: any = {};

    Object.keys(serializedNameToPropertyName).forEach((serializedName) => {
      if (attributes[serializedName]) {
        properties[serializedNameToPropertyName[serializedName]] = attributes[serializedName];
      }
    });

    return properties;
  }
}
