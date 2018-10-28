"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("../..");
var JsonModelConverter = /** @class */ (function () {
    function JsonModelConverter(model, nullValue) {
        if (nullValue === void 0) { nullValue = true; }
        this.nullValue = nullValue;
        this.modelType = model; // <ModelType<T>>model
    }
    JsonModelConverter.prototype.mask = function (value) {
        if (!value && !this.nullValue) {
            return new this.modelType();
        }
        var result = null;
        if (Array.isArray(value)) {
            result = [];
            for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
                var item = value_1[_i];
                if (item === null) {
                    continue;
                }
                var temp = void 0;
                if (typeof item === 'object') {
                    temp = new this.modelType();
                    temp.fill(item);
                }
                else {
                    temp = item;
                }
                result.push(temp);
            }
        }
        else {
            if (!(value instanceof this.modelType)) {
                result = new this.modelType();
                result.fill(value);
            }
            else {
                result = value;
            }
        }
        return result;
    };
    JsonModelConverter.prototype.unmask = function (value) {
        if (!value) {
            return value;
        }
        var result = null;
        if (Array.isArray(value)) {
            result = [];
            for (var _i = 0, value_2 = value; _i < value_2.length; _i++) {
                var item = value_2[_i];
                if (!item) {
                    continue;
                }
                if (item instanceof __1.JsonApiNestedModel) {
                    item.nestedDataSerialization = true;
                    result.push(item.serialize());
                    item.nestedDataSerialization = false;
                }
                else {
                    result.push(item);
                }
            }
        }
        else {
            if (value instanceof __1.JsonApiNestedModel) {
                value.nestedDataSerialization = true;
                result = value.serialize();
                value.nestedDataSerialization = false;
            }
            else {
                result = value;
            }
        }
        return result;
    };
    return JsonModelConverter;
}());
exports.JsonModelConverter = JsonModelConverter;
//# sourceMappingURL=json-model.converter.js.map