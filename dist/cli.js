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
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = __importDefault(require("commander"));
var motion_master_proto_1 = require("motion-master-proto");
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
process.on('uncaughtException', function (err) {
    console.error('Caught exception: ' + err);
    process.exit();
});
process.on('unhandledRejection', function (reason) {
    console.error('Unhandled rejection reason: ', reason);
    process.exit();
});
var inspectOptions = {
    showHidden: false,
    depth: null,
    colors: true,
    maxArrayLength: null,
};
var config = {
    pingSystemInterval: 200,
    motionMasterHeartbeatTimeoutDue: 1000,
    serverEndpoint: 'tcp://127.0.0.1:62524',
    notificationEndpoint: 'tcp://127.0.0.1:62525',
    identity: uuid_1.v4(),
};
// map to cache device parameter info per device
var deviceParameterInfoMap = new Map();
var input = new rxjs.Subject();
var output = new rxjs.Subject();
var notification = new rxjs.Subject();
var motionMasterClient = new motion_master_client_1.MotionMasterClient(input, output, notification);
// connect to server endpoint
var serverSocket = zmq.socket('dealer');
debug("Identity: " + config.identity);
serverSocket.identity = config.identity;
serverSocket.connect(config.serverEndpoint);
debug("ZeroMQ DEALER socket is connected to server endpoint: " + config.serverEndpoint);
// connnect to notification endpoint
var notificationSocket = zmq.socket('sub').connect(config.notificationEndpoint);
debug("ZeroMQ SUB socket connected to notification endpoint: " + config.notificationEndpoint);
// subscribe to all topics
notificationSocket.subscribe('');
// feed notification buffer data coming from Motion Master to MotionMasterClient
notificationSocket.on('message', function (topic, message) {
    notification.next([topic, message]);
});
// ping Motion Master in regular intervals
var pingSystemInterval = rxjs.interval(config.pingSystemInterval);
pingSystemInterval.subscribe(function () { return motionMasterClient.sendRequest({ pingSystem: {} }); });
// exit process when a heartbeat message is not received for more than the time specified
motionMasterClient.filterNotificationByTopic$('heartbeat').pipe(operators_1.timeout(config.motionMasterHeartbeatTimeoutDue)).subscribe({
    error: function (err) {
        console.error(err.name + ": Heartbeat message not received for more than " + config.motionMasterHeartbeatTimeoutDue + " ms. Check if Motion Master process is running.");
        process.exit(-1);
    },
});
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
//
// program and commands
//
commander_1.default
    .version(version);
var requestCommand = commander_1.default.command('request <type> [args...]');
addDeviceOptions(requestCommand);
requestCommand
    .action(requestAction);
var uploadCommand = commander_1.default.command('upload [params...]');
addDeviceOptions(uploadCommand);
uploadCommand
    .action(uploadAction);
var downloadCommand = commander_1.default.command('download [paramValues...]');
addDeviceOptions(downloadCommand);
downloadCommand
    .action(downloadAction);
var monitorCommmand = commander_1.default.command('monitor <topic> [params...]');
addDeviceOptions(monitorCommmand);
monitorCommmand
    .option('-i, --interval <value>', 'sending interval in microseconds', parseOptionValueAsInt, 1 * 1000 * 1000)
    .action(monitorAction);
