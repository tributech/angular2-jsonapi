"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var date_converter_1 = require("../converters/date/date.converter");
function JsonAttribute(options) {
    if (options === void 0) { options = {}; }
    return function (target, propertyName) {
        var converter = function (dataType, value, forSerialisation) {
            if (forSerialisation === void 0) { forSerialisation = false; }
            var attrConverter;
            if (options.converter) {
                attrConverter = options.converter;
            }
            else if (dataType === Date) {
                attrConverter = new date_converter_1.DateConverter();
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
            var metadata = Reflect.getMetadata('JsonAttribute', target) || {};
            metadata[propertyName] = {
                marked: true
            };
            Reflect.defineMetadata('JsonAttribute', metadata, target);
            var mappingMetadata = Reflect.getMetadata('AttributeMapping', target) || {};
            var serializedPropertyName = options.serializedName !== undefined ? options.serializedName : propertyName;
            mappingMetadata[serializedPropertyName] = propertyName;
            Reflect.defineMetadata('AttributeMapping', mappingMetadata, target);
        };
        var getter = function () {
            if (this.nestedDataSerialization) {
                return converter(Reflect.getMetadata('design:type', target, propertyName), this['_' + propertyName], true);
            }
            return this['_' + propertyName];
        };
        var setter = function (newVal) {
            var targetType = Reflect.getMetadata('design:type', target, propertyName);
            this['_' + propertyName] = converter(targetType, newVal);
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
exports.JsonAttribute = JsonAttribute;
//# sourceMappingURL=json-attribute.decorator.js.map