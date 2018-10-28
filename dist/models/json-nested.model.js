"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var JsonApiNestedModel = /** @class */ (function () {
    function JsonApiNestedModel(data) {
        this.nestedDataSerialization = false;
        if (data) {
            Object.assign(this, data);
        }
    }
    Object.defineProperty(JsonApiNestedModel.prototype, "modelConfig", {
        get: function () {
            return Reflect.getMetadata('JsonApiModelConfig', this.constructor);
        },
        enumerable: true,
        configurable: true
    });
    JsonApiNestedModel.prototype.fill = function (data) {
        Object.assign(this, data);
    };
    JsonApiNestedModel.prototype.serialize = function () {
        return this.transformSerializedNamesToPropertyNames();
    };
    JsonApiNestedModel.prototype.transformSerializedNamesToPropertyNames = function () {
        var _this = this;
        var serializedNameToPropertyName = this.getModelPropertyNames();
        var properties = {};
        Object.keys(serializedNameToPropertyName).forEach(function (serializedName) {
            if (_this && _this[serializedName] !== null &&
                _this[serializedName] !== undefined && serializedName !== 'nestedDataSerialization') {
                properties[serializedNameToPropertyName[serializedName]] = _this[serializedName];
            }
        });
        return properties;
    };
    JsonApiNestedModel.prototype.getModelPropertyNames = function () {
        return Reflect.getMetadata('AttributeMapping', this) || [];
    };
    return JsonApiNestedModel;
}());
exports.JsonApiNestedModel = JsonApiNestedModel;
//# sourceMappingURL=json-nested.model.js.map