// parse command line arguments and execute the command action
commander_1.default.parse(process.argv);
//
// command action functions
//
function requestAction(type, args, cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var deviceAddress, messageId, _a, pingSystem, getSystemVersion, getDeviceInfo, getDeviceParameterInfo, parameters, getDeviceParameterValues, deviceParameterInfo_1, parameterValues, setDeviceParameterValues, getDeviceFileList, name_1, getDeviceFile, name_2, deleteDeviceFile, resetDeviceFault, stopDevice, getDeviceLog, getCoggingTorqueData, startOffsetDetection, parameters, getDeviceParameterValues, interval, topic, startMonitoringRequestId, stopMonitoringDeviceParameterValues;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getCommandDeviceAddressAsync(cmd)];
                case 1:
                    deviceAddress = _b.sent();
                    messageId = uuid_1.v4();
                    printOnMessageReceived(messageId);
                    exitOnMessageReceived(messageId);
                    _a = type;
                    switch (_a) {
                        case 'pingSystem': return [3 /*break*/, 2];
                        case 'getSystemVersion': return [3 /*break*/, 3];
                        case 'getDeviceInfo': return [3 /*break*/, 4];
                        case 'getDeviceParameterInfo': return [3 /*break*/, 5];
                        case 'getDeviceParameterValues': return [3 /*break*/, 6];
                        case 'getMultiDeviceParameterValues': return [3 /*break*/, 7];
                        case 'setDeviceParameterValues': return [3 /*break*/, 8];
                        case 'setMultiDeviceParameterValues': return [3 /*break*/, 10];
                        case 'getDeviceFileList': return [3 /*break*/, 11];
                        case 'getDeviceFile': return [3 /*break*/, 12];
                        case 'setDeviceFile': return [3 /*break*/, 13];
                        case 'deleteDeviceFile': return [3 /*break*/, 14];
                        case 'resetDeviceFault': return [3 /*break*/, 15];
                        case 'stopDevice': return [3 /*break*/, 16];
                        case 'startDeviceFirmwareInstallation': return [3 /*break*/, 17];
                        case 'getDeviceLog': return [3 /*break*/, 18];
                        case 'startCoggingTorqueRecording': return [3 /*break*/, 19];
                        case 'getCoggingTorqueData': return [3 /*break*/, 20];
                        case 'startOffsetDetection': return [3 /*break*/, 21];
                        case 'startPlantIdentification': return [3 /*break*/, 22];
                        case 'computeAutoTuningGains': return [3 /*break*/, 23];
                        case 'setMotionControllerParameters': return [3 /*break*/, 24];
                        case 'enableMotionController': return [3 /*break*/, 25];
                        case 'disableMotionController': return [3 /*break*/, 26];
                        case 'setSignalGeneratorParameters': return [3 /*break*/, 27];
                        case 'startSignalGenerator': return [3 /*break*/, 28];
                        case 'stopSignalGenerator': return [3 /*break*/, 29];
                        case 'startMonitoringDeviceParameterValues': return [3 /*break*/, 30];
                        case 'stopMonitoringDeviceParameterValues': return [3 /*break*/, 31];
                    }
                    return [3 /*break*/, 32];
                case 2:
                    {
                        pingSystem = {};
                        motionMasterClient.sendRequest({ pingSystem: pingSystem }, messageId);
                        return [3 /*break*/, 33];
                    }
                    _b.label = 3;
                case 3:
                    {
                        getSystemVersion = {};
                        motionMasterClient.sendRequest({ getSystemVersion: getSystemVersion }, messageId);
                        return [3 /*break*/, 33];
                    }
                    _b.label = 4;
                case 4:
                    {
                        getDeviceInfo = {};
                        motionMasterClient.sendRequest({ getDeviceInfo: getDeviceInfo }, messageId);
                        return [3 /*break*/, 33];
                    }
                    _b.label = 5;
                case 5:
                    {
                        getDeviceParameterInfo = { deviceAddress: deviceAddress };
                        motionMasterClient.sendRequest({ getDeviceParameterInfo: getDeviceParameterInfo }, messageId);
                        return [3 /*break*/, 33];
                    }
                    _b.label = 6;
                case 6:
                    {
                        parameters = args.map(paramToIndexSubindex);
                        getDeviceParameterValues = { deviceAddress: deviceAddress, parameters: parameters };
                        motionMasterClient.sendRequest({ getDeviceParameterValues: getDeviceParameterValues }, messageId);
                        return [3 /*break*/, 33];
                    }
                    _b.label = 7;
                case 7:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 8;
                case 8: return [4 /*yield*/, getDeviceParameterInfoAsync(deviceAddress)];
                case 9:
                    deviceParameterInfo_1 = _b.sent();
                    parameterValues = args.map(function (paramValue) { return paramToIndexSubIndexValue(paramValue, deviceParameterInfo_1); });
                    setDeviceParameterValues = { deviceAddress: deviceAddress, parameterValues: parameterValues };
                    motionMasterClient.sendRequest({ setDeviceParameterValues: setDeviceParameterValues }, messageId);
                    return [3 /*break*/, 33];
                case 10:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 11;
                case 11:
                    {
                        getDeviceFileList = { deviceAddress: deviceAddress };
                        motionMasterClient.sendRequest({ getDeviceFileList: getDeviceFileList }, messageId);
                        return [3 /*break*/, 33];
                    }
                    _b.label = 12;
                case 12:
                    {
                        name_1 = args[0];
                        getDeviceFile = { deviceAddress: deviceAddress, name: name_1 };
                        motionMasterClient.sendRequest({ getDeviceFile: getDeviceFile }, messageId);
                        return [3 /*break*/, 33];
                    }
                    _b.label = 13;
                case 13:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 14;
                case 14:
                    {
                        name_2 = args[0];
                        deleteDeviceFile = { deviceAddress: deviceAddress, name: name_2 };
                        motionMasterClient.sendRequest({ deleteDeviceFile: deleteDeviceFile }, messageId);
                        return [3 /*break*/, 33];
                    }
                    _b.label = 15;
                case 15:
                    {
                        resetDeviceFault = { deviceAddress: deviceAddress };
                        motionMasterClient.sendRequest({ resetDeviceFault: resetDeviceFault }, messageId);
                        return [3 /*break*/, 33];
                    }
                    _b.label = 16;
                case 16:
                    {
                        stopDevice = { deviceAddress: deviceAddress };
                        motionMasterClient.sendRequest({ stopDevice: stopDevice }, messageId);
                        return [3 /*break*/, 33];
                    }
                    _b.label = 17;
                case 17:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 18;
                case 18:
                    {
                        getDeviceLog = { deviceAddress: deviceAddress };
                        motionMasterClient.sendRequest({ getDeviceLog: getDeviceLog }, messageId);
                        return [3 /*break*/, 33];
                    }
                    _b.label = 19;
                case 19:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 20;
                case 20:
                    {
                        getCoggingTorqueData = { deviceAddress: deviceAddress };
                        motionMasterClient.sendRequest({ getCoggingTorqueData: getCoggingTorqueData }, messageId);
                        return [3 /*break*/, 33];
                    }
                    _b.label = 21;
                case 21:
                    {
                        startOffsetDetection = { deviceAddress: deviceAddress };
                        motionMasterClient.sendRequest({ startOffsetDetection: startOffsetDetection }, messageId);
                        return [3 /*break*/, 33];
                    }
                    _b.label = 22;
                case 22:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 23;
                case 23:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 24;
                case 24:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 25;
                case 25:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 26;
                case 26:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 27;
                case 27:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 28;
                case 28:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 29;
                case 29:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 30;
                case 30:
                    {
                        parameters = args.slice(1).map(paramToIndexSubindex);
                        getDeviceParameterValues = { deviceAddress: deviceAddress, parameters: parameters };
                        interval = cmd.interval;
                        topic = args[0];
                        requestStartMonitoringDeviceParameterValues({ getDeviceParameterValues: getDeviceParameterValues, interval: interval, topic: topic });
                        return [3 /*break*/, 33];
                    }
                    _b.label = 31;
                case 31:
                    {
                        startMonitoringRequestId = args[0];
                        stopMonitoringDeviceParameterValues = { startMonitoringRequestId: startMonitoringRequestId };
                        motionMasterClient.sendRequest({ stopMonitoringDeviceParameterValues: stopMonitoringDeviceParameterValues }, messageId);
                        return [3 /*break*/, 33];
                    }
                    _b.label = 32;
                case 32:
                    {
                        throw new Error("Request \"" + type + "\" doesn't exist");
                    }
                    _b.label = 33;
                case 33: return [2 /*return*/];
            }
        });
    });
}
function uploadAction(params, cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var messageId, deviceAddress, parameters, getDeviceParameterValues;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    messageId = uuid_1.v4();
                    printOnMessageReceived(messageId);
                    exitOnMessageReceived(messageId);
                    return [4 /*yield*/, getCommandDeviceAddressAsync(cmd)];
                case 1:
                    deviceAddress = _a.sent();
                    parameters = params.map(paramToIndexSubindex);
                    getDeviceParameterValues = { deviceAddress: deviceAddress, parameters: parameters };
                    motionMasterClient.sendRequest({ getDeviceParameterValues: getDeviceParameterValues }, messageId);
                    return [2 /*return*/];
            }
        });
    });
}
function downloadAction(paramValues, cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var messageId, deviceAddress, deviceParameterInfo, parameterValues, setDeviceParameterValues;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    messageId = uuid_1.v4();
                    printOnMessageReceived(messageId);
                    exitOnMessageReceived(messageId);
                    return [4 /*yield*/, getCommandDeviceAddressAsync(cmd)];
                case 1:
                    deviceAddress = _a.sent();
                    return [4 /*yield*/, getDeviceParameterInfoAsync(deviceAddress)];
                case 2:
                    deviceParameterInfo = _a.sent();
                    parameterValues = paramValues.map(function (paramValue) { return paramToIndexSubIndexValue(paramValue, deviceParameterInfo); });
                    setDeviceParameterValues = { deviceAddress: deviceAddress, parameterValues: parameterValues };
                    motionMasterClient.sendRequest({ setDeviceParameterValues: setDeviceParameterValues }, messageId);
                    return [2 /*return*/];
            }
        });
    });
}
function monitorAction(topic, params, cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var deviceAddress, parameters, getDeviceParameterValues, interval;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getCommandDeviceAddressAsync(cmd)];
                case 1:
                    deviceAddress = _a.sent();
                    parameters = params.map(paramToIndexSubindex);
                    getDeviceParameterValues = { deviceAddress: deviceAddress, parameters: parameters };
                    interval = cmd.interval;
                    requestStartMonitoringDeviceParameterValues({ getDeviceParameterValues: getDeviceParameterValues, interval: interval, topic: topic });
                    return [2 /*return*/];
            }
        });
    });
}
//
// helper functions
//
function requestStartMonitoringDeviceParameterValues(startMonitoringDeviceParameterValues) {
    var messageId = uuid_1.v4();
    motionMasterClient.filterNotificationByTopic$(startMonitoringDeviceParameterValues.topic).subscribe(function (notif) {
        var timestamp = Date.now();
        var topic = startMonitoringDeviceParameterValues.topic;
        var message = notif.message;
        console.log(util.inspect({ timestamp: timestamp, topic: topic, message: message }, inspectOptions));
    });
    motionMasterClient.sendRequest({ startMonitoringDeviceParameterValues: startMonitoringDeviceParameterValues }, messageId);
}
function getDeviceParameterInfoAsync(deviceAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var getDeviceParameterInfo, messageId, deviceParameterInfo;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!deviceAddress) {
                        return [2 /*return*/, null];
                    }
                    if (deviceParameterInfoMap.has(deviceAddress)) {
                        return [2 /*return*/, deviceParameterInfoMap.get(deviceAddress)]; // retrieve from cache
                    }
                    getDeviceParameterInfo = { deviceAddress: deviceAddress };
                    messageId = uuid_1.v4();
                    motionMasterClient.sendRequest({ getDeviceParameterInfo: getDeviceParameterInfo }, messageId);
                    return [4 /*yield*/, motionMasterClient.filterMotionMasterMessageById$(messageId).pipe(operators_1.first(), operators_1.map(function (message) { return message && message.status ? message.status.deviceParameterInfo : null; })).toPromise()];
                case 1:
                    deviceParameterInfo = _a.sent();
                    deviceParameterInfoMap.set(deviceAddress, deviceParameterInfo); // cache
                    return [2 /*return*/, deviceParameterInfo];
            }
        });
    });
}
function paramToIndexSubindex(paramValue) {
    var _a = paramValue.split(':'), indexStr = _a[0], subindexStr = _a[1];
    var index = parseInt(indexStr, 16);
    var subindex = parseInt(subindexStr, 10) || 0;
    return { index: index, subindex: subindex };
}
function paramToIndexSubIndexValue(paramValue, deviceParameterInfo) {
    var _a = paramValue.split('='), param = _a[0], value = _a[1];
    var _b = paramToIndexSubindex(param), index = _b.index, subindex = _b.subindex;
    var parameterValue = { index: index, subindex: subindex };
    if (deviceParameterInfo) {
        if (deviceParameterInfo.parameters) {
            var parameter = deviceParameterInfo.parameters.find(function (p) { return p.index === index && p.subindex === subindex; });
            if (parameter) {
                var VT = motion_master_proto_1.motionmaster.MotionMasterMessage.Status.DeviceParameterInfo.Parameter.ValueType;
                switch (parameter.valueType) {
                    case VT.UNSPECIFIED:
                    case VT.INTEGER8:
                    case VT.INTEGER16:
                    case VT.INTEGER32: {
                        parameterValue.intValue = parseInt(value, 10);
                        break;
                    }
                    case VT.BOOLEAN:
                    case VT.UNSIGNED8:
                    case VT.UNSIGNED16:
                    case VT.UNSIGNED32: {
                        parameterValue.uintValue = parseInt(value, 10);
                        break;
                    }
                    case VT.REAL32: {
                        parameterValue.floatValue = parseFloat(value);
                        break;
                    }
                    case VT.VISIBLE_STRING:
                    case VT.OCTET_STRING:
                    case VT.UNICODE_STRING:
                    case VT.TIME_OF_DAY: {
                        parameterValue.stringValue = value;
                        break;
                    }
                }
            }
        }
    }
    return parameterValue;
}
function getCommandDeviceAddressAsync(cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var device;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!cmd.deviceAddress) return [3 /*break*/, 1];
                    return [2 /*return*/, cmd.deviceAddress];
                case 1:
                    if (!Number.isInteger(cmd.devicePosition)) return [3 /*break*/, 3];
                    return [4 /*yield*/, motionMasterClient.getDeviceAtPosition$(cmd.devicePosition).toPromise()];
                case 2:
                    device = _a.sent();
                    if (device) {
                        return [2 /*return*/, device.deviceAddress];
                    }
                    else {
                        throw new Error("There is no device at position " + cmd.devicePosition);
                    }
                    return [3 /*break*/, 4];
                case 3: return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function exitOnMessageReceived(messageId, exit, due) {
    if (exit === void 0) { exit = true; }
    if (due === void 0) { due = 10000; }
    motionMasterClient.filterMotionMasterMessageById$(messageId).pipe(operators_1.first(), operators_1.timeout(due)).subscribe({
        next: function () {
            if (exit) {
                debug("Exit on message received " + messageId);
                process.exit(0);
            }
        },
        error: function (err) {
            console.error(err.name + ": Status message " + messageId + " not received for more than " + due + " ms.");
            process.exit(-1);
        },
    });
}
function printOnMessageReceived(messageId) {
    motionMasterClient.filterMotionMasterMessageById$(messageId).pipe(operators_1.first()).subscribe(function (msg) {
        var timestamp = Date.now();
        var message = msg.toJSON();
        console.log(util.inspect({ timestamp: timestamp, message: message }, inspectOptions));
    });
}
function parseOptionValueAsInt(value) {
    return parseInt(value, 10);
}
function addDeviceOptions(cmd) {
    cmd.option('-d, --device-address <value>', 'device address (uint32) generated by Motion Master - takes precedence over device position', parseOptionValueAsInt);
    cmd.option('-p, --device-position <value>', 'used when device address is not specified', parseOptionValueAsInt, 0);
}
//# sourceMappingURL=cli.js.map