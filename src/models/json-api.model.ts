import { Headers } from '@angular/http';
import find from 'lodash-es/find';
import includes from 'lodash-es/includes';
import { Observable } from 'rxjs/Observable';
import { JsonApiDatastore, ModelType } from '../services/json-api-datastore.service';
import { ModelConfig } from '../interfaces/model-config.interface';
import * as _ from 'lodash';
import { AttributeMetadata, HasManyRelationshipMetadata } from '../constants/symbols';

export class JsonApiModel {
  id: string;
  [key: string]: any;

  constructor(
    private datastore: JsonApiDatastore,
    data: any = {},
    relationships: object = {}
  ) {
    this.id = data.id;
    this.updateModel(data.attributes, relationships);
  }

  syncRelationships(data: any, included: any, level: number): void {
    if (data) {
      this.parseHasMany(data, included, level);
      this.parseBelongsTo(data, included, level);
    }
  }

  public updateModel(attributes: any, relationships: object = {}) {
    const serializedAttributes = this.transformSerializedNamesToPropertyNames(attributes);
    Object.assign(this, serializedAttributes);
    this.relationships = relationships;
  }

  save(params?: any, headers?: Headers): Observable<this> {
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


  private parseHasMany(data: any, included: any, level: number): void {
    const hasMany: any = Reflect.getMetadata(HasManyRelationshipMetadata, this);

    if (hasMany) {
      for (const metadata of hasMany) {
        const relationship: any = data.relationships ? data.relationships[metadata.relationship] : null;

        if (relationship && relationship.data && relationship.data.length > 0) {
          let allModels: JsonApiModel[] = [];
          const modelTypesFetched: any = [];

          for (const typeIndex of Object.keys(relationship.data)) {
            const typeName: string = relationship.data[typeIndex].type;

            if (!includes(modelTypesFetched, typeName)) {
              modelTypesFetched.push(typeName);
              // tslint:disable-next-line:max-line-length
              const modelType: ModelType<this> = Reflect.getMetadata('JsonApiDatastoreConfig', this.datastore.constructor).models[typeName];

              if (modelType) {
                // tslint:disable-next-line:max-line-length
                const relationshipModels: JsonApiModel[] = this.getHasManyRelationship(modelType, relationship.data, included, typeName, level);
                if (relationshipModels.length > 0) {
                  allModels = allModels.concat(relationshipModels);
                }
              } else {
                throw { message: 'parseHasMany - Model type for relationship ' + typeName + ' not found.' };
              }
            }

            if (allModels.length > 0) {
              this[metadata.propertyName] = allModels;
            }
          }
        }
      }
    }
  }

  private parseBelongsTo(data: any, included: any, level: number): void {
    const belongsTo: any = Reflect.getMetadata('BelongsTo', this);



    if (belongsTo) {
      for (const metadata of belongsTo) {
        const relationship: any = data.relationships ? data.relationships[metadata.relationship] : null;
        if (relationship && relationship.data) {
          const dataRelationship: any = (relationship.data instanceof Array) ? relationship.data[0] : relationship.data;
          if (dataRelationship) {
            const typeName: string = dataRelationship.type;
            // tslint:disable-next-line:max-line-length
            const modelType: ModelType<this> = Reflect.getMetadata('JsonApiDatastoreConfig', this.datastore.constructor).models[typeName];
            if (modelType) {
              const relationshipModel = this.getBelongsToRelationship(
                modelType,
                dataRelationship,
                included,
                typeName,
                level
              );

              if (relationshipModel) {
                this[metadata.propertyName] = relationshipModel;
              }
            } else {
              throw { message: 'parseBelongsTo - Model type for relationship ' + typeName + ' not found.' };
            }
          }
        }
      }
    }
  }

  private getHasManyRelationship<T extends JsonApiModel>(
    modelType: ModelType<T>,
    data: any,
    included: any,
    typeName: string,
    level: number
  ): Array<T> {
    const relationshipList: Array<T> = [];

    data.forEach((item: any) => {
      const relationshipData: any = find(included, { id: item.id, type: typeName });

      if (relationshipData) {
        const newObject: T = this.createOrPeek(modelType, relationshipData);

        if (level <= 1) {
          newObject.syncRelationships(relationshipData, included, level + 1);
        }
        relationshipList.push(newObject);
      }
    });
    return relationshipList;
  }


  private getBelongsToRelationship<T extends JsonApiModel>(
    modelType: ModelType<T>,
    data: any,
    included: any,
    typeName: string,
    level: number
  ): T | null {
    const id: string = data.id;
    const relationshipData: any = find(included, { id, type: typeName });

    if (relationshipData) {
      const newObject: T = this.createOrPeek(modelType, relationshipData);

      if (level <= 1) {
        newObject.syncRelationships(relationshipData, included, level + 1);
      }

      return newObject;
    }
    return this.datastore.peekRecord(modelType, id);
  }

  private createOrPeek<T extends JsonApiModel>(modelType: ModelType<T>, data: any): T {
    const peek = this.datastore.peekRecord(modelType, data.id);

    if (peek) {
      _.extend(peek, data.attributes);
      return peek;
    }
    
    const newObject: T = new modelType(this.datastore, data);
    this.datastore.addToStore(newObject);
    
    return newObject;
  }

  private transformSerializedNamesToPropertyNames<T extends JsonApiModel>(attributes: any) {
    const serializedNameToPropertyName = Reflect.getMetadata('AttributeMapping', this);
    const properties: any = {};

    Object.keys(serializedNameToPropertyName).forEach((serializedName) => {
      if (attributes[serializedName]) {
        properties[serializedNameToPropertyName[serializedName]] = attributes[serializedName];
      }
    });

    return properties;
  }
}
