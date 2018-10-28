"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var symbols_1 = require("../constants/symbols");
var _ = require("lodash");
function NestedAttribute(options) {
    if (options === void 0) { options = {}; }
    return function (target, propertyName) {
        var converter = function (dataType, value, forSerialisation) {
            if (forSerialisation === void 0) { forSerialisation = false; }
            var attrConverter;
            if (options.converter) {
                attrConverter = options.converter;
            }
            else {
                var datatype = new dataType();
                if (datatype.mask && datatype.unmask) {
                    attrConverter = datatype;
                }
            }
            if (attrConverter) {
                if (!forSerialisation) {
                    return attrConverter.mask(value);
                }
                return attrConverter.unmask(value);
            }
            return value;
        };
        var saveAnnotations = function () {
            var metadata = Reflect.getMetadata('NestedAttribute', target) || {};
            metadata[propertyName] = {
                marked: true
            };
            Reflect.defineMetadata('NestedAttribute', metadata, target);
            var mappingMetadata = Reflect.getMetadata('AttributeMapping', target) || {};
            var serializedPropertyName = options.serializedName !== undefined ? options.serializedName : propertyName;
            mappingMetadata[serializedPropertyName] = propertyName;
            Reflect.defineMetadata('AttributeMapping', mappingMetadata, target);
        };
        var updateMetadata = function (instance) {
            var newValue = instance['_' + propertyName];
            if (!instance[symbols_1.AttributeMetadata]) {
                instance[symbols_1.AttributeMetadata] = {};
            }
            if (instance[symbols_1.AttributeMetadata][propertyName] && !instance.isModelInitialization()) {
                instance[symbols_1.AttributeMetadata][propertyName].newValue = newValue;
                instance[symbols_1.AttributeMetadata][propertyName].hasDirtyAttributes = !_.isEqual(instance[symbols_1.AttributeMetadata][propertyName].oldValue, newValue);
                instance[symbols_1.AttributeMetadata][propertyName].serialisationValue = newValue;
            }
            else {
                var oldValue = _.cloneDeep(newValue);
                instance[symbols_1.AttributeMetadata][propertyName] = {
                    newValue: newValue,
                    oldValue: oldValue,
                    converter: converter,
                    nested: true,
                    hasDirtyAttributes: !_.isEqual(newValue, oldValue)
                };
            }
        };
        var getter = function () {
            return this['_' + propertyName];
        };
        var setter = function (newVal) {
            var targetType = Reflect.getMetadata('design:type', target, propertyName);
            this['_' + propertyName] = converter(targetType, newVal);
            updateMetadata(this);
        };
        if (delete target[propertyName]) {
            saveAnnotations();
            Object.defineProperty(target, propertyName, {
                get: getter,
                set: setter,
                enumerable: true,
                configurable: true
            });
        }
    };
}
exports.NestedAttribute = NestedAttribute;
//# sourceMappingURL=nested-attribute.decorator.js.map