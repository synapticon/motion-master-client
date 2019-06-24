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
var util = __importStar(require("util"));
var uuid_1 = require("uuid");
var zmq = __importStar(require("zeromq"));
// tslint:disable-next-line: no-var-requires
var debug = require('debug')('motion-master-client');
// tslint:disable-next-line: no-var-requires
var version = require('../package.json')['version'];
var inspectOptions = {
    showHidden: false,
    depth: null,
    colors: true,
    maxArrayLength: null,
};
var pingSystemInterval = rxjs.interval(250);
var operators_1 = require("rxjs/operators");
var motion_master_client_1 = require("./motion-master-client");
var ZMQ_SERVER_ENDPOINT = 'tcp://127.0.0.1:62524';
var ZMQ_MONITOR_ENDPOINT = 'tcp://127.0.0.1:62525';
var identity = uuid_1.v4();
debug("Identity: " + identity);
var serverSocket = zmq.socket('dealer');
serverSocket.identity = identity;
serverSocket.connect(ZMQ_SERVER_ENDPOINT);
debug("ZeroMQ DEALER socket is connected to endpoint: " + ZMQ_SERVER_ENDPOINT);
var notificationSocket = zmq.socket('sub').connect(ZMQ_MONITOR_ENDPOINT);
debug("ZeroMQ SUB socket connected to endpoint: " + ZMQ_MONITOR_ENDPOINT);
notificationSocket.subscribe('');
process.on('uncaughtException', function (err) {
    console.error('Caught exception: ' + err.message);
    process.exit();
});
var input = new rxjs.Subject();
var output = new rxjs.Subject();
var notification = new rxjs.Subject();
notificationSocket.on('message', function (topicBuffer, messageBuffer) {
    var topic = topicBuffer.toString();
    var message = motion_master_client_1.decodeMotionMasterMessage(messageBuffer);
    if (topic !== 'heartbeat') { // skip heartbeat
        notification.next({ topic: topic, message: message });
    }
});
var motionMasterClient = new motion_master_client_1.MotionMasterClient(input, output);
pingSystemInterval.subscribe(function () { return motionMasterClient.requestPingSystem(); });
serverSocket.on('message', function (data) {
    input.next(data);
});
output.subscribe({
    next: function (buffer) {
        var message = motion_master_client_1.decodeMotionMasterMessage(buffer);
        // log outgoing messages
        if (message && message.request && message.request.pingSystem) { // skip ping messages
            // ignore
        }
        else {
            debug(util.inspect(motion_master_client_1.decodeMotionMasterMessage(buffer), inspectOptions));
        }
        serverSocket.send(buffer);
    },
});
motionMasterClient.status$.subscribe(function (status) {
    console.log(util.inspect(status, inspectOptions));
});
commander_1.default
    .version(version)
    .option('-k, --no-exit', 'keep the program running while the monitoring is publishing messages')
    .option('-d, --device-address <value>', 'device address', parseInt)
    .option('-p, --device-position <value>', 'use the device position instead of the device address', parseInt);
commander_1.default
    .command('request <type> [params...]')
    .description('send a request message to Motion Master')
    .action(function (type, params) { return __awaiter(_this, void 0, void 0, function () {
    var deviceAddress, messageId, parameters;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getProgramDeviceAddress()];
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
                        parameters = params.map(paramToIndexAndSubindex);
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
    .action(function (params) { return __awaiter(_this, void 0, void 0, function () {
    var deviceAddress, parameters, messageId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getProgramDeviceAddress()];
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
    .command('download <param> <value>')
    .action(function (param, value) { return __awaiter(_this, void 0, void 0, function () {
    var deviceAddress, _a, index, subindex, intValue, messageId;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, getProgramDeviceAddress()];
            case 1:
                deviceAddress = _b.sent();
                _a = paramToIndexAndSubindex(param), index = _a.index, subindex = _a.subindex;
                intValue = parseInt(value, 10);
                messageId = uuid_1.v4();
                exitOnMessageReceived(messageId);
                motionMasterClient.requestSetDeviceParameterValues(deviceAddress, [
                    {
                        index: index,
                        subindex: subindex,
                        intValue: intValue,
                    },
                ], messageId);
                return [2 /*return*/];
        }
    });
}); });
commander_1.default
    .command('monitor <interval> <topic> [params...]')
    .action(function (interval, topic, params) { return __awaiter(_this, void 0, void 0, function () {
    var deviceAddress, parameters;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getProgramDeviceAddress()];
            case 1:
                deviceAddress = _a.sent();
                notification.pipe(operators_1.filter(function (notif) { return notif.topic === topic; })).subscribe(function (notif) {
                    console.log(Date.now(), notif.topic, util.inspect(notif.message, inspectOptions));
                });
                parameters = params.map(paramToIndexAndSubindex);
                motionMasterClient.startMonitoringDeviceParameterValues(interval, topic, { parameters: parameters, deviceAddress: deviceAddress });
                return [2 /*return*/];
        }
    });
}); });
commander_1.default.parse(process.argv);
function paramToIndexAndSubindex(param) {
    var _a;
    var index;
    var subindex;
    _a = param.split(':'), index = _a[0], subindex = _a[1];
    index = parseInt(index, 16);
    subindex = parseInt(subindex, 10);
    return { index: index, subindex: subindex };
}
function getDeviceAtPosition(position) {
    var messageId = uuid_1.v4();
    var observable = motionMasterClient.motionMasterMessage$.pipe(operators_1.filter(function (message) { return message.id === messageId; }), operators_1.first(), operators_1.map(function (message) { return message.status; }), operators_1.map(function (status) {
        if (status) {
            var deviceInfo = status.deviceInfo;
            if (deviceInfo && deviceInfo.devices) {
                return deviceInfo.devices[position];
            }
        }
        return null;
    }));
    motionMasterClient.requestGetDeviceInfo(messageId);
    return observable;
}
function getProgramDeviceAddress() {
    return __awaiter(this, void 0, void 0, function () {
        var deviceAddress, device;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    deviceAddress = commander_1.default.deviceAddress;
                    if (!Number.isInteger(commander_1.default.devicePosition)) return [3 /*break*/, 2];
                    return [4 /*yield*/, getDeviceAtPosition(commander_1.default.devicePosition).toPromise()];
                case 1:
                    device = _a.sent();
                    if (device) {
                        deviceAddress = device.deviceAddress;
                    }
                    _a.label = 2;
                case 2: return [2 /*return*/, deviceAddress];
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
//# sourceMappingURL=cli.js.map