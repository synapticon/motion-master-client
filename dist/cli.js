#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = __importDefault(require("commander"));
var rxjs = __importStar(require("rxjs"));
var operators_1 = require("rxjs/operators");
var util = __importStar(require("util"));
var uuid_1 = require("uuid");
var zmq = __importStar(require("zeromq"));
var motion_master_client_1 = require("./motion-master-client");
// tslint:disable: no-var-requires
var debug = require('debug')('motion-master-client');
var version = require('../package.json')['version'];
// tslint:enable-next-line: no-var-requires
var inspectOptions = {
    showHidden: false,
    depth: null,
    colors: true,
    maxArrayLength: null,
};
var cliOptions = {
    pingSystemInterval: 250,
    serverEndpoint: 'tcp://127.0.0.1:62524',
    notificationEndpoint: 'tcp://127.0.0.1:62525',
};
var pingSystemInterval = rxjs.interval(cliOptions.pingSystemInterval);
var identity = uuid_1.v4();
debug("Identity: " + identity);
var serverSocket = zmq.socket('dealer');
serverSocket.identity = identity;
serverSocket.connect(cliOptions.serverEndpoint);
debug("ZeroMQ DEALER socket is connected to server endpoint: " + cliOptions.serverEndpoint);
var notificationSocket = zmq.socket('sub').connect(cliOptions.notificationEndpoint);
debug("ZeroMQ SUB socket connected to notification endpoint: " + cliOptions.notificationEndpoint);
notificationSocket.subscribe('');
process.on('uncaughtException', function (err) {
    console.error('Caught exception: ' + err);
    process.exit();
});
process.on('unhandledRejection', function (reason) {
    console.error('Unhandled rejection reason: ', reason);
    process.exit();
});
var input = new rxjs.Subject();
var output = new rxjs.Subject();
var notification = new rxjs.Subject();
// feed notification buffer data coming from Motion Master to MotionMasterClient
notificationSocket.on('message', function (topic, message) {
    notification.next([topic, message]);
});
var motionMasterClient = new motion_master_client_1.MotionMasterClient(input, output, notification);
pingSystemInterval.subscribe(function () { return motionMasterClient.requestPingSystem(); });
// feed buffer data coming from Motion Master to MotionMasterClient
serverSocket.on('message', function (data) {
    input.next(data);
});
// send buffer data fed from MotionMasterClient to Motion Master
output.subscribe(function (buffer) {
    var message = motion_master_client_1.decodeMotionMasterMessage(buffer);
    // log outgoing messages and skip ping messages
    if (!(message && message.request && message.request.pingSystem)) {
        debug(util.inspect(motion_master_client_1.decodeMotionMasterMessage(buffer).toJSON(), inspectOptions));
    }
    serverSocket.send(buffer);
});
// log all status messages coming from Motion Master
motionMasterClient.motionMasterMessage$.subscribe(function (msg) {
    var timestamp = Date.now();
    var message = msg.toJSON();
    console.log(util.inspect({ timestamp: timestamp, message: message }, inspectOptions));
});
commander_1.default
    .version(version);
