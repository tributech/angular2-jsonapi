import { HasManyRelationshipMetadata } from '../constants/symbols';

export function HasMany(config: any = {}) {
  return function (target: any, propertyName: string | symbol) {
    const annotations = Reflect.getMetadata(HasManyRelationshipMetadata, target) || [];

    annotations.push({
      propertyName,
      relationship: config.key || propertyName
    });

    Reflect.defineMetadata(HasManyRelationshipMetadata, annotations, target);
  };
}
