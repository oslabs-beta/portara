"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var SchemaDirectiveVisitor = require('apollo-server').SchemaDirectiveVisitor;
var graphql_1 = require("graphql");
var asyncRedis = require('async-redis');
var client = asyncRedis.createClient();
// Redis Rate Limiter -------------------------------------------
exports.rateLimiter = function (limit, per, ip, scope) { return __awaiter(void 0, void 0, void 0, function () {
    var perNum, perWord, timeFrameMultiplier, expirationTimeVariable, key, exists, value;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                perNum = parseFloat((_a = per.match(/\d+/g)) === null || _a === void 0 ? void 0 : _a.toString());
                perWord = (_b = per.match(/[a-zA-Z]+/g)) === null || _b === void 0 ? void 0 : _b.toString().toLowerCase();
                timeFrameMultiplier = function (timeFrame) {
                    if (timeFrame === 'milliseconds' || timeFrame === 'millisecond' || timeFrame === 'mil' || timeFrame === 'mils' || timeFrame === 'ms') {
                        return 1;
                    }
                    else if (timeFrame === 'seconds' || timeFrame === 'second' || timeFrame === 'sec' || timeFrame === 'secs' || timeFrame === 's') {
                        return 1000;
                    }
                    else if (timeFrame === 'minutes' || timeFrame === 'minute' || timeFrame === 'min' || timeFrame === 'mins' || timeFrame === 'm') {
                        return 1000 * 60;
                    }
                    else if (timeFrame === 'hours' || timeFrame === 'hour' || timeFrame === 'h') {
                        return 1000 * 60 * 60;
                    }
                    else if (timeFrame === 'days' || timeFrame === 'day' || timeFrame === 'd') {
                        return 1000 * 60 * 60 * 24;
                    }
                    else if (timeFrame === 'weeks' || timeFrame === 'week' || timeFrame === 'w') {
                        return 1000 * 60 * 60 * 24 * 7;
                    }
                    else if (timeFrame === '' || timeFrame === undefined) {
                        return 1000;
                    }
                    else {
                        return new Error('Not a valid measure of time!');
                    }
                };
                expirationTimeVariable = (timeFrameMultiplier(perWord) * perNum);
                key = ip + '_' + scope;
                return [4 /*yield*/, client.exists(key)];
            case 1:
                exists = _c.sent();
                if (!(exists === 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, client.psetex(key, expirationTimeVariable, 1)];
            case 2:
                _c.sent();
                return [2 /*return*/, true];
            case 3: return [4 /*yield*/, client.incr(key)];
            case 4:
                _c.sent();
                return [4 /*yield*/, client.get(key)];
            case 5:
                value = _c.sent();
                value = Number(value);
                return [2 /*return*/, value > limit ? false : true];
        }
    });
}); };
//---------------------------------------------------------------
var portaraSchemaDirective = /** @class */ (function (_super) {
    __extends(portaraSchemaDirective, _super);
    function portaraSchemaDirective() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    portaraSchemaDirective.prototype.visitFieldDefinition = function (field, details) {
        var _this = this;
        var _a = this.args, limit = _a.limit, per = _a.per;
        var _b = field.resolve, resolve = _b === void 0 ? graphql_1.defaultFieldResolver : _b;
        console.log("FIELD");
        field.resolve = function () {
            var originalArgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                originalArgs[_i] = arguments[_i];
            }
            return __awaiter(_this, void 0, void 0, function () {
                var object, args, context, info, underLimit;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            object = originalArgs[0], args = originalArgs[1], context = originalArgs[2], info = originalArgs[3];
                            return [4 /*yield*/, exports.rateLimiter(limit, per, context.req.ip, info.fieldName)];
                        case 1:
                            underLimit = _a.sent();
                            if (underLimit) {
                                return [2 /*return*/, resolve.apply(void 0, originalArgs)];
                            }
                            else
                                return [2 /*return*/, new Error('Over Limit')];
                            return [2 /*return*/];
                    }
                });
            });
        };
    };
    portaraSchemaDirective.prototype.visitObject = function (type) {
        var _this = this;
        var _a = this.args, limit = _a.limit, per = _a.per;
        var fields = type.getFields();
        console.log("OBJECT");
        Object.values(fields).forEach(function (field) {
            var _a = field.resolve, resolve = _a === void 0 ? graphql_1.defaultFieldResolver : _a;
            if (!field.astNode.directives.some(function (directive) { return directive.name.value === 'portara'; })) {
                field.resolve = function () {
                    var originalArgs = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        originalArgs[_i] = arguments[_i];
                    }
                    return __awaiter(_this, void 0, void 0, function () {
                        var object, args, context, info, underLimit;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    object = originalArgs[0], args = originalArgs[1], context = originalArgs[2], info = originalArgs[3];
                                    return [4 /*yield*/, exports.rateLimiter(limit, per, context.req.ip, type.toString())];
                                case 1:
                                    underLimit = _a.sent();
                                    if (underLimit) {
                                        return [2 /*return*/, resolve.apply(void 0, originalArgs)];
                                    }
                                    else
                                        return [2 /*return*/, new Error('Over Limit')];
                                    return [2 /*return*/];
                            }
                        });
                    });
                };
            }
        });
    };
    return portaraSchemaDirective;
}(SchemaDirectiveVisitor));
exports.portaraSchemaDirective = portaraSchemaDirective;