commander_1.default
    .command('request <type> [args...]')
    .option('-d, --device-address <value>', 'device address (uint32) generated by Motion Master - takes precedence over device position', parseOptionValueAsInt)
    .option('-p, --device-position <value>', 'used when device address is not specified', parseOptionValueAsInt, 0)
    .action(function (type, args, cmd) { return __awaiter(_this, void 0, void 0, function () {
    var deviceAddress, messageId, parameters;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getCommandDeviceAddress(cmd)];
            case 1:
                deviceAddress = _a.sent();
                messageId = uuid_1.v4();
                exitOnMessageReceived(messageId);
                switch (type) {
                    case 'GetSystemVersion':
                        motionMasterClient.requestGetSystemVersion(messageId);
                        break;
                    case 'GetDeviceInfo':
                        motionMasterClient.requestGetDeviceInfo(messageId);
                        break;
                    case 'GetDeviceParameterInfo':
                        motionMasterClient.requestGetDeviceParameterInfo(deviceAddress, messageId);
                        break;
                    case 'GetDeviceParameterValues':
                        parameters = args.map(paramToIndexAndSubindex);
                        motionMasterClient.requestGetDeviceParameterValues(deviceAddress, parameters, messageId);
                        break;
                    default:
                        throw new Error("Request \"" + commander_1.default.request + "\" doesn't exist");
                }
                return [2 /*return*/];
        }
    });
}); });
commander_1.default
    .command('upload [params...]')
    .option('-d, --device-address <value>', 'device address (uint32) generated by Motion Master - takes precedence over device position', parseOptionValueAsInt)
    .option('-p, --device-position <value>', 'used when device address is not specified', parseOptionValueAsInt, 0)
    .action(function (params, cmd) { return __awaiter(_this, void 0, void 0, function () {
    var deviceAddress, parameters, messageId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getCommandDeviceAddress(cmd)];
            case 1:
                deviceAddress = _a.sent();
                parameters = params.map(paramToIndexAndSubindex);
                messageId = uuid_1.v4();
                exitOnMessageReceived(messageId);
                motionMasterClient.requestGetDeviceParameterValues(deviceAddress, parameters, messageId);
                return [2 /*return*/];
        }
    });
}); });
commander_1.default
    .command('download [paramValues...]')
    .option('-d, --device-address <value>', 'device address (uint32) generated by Motion Master - takes precedence over device position', parseOptionValueAsInt)
    .option('-p, --device-position <value>', 'used when device address is not specified', parseOptionValueAsInt, 0)
    .action(function (paramValues, cmd) { return __awaiter(_this, void 0, void 0, function () {
    var deviceAddress, parameters, messageId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getCommandDeviceAddress(cmd)];
            case 1:
                deviceAddress = _a.sent();
                parameters = paramValues.map(paramValueToIndexAndSubindex);
                messageId = uuid_1.v4();
                exitOnMessageReceived(messageId);
                motionMasterClient.requestSetDeviceParameterValues(deviceAddress, parameters, messageId);
                return [2 /*return*/];
        }
    });
}); });
commander_1.default
    .command('monitor <topic> [params...]')
    .option('-d, --device-address <value>', 'device address (uint32) generated by Motion Master - takes precedence over device position', parseOptionValueAsInt)
    .option('-p, --device-position <value>', 'used when device address is not specified', parseOptionValueAsInt, 0)
    .option('-i, --interval <value>', 'sending interval in microseconds', parseOptionValueAsInt, 1 * 1000 * 1000)
    .action(function (topic, params, cmd) { return __awaiter(_this, void 0, void 0, function () {
    var deviceAddress, interval, parameters;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getCommandDeviceAddress(cmd)];
            case 1:
                deviceAddress = _a.sent();
                motionMasterClient.filterNotificationByTopic$(topic).subscribe(function (notif) {
                    var timestamp = Date.now();
                    var message = notif.message;
                    console.log(util.inspect({ timestamp: timestamp, topic: topic, message: message }, inspectOptions));
                });
                interval = cmd.interval;
                parameters = params.map(paramToIndexAndSubindex);
                motionMasterClient.startMonitoringDeviceParameterValues(interval, topic, { parameters: parameters, deviceAddress: deviceAddress });
                return [2 /*return*/];
        }
    });
}); });
commander_1.default.parse(process.argv);
function paramToIndexAndSubindex(param) {
    var _a = param.split(':'), indexStr = _a[0], subindexStr = _a[1];
    var index = parseInt(indexStr, 16);
    var subindex = parseInt(subindexStr, 10);
    return { index: index, subindex: subindex };
}
function paramValueToIndexAndSubindex(paramValue) {
    var _a = paramValue.split('='), param = _a[0], valueStr = _a[1];
    var _b = paramToIndexAndSubindex(param), index = _b.index, subindex = _b.subindex;
    var value = parseFloat(valueStr);
    var intValue = value;
    var uintValue = value;
    var floatValue = value;
    return { index: index, subindex: subindex, intValue: intValue, uintValue: uintValue, floatValue: floatValue };
}
function getCommandDeviceAddress(command) {
    return __awaiter(this, void 0, void 0, function () {
        var device;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!command.deviceAddress) return [3 /*break*/, 1];
                    return [2 /*return*/, command.deviceAddress];
                case 1:
                    if (!Number.isInteger(command.devicePosition)) return [3 /*break*/, 3];
                    return [4 /*yield*/, motionMasterClient.getDeviceAtPosition$(command.devicePosition).toPromise()];
                case 2:
                    device = _a.sent();
                    if (device) {
                        return [2 /*return*/, device.deviceAddress];
                    }
                    else {
                        throw new Error("There is no device at position " + command.devicePosition);
                    }
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function exitOnMessageReceived(messageId, exit) {
    if (exit === void 0) { exit = true; }
    motionMasterClient.motionMasterMessage$.pipe(operators_1.filter(function (message) { return message.id === messageId; }), operators_1.first()).subscribe(function () {
        if (exit) {
            process.exit();
        }
    });
}
function parseOptionValueAsInt(value) {
    return parseInt(value, 10);
}
//# sourceMappingURL=cli.js.map