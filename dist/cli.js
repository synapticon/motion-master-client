#!/usr/bin/env node
"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = __importDefault(require("commander"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var string_decoder_1 = require("string_decoder");
var util_1 = __importDefault(require("util"));
var uuid_1 = require("uuid");
var yaml_1 = __importDefault(require("yaml"));
var zeromq_1 = __importDefault(require("zeromq"));
var motion_master_client_1 = require("./motion-master-client");
var motion_master_notification_1 = require("./motion-master-notification");
var util_2 = require("./util");
var ExitStatus;
(function (ExitStatus) {
    ExitStatus[ExitStatus["SUCCESS"] = 0] = "SUCCESS";
    ExitStatus[ExitStatus["UNCAUGHT_EXCEPTION"] = 1] = "UNCAUGHT_EXCEPTION";
    ExitStatus[ExitStatus["UNHANDLED_REJECTION"] = 2] = "UNHANDLED_REJECTION";
    ExitStatus[ExitStatus["TIMEOUT"] = 3] = "TIMEOUT";
    ExitStatus[ExitStatus["INCORRECT_PARAMETER_FORMAT"] = 4] = "INCORRECT_PARAMETER_FORMAT";
})(ExitStatus || (ExitStatus = {}));
// tslint:disable: no-var-requires
var debug = require('debug')('motion-master-client');
var version = require('../package.json')['version'];
// tslint:enable-next-line: no-var-requires
process.on('uncaughtException', function (err) {
    console.error('Caught exception: ' + err);
    process.exit(ExitStatus.UNCAUGHT_EXCEPTION);
});
process.on('unhandledRejection', function (reason) {
    console.error('Unhandled rejection reason: ', reason);
    process.exit(ExitStatus.UNHANDLED_REJECTION);
});
var inspectOptions = {
    showHidden: false,
    depth: null,
    colors: true,
    maxArrayLength: null,
    compact: false,
};
// map to cache device parameter info per device
var deviceParameterInfoMap = new Map();
var motionMasterClient = new motion_master_client_1.MotionMasterClient();
var motionMasterNotification = new motion_master_notification_1.MotionMasterNotification();
var config = {
    pingSystemInterval: 150,
    motionMasterHeartbeatTimeoutDue: 1000,
    serverEndpoint: 'tcp://127.0.0.1:62524',
    notificationEndpoint: 'tcp://127.0.0.1:62525',
    identity: uuid_1.v4(),
};
//
// program and commands
//
commander_1.default
    .version(version)
    .option('-c, --config <path>', 'path to JSON config file to read and replace the default values with')
    .option('-d, --device-address <address>', 'device address (uint32) generated by Motion Master - takes precedence over device position', parseOptionValueAsInt)
    .option('-f, --output-format <json|yaml>', 'if left unspecified the output format is the default colored message inspect')
    .option('-p, --device-position <position>', 'used when device address is not specified', parseOptionValueAsInt, 0);
commander_1.default
    .command('request <type> [args...]')
    .option('-i, --interval <value>', 'sending interval in microseconds', parseOptionValueAsInt, 1 * 1000 * 1000)
    .on('--help', function () {
    var types = Object.keys(util_2.MotionMasterMessage.Request).slice(8).map(function (type) { return type.charAt(0).toLowerCase() + type.slice(1); });
    console.log('');
    console.log('Request <type>s:');
    console.log('  ' + types.join('\n  '));
})
    .action(requestAction);
commander_1.default
    .command('upload [params...]')
    .option('-s, --send-progress')
    .action(uploadAction);
commander_1.default
    .command('download [paramValues...]')
    .action(downloadAction);
commander_1.default
    .command('getDeviceFileContent <filename>')
    .action(getDeviceFileContentAction);
commander_1.default
    .command('getDeviceLogContent')
    .action(getDeviceLogContentAction);
commander_1.default
    .command('getCoggingTorqueDataContent')
    .action(getCoggingTorqueDataContent);
commander_1.default
    .command('startCoggingTorqueRecording')
    .option('-s, --skip-auto-tuning')
    .action(startCoggingTorqueRecordingAction);
commander_1.default
    .command('startOffsetDetection')
    .action(startOffsetDetectionAction);
commander_1.default
    .command('startPlantIdentification <durationSeconds> <torqueAmplitude> <startFrequency> <endFrequency> <cutoffFrequency>')
    .action(startPlantIdentificationAction);
commander_1.default
    .command('startSystemIdentification <durationSeconds> <torqueAmplitude> <startFrequency> <endFrequency>')
    .action(startSystemIdentificationAction);
commander_1.default
    .command('startCirculoEncoderNarrowAngleCalibrationProcedure <encoderPort>')
    .action(startCirculoEncoderNarrowAngleCalibrationProcedureAction);
commander_1.default
    .command('monitor <topic> [params...]')
    .option('-i, --interval <value>', 'sending interval in microseconds', parseOptionValueAsInt, 1 * 1000 * 1000)
    .action(monitorAction);
// parse command line arguments and execute the command action
commander_1.default.parse(process.argv);
//
// command action functions
//
function requestAction(type, args, cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var deviceAddress, messageId, _a, parameters, deviceParameterInfo_1, parameterValues, name_1, filepath, name_2, content, overwrite, name_3, filepath, firmwarePackageContent, getDeviceLog, skipAutoTuning, durationSeconds, torqueAmplitude, startFrequency, endFrequency, cutoffFrequency, computeAutoTuningGainsType, controllerType, settlingTime, positionDamping, alphaMult, order, lb, ub, computeAutoTuningGains, velocityLoopBandwidth, velocityDamping, computeAutoTuningGains, target, setMotionControllerParameters, controllerType, filter, signalGeneratorType, setSignalGeneratorParameters, target, sustainTime, target, sustainTime, repeat, target, profileVelocity, profileAcceleration, profileDeceleration, sustainTime, target, profileVelocity, profileAcceleration, profileDeceleration, sustainTime, repeat, target, profileVelocity, profileAcceleration, profileDeceleration, sustainTime, repeat, amplitude, frequency, repeat, target, sustainTime, target, sustainTime, repeat, target, profileAcceleration, profileDeceleration, sustainTime, target, profileAcceleration, profileDeceleration, sustainTime, repeat, target, profileAcceleration, profileDeceleration, sustainTime, repeat, amplitude, frequency, repeat, target, sustainTime, target, sustainTime, repeat, target, torqueSlope, sustainTime, target, torqueSlope, sustainTime, repeat, target, torqueSlope, sustainTime, repeat, amplitude, frequency, repeat, parameters, getDeviceParameterValues, topic, startMonitoringRequestId, state, timeoutMs, durationSeconds, torqueAmplitude, startFrequency, endFrequency, encoderPort, encoderPort, state, devicePosition, filepath, firmwarePackageContent, properties;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    connectToMotionMaster(cmd.parent);
                    return [4 /*yield*/, getCommandDeviceAddressAsync(cmd.parent)];
                case 1:
                    deviceAddress = _b.sent();
                    messageId = uuid_1.v4();
                    printOnMessageReceived(messageId, cmd.parent.outputFormat);
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
                        case 'getEthercatNetworkState': return [3 /*break*/, 32];
                        case 'setEthercatNetworkState': return [3 /*break*/, 33];
                        case 'startNarrowAngleCalibration': return [3 /*break*/, 34];
                        case 'setSystemClientTimeout': return [3 /*break*/, 35];
                        case 'startSystemIdentification': return [3 /*break*/, 36];
                        case 'getCirculoEncoderMagnetDistance': return [3 /*break*/, 37];
                        case 'startCirculoEncoderNarrowAngleCalibrationProcedure': return [3 /*break*/, 38];
                        case 'getDeviceCia402State': return [3 /*break*/, 39];
                        case 'setDeviceCia402State': return [3 /*break*/, 40];
                        case 'getSystemLog': return [3 /*break*/, 41];
                        case 'startDeviceSiiRestore': return [3 /*break*/, 42];
                        case 'startOpenLoopFieldControl': return [3 /*break*/, 43];
                    }
                    return [3 /*break*/, 44];
                case 2:
                    {
                        motionMasterClient.requestPingSystem(messageId);
                        process.exit(ExitStatus.SUCCESS);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 3;
                case 3:
                    {
                        exitOnMessageReceived(messageId);
                        motionMasterClient.requestGetSystemVersion(messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 4;
                case 4:
                    {
                        exitOnMessageReceived(messageId);
                        motionMasterClient.requestGetDeviceInfo(messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 5;
                case 5:
                    {
                        exitOnMessageReceived(messageId);
                        motionMasterClient.requestGetDeviceParameterInfo(deviceAddress, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 6;
                case 6:
                    {
                        exitOnMessageReceived(messageId);
                        parameters = args.map(paramToIndexSubindex);
                        validateParameters(parameters);
                        motionMasterClient.requestGetDeviceParameterValues(deviceAddress, parameters, false, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 7;
                case 7:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 8;
                case 8:
                    exitOnMessageReceived(messageId);
                    return [4 /*yield*/, getDeviceParameterInfoAsync(deviceAddress)];
                case 9:
                    deviceParameterInfo_1 = _b.sent();
                    parameterValues = args.map(function (paramValue) { return paramToIndexSubIndexValue(paramValue, deviceParameterInfo_1); });
                    motionMasterClient.requestSetDeviceParameterValues(deviceAddress, parameterValues, messageId);
                    return [3 /*break*/, 45];
                case 10:
                    {
                        throw new Error("Request \"" + type + "\" is not yet implemented");
                    }
                    _b.label = 11;
                case 11:
                    {
                        exitOnMessageReceived(messageId);
                        motionMasterClient.requestGetDeviceFileList(deviceAddress, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 12;
                case 12:
                    {
                        exitOnMessageReceived(messageId);
                        name_1 = args[0];
                        motionMasterClient.requestGetDeviceFile(deviceAddress, name_1, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 13;
                case 13:
                    {
                        exitOnMessageReceived(messageId);
                        filepath = args[0];
                        name_2 = path_1.default.basename(filepath);
                        content = fs_1.default.readFileSync(filepath);
                        overwrite = true;
                        motionMasterClient.requestSetDeviceFile(deviceAddress, name_2, content, overwrite, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 14;
                case 14:
                    {
                        exitOnMessageReceived(messageId);
                        name_3 = args[0];
                        motionMasterClient.requestDeleteDeviceFile(deviceAddress, name_3, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 15;
                case 15:
                    {
                        exitOnMessageReceived(messageId);
                        motionMasterClient.requestResetDeviceFault(deviceAddress, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 16;
                case 16:
                    {
                        motionMasterClient.requestStopDevice(deviceAddress, messageId);
                        process.exit(ExitStatus.SUCCESS);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 17;
                case 17:
                    {
                        exitOnMessageReceived(messageId, 120000, util_2.MotionMasterMessage.Status.DeviceFirmwareInstallation.Success.Code.DONE);
                        filepath = args[0];
                        firmwarePackageContent = fs_1.default.readFileSync(filepath);
                        motionMasterClient.requestStartDeviceFirmwareInstallation(deviceAddress, firmwarePackageContent, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 18;
                case 18:
                    {
                        exitOnMessageReceived(messageId);
                        getDeviceLog = { deviceAddress: deviceAddress };
                        motionMasterClient.sendRequest({ getDeviceLog: getDeviceLog }, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 19;
                case 19:
                    {
                        exitOnMessageReceived(messageId, 300000, util_2.MotionMasterMessage.Status.CoggingTorqueRecording.Success.Code.DONE);
                        skipAutoTuning = parseInt(args[0], 10) !== 0;
                        motionMasterClient.requestStartCoggingTorqueRecording(deviceAddress, skipAutoTuning, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 20;
                case 20:
                    {
                        exitOnMessageReceived(messageId);
                        motionMasterClient.requestGetCoggingTorqueData(deviceAddress, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 21;
                case 21:
                    {
                        exitOnMessageReceived(messageId, 180000, util_2.MotionMasterMessage.Status.OffsetDetection.Success.Code.DONE);
                        motionMasterClient.requestStartOffsetDetection(deviceAddress, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 22;
                case 22:
                    {
                        exitOnMessageReceived(messageId, 60000, util_2.MotionMasterMessage.Status.PlantIdentification.Success.Code.DONE);
                        durationSeconds = parseFloat(args[0]);
                        torqueAmplitude = parseInt(args[1], 10);
                        startFrequency = parseInt(args[2], 10);
                        endFrequency = parseInt(args[3], 10);
                        cutoffFrequency = parseInt(args[4], 10);
                        motionMasterClient.requestStartPlantIdentification(deviceAddress, durationSeconds, torqueAmplitude, startFrequency, endFrequency, cutoffFrequency, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 23;
                case 23:
                    {
                        computeAutoTuningGainsType = args[0];
                        switch (computeAutoTuningGainsType) {
                            case 'positionParameters': {
                                exitOnMessageReceived(messageId, 10000, util_2.MotionMasterMessage.Status.AutoTuning.Success.Code.POSITION_DONE);
                                controllerType = parseInt(args[1], 10);
                                settlingTime = parseFloat(args[2]);
                                positionDamping = parseFloat(args[3]);
                                alphaMult = parseInt(args[4], 10);
                                order = parseInt(args[5], 10);
                                lb = parseFloat(args[6]);
                                ub = parseFloat(args[7]);
                                computeAutoTuningGains = {
                                    deviceAddress: deviceAddress,
                                    positionParameters: {
                                        controllerType: controllerType,
                                        settlingTime: settlingTime,
                                        positionDamping: positionDamping,
                                        alphaMult: alphaMult,
                                        order: order,
                                        lb: lb,
                                        ub: ub,
                                    },
                                };
                                motionMasterClient.sendRequest({ computeAutoTuningGains: computeAutoTuningGains }, messageId);
                                break;
                            }
                            case 'velocityParameters': {
                                exitOnMessageReceived(messageId, 10000, util_2.MotionMasterMessage.Status.AutoTuning.Success.Code.VELOCITY_DONE);
                                velocityLoopBandwidth = parseFloat(args[1]);
                                velocityDamping = parseFloat(args[2]);
                                computeAutoTuningGains = {
                                    deviceAddress: deviceAddress,
                                    velocityParameters: {
                                        velocityLoopBandwidth: velocityLoopBandwidth,
                                        velocityDamping: velocityDamping,
                                    },
                                };
                                motionMasterClient.sendRequest({ computeAutoTuningGains: computeAutoTuningGains }, messageId);
                                break;
                            }
                            default: {
                                throw new Error("Unknown compute auto-tuning gains type: " + computeAutoTuningGainsType);
                            }
                        }
                        return [3 /*break*/, 45];
                    }
                    _b.label = 24;
                case 24:
                    {
                        target = parseInt(args[0], 10);
                        setMotionControllerParameters = {
                            deviceAddress: deviceAddress,
                            target: target,
                        };
                        motionMasterClient.sendRequest({ setMotionControllerParameters: setMotionControllerParameters }, messageId);
                        process.exit(ExitStatus.SUCCESS);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 25;
                case 25:
                    {
                        exitOnMessageReceived(messageId);
                        controllerType = parseInt(args[0], 10);
                        filter = parseInt(args[1], 10) !== 0;
                        motionMasterClient.requestEnableMotionController(deviceAddress, controllerType, filter, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 26;
                case 26:
                    {
                        motionMasterClient.requestDisableMotionController(deviceAddress, messageId);
                        process.exit(ExitStatus.SUCCESS);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 27;
                case 27:
                    {
                        signalGeneratorType = args[0];
                        setSignalGeneratorParameters = { deviceAddress: deviceAddress };
                        switch (signalGeneratorType) {
                            case 'positionStepResponse': {
                                target = parseInt(args[1], 10);
                                sustainTime = parseInt(args[2], 10);
                                setSignalGeneratorParameters.positionStepResponse = {
                                    target: target,
                                    sustainTime: sustainTime,
                                };
                                break;
                            }
                            case 'positionAdvancedStepResponse': {
                                target = parseInt(args[1], 10);
                                sustainTime = parseInt(args[2], 10);
                                repeat = parseInt(args[3], 10) !== 0;
                                setSignalGeneratorParameters.positionAdvancedStepResponse = {
                                    target: target,
                                    sustainTime: sustainTime,
                                    repeat: repeat,
                                };
                                break;
                            }
                            case 'positionRamp': {
                                target = parseInt(args[1], 10);
                                profileVelocity = parseInt(args[2], 10);
                                profileAcceleration = parseInt(args[3], 10);
                                profileDeceleration = parseInt(args[4], 10);
                                sustainTime = parseInt(args[5], 10);
                                setSignalGeneratorParameters.positionRamp = {
                                    target: target,
                                    profileVelocity: profileVelocity,
                                    profileAcceleration: profileAcceleration,
                                    profileDeceleration: profileDeceleration,
                                    sustainTime: sustainTime,
                                };
                                break;
                            }
                            case 'positionTrapezoidal': {
                                target = parseInt(args[1], 10);
                                profileVelocity = parseInt(args[2], 10);
                                profileAcceleration = parseInt(args[3], 10);
                                profileDeceleration = parseInt(args[4], 10);
                                sustainTime = parseInt(args[5], 10);
                                repeat = parseInt(args[6], 10) !== 0;
                                setSignalGeneratorParameters.positionTrapezoidal = {
                                    target: target,
                                    profileVelocity: profileVelocity,
                                    profileAcceleration: profileAcceleration,
                                    profileDeceleration: profileDeceleration,
                                    sustainTime: sustainTime,
                                    repeat: repeat,
                                };
                                break;
                            }
                            case 'positionBidirectional': {
                                target = parseInt(args[1], 10);
                                profileVelocity = parseInt(args[2], 10);
                                profileAcceleration = parseInt(args[3], 10);
                                profileDeceleration = parseInt(args[4], 10);
                                sustainTime = parseInt(args[5], 10);
                                repeat = parseInt(args[6], 10) !== 0;
                                setSignalGeneratorParameters.positionBidirectional = {
                                    target: target,
                                    profileVelocity: profileVelocity,
                                    profileAcceleration: profileAcceleration,
                                    profileDeceleration: profileDeceleration,
                                    sustainTime: sustainTime,
                                    repeat: repeat,
                                };
                                break;
                            }
                            case 'positionSineWave': {
                                amplitude = parseInt(args[1], 10);
                                frequency = parseFloat(args[2]);
                                repeat = parseInt(args[3], 10) !== 0;
                                setSignalGeneratorParameters.positionSineWave = {
                                    amplitude: amplitude,
                                    frequency: frequency,
                                    repeat: repeat,
                                };
                                break;
                            }
                            case 'velocityStepResponse': {
                                target = parseInt(args[1], 10);
                                sustainTime = parseInt(args[2], 10);
                                setSignalGeneratorParameters.velocityStepResponse = {
                                    target: target,
                                    sustainTime: sustainTime,
                                };
                                break;
                            }
                            case 'velocityAdvancedStepResponse': {
                                target = parseInt(args[1], 10);
                                sustainTime = parseInt(args[2], 10);
                                repeat = parseInt(args[3], 10) !== 0;
                                setSignalGeneratorParameters.velocityAdvancedStepResponse = {
                                    target: target,
                                    sustainTime: sustainTime,
                                    repeat: repeat,
                                };
                                break;
                            }
                            case 'velocityRamp': {
                                target = parseInt(args[1], 10);
                                profileAcceleration = parseInt(args[2], 10);
                                profileDeceleration = parseInt(args[3], 10);
                                sustainTime = parseInt(args[4], 10);
                                setSignalGeneratorParameters.velocityRamp = {
                                    target: target,
                                    profileAcceleration: profileAcceleration,
                                    profileDeceleration: profileDeceleration,
                                    sustainTime: sustainTime,
                                };
                                break;
                            }
                            case 'velocityTrapezoidal': {
                                target = parseInt(args[1], 10);
                                profileAcceleration = parseInt(args[2], 10);
                                profileDeceleration = parseInt(args[3], 10);
                                sustainTime = parseInt(args[4], 10);
                                repeat = parseInt(args[5], 10) !== 0;
                                setSignalGeneratorParameters.velocityTrapezoidal = {
                                    target: target,
                                    profileAcceleration: profileAcceleration,
                                    profileDeceleration: profileDeceleration,
                                    sustainTime: sustainTime,
                                    repeat: repeat,
                                };
                                break;
                            }
                            case 'velocityBidirectional': {
                                target = parseInt(args[1], 10);
                                profileAcceleration = parseInt(args[2], 10);
                                profileDeceleration = parseInt(args[3], 10);
                                sustainTime = parseInt(args[4], 10);
                                repeat = parseInt(args[5], 10) !== 0;
                                setSignalGeneratorParameters.velocityBidirectional = {
                                    target: target,
                                    profileAcceleration: profileAcceleration,
                                    profileDeceleration: profileDeceleration,
                                    sustainTime: sustainTime,
                                    repeat: repeat,
                                };
                                break;
                            }
                            case 'velocitySineWave': {
                                amplitude = parseInt(args[1], 10);
                                frequency = parseFloat(args[2]);
                                repeat = parseInt(args[3], 10) !== 0;
                                setSignalGeneratorParameters.velocitySineWave = {
                                    amplitude: amplitude,
                                    frequency: frequency,
                                    repeat: repeat,
                                };
                                break;
                            }
                            case 'torqueStepResponse': {
                                target = parseInt(args[1], 10);
                                sustainTime = parseInt(args[2], 10);
                                setSignalGeneratorParameters.torqueStepResponse = {
                                    target: target,
                                    sustainTime: sustainTime,
                                };
                                break;
                            }
                            case 'torqueAdvancedStepResponse': {
                                target = parseInt(args[1], 10);
                                sustainTime = parseInt(args[2], 10);
                                repeat = parseInt(args[3], 10) !== 0;
                                setSignalGeneratorParameters.torqueAdvancedStepResponse = {
                                    target: target,
                                    sustainTime: sustainTime,
                                    repeat: repeat,
                                };
                                break;
                            }
                            case 'torqueRamp': {
                                target = parseInt(args[1], 10);
                                torqueSlope = parseInt(args[2], 10);
                                sustainTime = parseInt(args[3], 10);
                                setSignalGeneratorParameters.torqueRamp = {
                                    target: target,
                                    torqueSlope: torqueSlope,
                                    sustainTime: sustainTime,
                                };
                                break;
                            }
                            case 'torqueTrapezoidal': {
                                target = parseInt(args[1], 10);
                                torqueSlope = parseInt(args[2], 10);
                                sustainTime = parseInt(args[3], 10);
                                repeat = parseInt(args[4], 10) !== 0;
                                setSignalGeneratorParameters.torqueTrapezoidal = {
                                    target: target,
                                    torqueSlope: torqueSlope,
                                    sustainTime: sustainTime,
                                    repeat: repeat,
                                };
                                break;
                            }
                            case 'torqueBidirectional': {
                                target = parseInt(args[1], 10);
                                torqueSlope = parseInt(args[2], 10);
                                sustainTime = parseInt(args[3], 10);
                                repeat = parseInt(args[4], 10) !== 0;
                                setSignalGeneratorParameters.torqueBidirectional = {
                                    target: target,
                                    torqueSlope: torqueSlope,
                                    sustainTime: sustainTime,
                                    repeat: repeat,
                                };
                                break;
                            }
                            case 'torqueSineWave': {
                                amplitude = parseInt(args[1], 10);
                                frequency = parseFloat(args[2]);
                                repeat = parseInt(args[3], 10) !== 0;
                                setSignalGeneratorParameters.torqueSineWave = {
                                    amplitude: amplitude,
                                    frequency: frequency,
                                    repeat: repeat,
                                };
                                break;
                            }
                            default: {
                                throw new Error("Unknown set signal generator parameters type: " + signalGeneratorType);
                            }
                        }
                        motionMasterClient.sendRequest({ setSignalGeneratorParameters: setSignalGeneratorParameters }, messageId);
                        process.exit(ExitStatus.SUCCESS);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 28;
                case 28:
                    {
                        exitOnMessageReceived(messageId, 2147483647, util_2.MotionMasterMessage.Status.SignalGenerator.Success.Code.DONE);
                        motionMasterClient.requestStartSignalGenerator(deviceAddress, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 29;
                case 29:
                    {
                        motionMasterClient.requestStopSignalGenerator(deviceAddress, messageId);
                        process.exit(ExitStatus.SUCCESS);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 30;
                case 30:
                    {
                        parameters = args.slice(1).map(paramToIndexSubindex);
                        validateParameters(parameters);
                        getDeviceParameterValues = { deviceAddress: deviceAddress, parameters: parameters };
                        topic = args[0];
                        requestStartMonitoringDeviceParameterValues({ getDeviceParameterValues: getDeviceParameterValues, interval: cmd.interval, topic: topic });
                        return [3 /*break*/, 45];
                    }
                    _b.label = 31;
                case 31:
                    {
                        startMonitoringRequestId = args[0];
                        motionMasterClient.requestStopMonitoringDeviceParameterValues(startMonitoringRequestId, messageId);
                        process.exit(ExitStatus.SUCCESS);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 32;
                case 32:
                    {
                        exitOnMessageReceived(messageId);
                        motionMasterClient.requestGetEthercatNetworkState(deviceAddress, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 33;
                case 33:
                    {
                        exitOnMessageReceived(messageId);
                        state = parseInt(args[0], 10);
                        motionMasterClient.requestSetEthercatNetworkState(deviceAddress, state, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 34;
                case 34:
                    {
                        exitOnMessageReceived(messageId, 180000, util_2.MotionMasterMessage.Status.NarrowAngleCalibration.Success.Code.DONE);
                        motionMasterClient.requestStartNarrowAngleCalibration(deviceAddress);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 35;
                case 35:
                    {
                        timeoutMs = parseInt(args[0], 10);
                        motionMasterClient.requestSetSystemClientTimeout(timeoutMs, messageId);
                        process.exit(ExitStatus.SUCCESS);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 36;
                case 36:
                    {
                        exitOnMessageReceived(messageId, 60000, util_2.MotionMasterMessage.Status.SystemIdentification.Success.Code.DONE);
                        durationSeconds = parseFloat(args[0]);
                        torqueAmplitude = parseInt(args[1], 10);
                        startFrequency = parseFloat(args[2]);
                        endFrequency = parseFloat(args[3]);
                        motionMasterClient.requestStartSystemIdentification(deviceAddress, durationSeconds, torqueAmplitude, startFrequency, endFrequency, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 37;
                case 37:
                    {
                        exitOnMessageReceived(messageId);
                        encoderPort = parseInt(args[0], 10);
                        motionMasterClient.requestGetCirculoEncoderMagnetDistance(deviceAddress, encoderPort, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 38;
                case 38:
                    {
                        exitOnMessageReceived(messageId, 60000, util_2.MotionMasterMessage.Status.CirculoEncoderNarrowAngleCalibrationProcedure.Success.Code.DONE);
                        encoderPort = parseInt(args[0], 10);
                        motionMasterClient.requestStartCirculoEncoderNarrowAngleCalibrationProcedure(deviceAddress, encoderPort, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 39;
                case 39:
                    {
                        exitOnMessageReceived(messageId);
                        motionMasterClient.requestGetDeviceCia402State(deviceAddress, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 40;
                case 40:
                    {
                        exitOnMessageReceived(messageId);
                        state = parseInt(args[0], 10);
                        motionMasterClient.requestSetDeviceCia402State(deviceAddress, state, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 41;
                case 41:
                    {
                        exitOnMessageReceived(messageId);
                        motionMasterClient.requestGetSystemLog(messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 42;
                case 42:
                    {
                        exitOnMessageReceived(messageId, 120000, util_2.MotionMasterMessage.Status.DeviceSiiRestore.Success.Code.DONE);
                        devicePosition = parseInt(args[0], 10);
                        filepath = args[1];
                        firmwarePackageContent = fs_1.default.readFileSync(filepath);
                        motionMasterClient.requestStartDeviceSiiRestore(devicePosition, firmwarePackageContent, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 43;
                case 43:
                    {
                        exitOnMessageReceived(messageId, 2147483647, util_2.MotionMasterMessage.Status.OpenLoopFieldControl.Success.Code.DONE);
                        properties = {
                            deviceAddress: deviceAddress,
                            angle: parseInt(args[0], 10),
                            velocity: parseInt(args[1], 10),
                            acceleration: parseInt(args[2], 10),
                            torque: parseInt(args[3], 10),
                            torqueSpeed: parseInt(args[4], 10),
                        };
                        motionMasterClient.requestStartOpenLoopFieldControl(properties, messageId);
                        return [3 /*break*/, 45];
                    }
                    _b.label = 44;
                case 44:
                    {
                        throw new Error("Request \"" + type + "\" doesn't exist");
                    }
                    _b.label = 45;
                case 45: return [2 /*return*/];
            }
        });
    });
}
function uploadAction(params, cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var deviceAddress, sendProgress, messageId, parameters, getDeviceParameterValues;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectToMotionMaster(cmd.parent);
                    return [4 /*yield*/, getCommandDeviceAddressAsync(cmd.parent)];
                case 1:
                    deviceAddress = _a.sent();
                    sendProgress = cmd.sendProgress;
                    messageId = uuid_1.v4();
                    printOnMessageReceived(messageId, cmd.parent.outputFormat);
                    exitOnMessageReceived(messageId);
                    parameters = params.map(paramToIndexSubindex);
                    validateParameters(parameters);
                    getDeviceParameterValues = { deviceAddress: deviceAddress, parameters: parameters, sendProgress: sendProgress };
                    motionMasterClient.sendRequest({ getDeviceParameterValues: getDeviceParameterValues }, messageId);
                    return [2 /*return*/];
            }
        });
    });
}
function downloadAction(paramValues, cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var deviceAddress, messageId, deviceParameterInfo, parameterValues, setDeviceParameterValues;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectToMotionMaster(cmd.parent);
                    return [4 /*yield*/, getCommandDeviceAddressAsync(cmd.parent)];
                case 1:
                    deviceAddress = _a.sent();
                    messageId = uuid_1.v4();
                    printOnMessageReceived(messageId, cmd.parent.outputFormat);
                    exitOnMessageReceived(messageId);
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
function getDeviceFileContentAction(name, cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var deviceAddress, messageId, getDeviceFile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectToMotionMaster(cmd.parent);
                    return [4 /*yield*/, getCommandDeviceAddressAsync(cmd.parent)];
                case 1:
                    deviceAddress = _a.sent();
                    messageId = uuid_1.v4();
                    motionMasterClient.selectMessage(messageId).pipe(operators_1.first()).subscribe(function (message) {
                        if (message && message.status && message.status.deviceFile) {
                            var error = message.status.deviceFile.error;
                            if (error) {
                                throw new Error(error.code + ": " + error.message);
                            }
                            else {
                                var content = message.status.deviceFile.content;
                                if (content) {
                                    var contentDecoded = new string_decoder_1.StringDecoder('utf-8').write(Buffer.from(content));
                                    console.log(contentDecoded);
                                    process.exit(ExitStatus.SUCCESS);
                                }
                                else {
                                    throw new Error('Device file content is empty');
                                }
                            }
                        }
                        else {
                            throw new Error('The received message is not "deviceFile"');
                        }
                    });
                    getDeviceFile = { deviceAddress: deviceAddress, name: name };
                    motionMasterClient.sendRequest({ getDeviceFile: getDeviceFile }, messageId);
                    return [2 /*return*/];
            }
        });
    });
}
function getDeviceLogContentAction(cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var deviceAddress, messageId, getDeviceLog;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectToMotionMaster(cmd.parent);
                    return [4 /*yield*/, getCommandDeviceAddressAsync(cmd.parent)];
                case 1:
                    deviceAddress = _a.sent();
                    messageId = uuid_1.v4();
                    motionMasterClient.selectMessage(messageId).pipe(operators_1.first()).subscribe(function (message) {
                        if (message && message.status && message.status.deviceLog) {
                            var error = message.status.deviceLog.error;
                            if (error) {
                                throw new Error(error.code + ": " + error.message);
                            }
                            else {
                                var content = message.status.deviceLog.content;
                                if (content) {
                                    var contentDecoded = new string_decoder_1.StringDecoder('utf-8').write(Buffer.from(content));
                                    console.log(contentDecoded);
                                    process.exit(ExitStatus.SUCCESS);
                                }
                                else {
                                    throw new Error('Device log content is empty');
                                }
                            }
                        }
                        else {
                            throw new Error('The received message is not "deviceLog"');
                        }
                    });
                    getDeviceLog = { deviceAddress: deviceAddress };
                    motionMasterClient.sendRequest({ getDeviceLog: getDeviceLog }, messageId);
                    return [2 /*return*/];
            }
        });
    });
}
function getCoggingTorqueDataContent(cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var deviceAddress, messageId, getCoggingTorqueData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectToMotionMaster(cmd.parent);
                    return [4 /*yield*/, getCommandDeviceAddressAsync(cmd.parent)];
                case 1:
                    deviceAddress = _a.sent();
                    messageId = uuid_1.v4();
                    motionMasterClient.selectMessage(messageId).pipe(operators_1.first()).subscribe(function (message) {
                        if (message && message.status && message.status.coggingTorqueData) {
                            var error = message.status.coggingTorqueData.error;
                            if (error) {
                                throw new Error(error.code + ": " + error.message);
                            }
                            else {
                                var table = message.status.coggingTorqueData.table;
                                if (table && table.data) {
                                    console.log(table.data.join(', '));
                                    process.exit(ExitStatus.SUCCESS);
                                }
                                else {
                                    throw new Error('Cogging torque table content data is empty');
                                }
                            }
                        }
                        else {
                            throw new Error('The received message is not "coggingTorqueData"');
                        }
                    });
                    getCoggingTorqueData = { deviceAddress: deviceAddress };
                    motionMasterClient.sendRequest({ getCoggingTorqueData: getCoggingTorqueData }, messageId);
                    return [2 /*return*/];
            }
        });
    });
}
function startOffsetDetectionAction(cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var messageId, deviceAddress, startOffsetDetection;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectToMotionMaster(cmd.parent);
                    messageId = uuid_1.v4();
                    printOnMessageReceived(messageId, cmd.parent.outputFormat);
                    exitOnMessageReceived(messageId, 180000, util_2.MotionMasterMessage.Status.OffsetDetection.Success.Code.DONE);
                    return [4 /*yield*/, getCommandDeviceAddressAsync(cmd.parent)];
                case 1:
                    deviceAddress = _a.sent();
                    startOffsetDetection = { deviceAddress: deviceAddress };
                    motionMasterClient.sendRequest({ startOffsetDetection: startOffsetDetection }, messageId);
                    return [2 /*return*/];
            }
        });
    });
}
function startCoggingTorqueRecordingAction(cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var messageId, deviceAddress, skipAutoTuning, startCoggingTorqueRecording;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectToMotionMaster(cmd.parent);
                    messageId = uuid_1.v4();
                    printOnMessageReceived(messageId, cmd.parent.outputFormat);
                    exitOnMessageReceived(messageId, 300000, util_2.MotionMasterMessage.Status.CoggingTorqueRecording.Success.Code.DONE);
                    return [4 /*yield*/, getCommandDeviceAddressAsync(cmd.parent)];
                case 1:
                    deviceAddress = _a.sent();
                    skipAutoTuning = cmd.skipAutoTuning;
                    startCoggingTorqueRecording = { deviceAddress: deviceAddress, skipAutoTuning: skipAutoTuning };
                    motionMasterClient.sendRequest({ startCoggingTorqueRecording: startCoggingTorqueRecording }, messageId);
                    return [2 /*return*/];
            }
        });
    });
}
function startPlantIdentificationAction(durationSeconds, torqueAmplitude, startFrequency, endFrequency, cutoffFrequency, cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var deviceAddress, messageId, startPlantIdentification;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectToMotionMaster(cmd.parent);
                    return [4 /*yield*/, getCommandDeviceAddressAsync(cmd.parent)];
                case 1:
                    deviceAddress = _a.sent();
                    messageId = uuid_1.v4();
                    printOnMessageReceived(messageId, cmd.parent.outputFormat);
                    exitOnMessageReceived(messageId, 60000, util_2.MotionMasterMessage.Status.PlantIdentification.Success.Code.DONE);
                    durationSeconds = parseFloat(durationSeconds);
                    torqueAmplitude = parseInt(torqueAmplitude, 10);
                    startFrequency = parseInt(startFrequency, 10);
                    endFrequency = parseInt(endFrequency, 10);
                    cutoffFrequency = parseInt(cutoffFrequency, 10);
                    startPlantIdentification = {
                        deviceAddress: deviceAddress,
                        durationSeconds: durationSeconds,
                        torqueAmplitude: torqueAmplitude,
                        startFrequency: startFrequency,
                        endFrequency: endFrequency,
                        cutoffFrequency: cutoffFrequency,
                    };
                    motionMasterClient.sendRequest({ startPlantIdentification: startPlantIdentification }, messageId);
                    return [2 /*return*/];
            }
        });
    });
}
function startSystemIdentificationAction(durationSeconds, torqueAmplitude, startFrequency, endFrequency, cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var deviceAddress, messageId, startSystemIdentification;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectToMotionMaster(cmd.parent);
                    return [4 /*yield*/, getCommandDeviceAddressAsync(cmd.parent)];
                case 1:
                    deviceAddress = _a.sent();
                    messageId = uuid_1.v4();
                    printOnMessageReceived(messageId, cmd.parent.outputFormat);
                    exitOnMessageReceived(messageId, 60000, util_2.MotionMasterMessage.Status.SystemIdentification.Success.Code.DONE);
                    durationSeconds = parseFloat(durationSeconds);
                    torqueAmplitude = parseInt(torqueAmplitude, 10);
                    startFrequency = parseFloat(startFrequency);
                    endFrequency = parseFloat(endFrequency);
                    startSystemIdentification = {
                        deviceAddress: deviceAddress,
                        durationSeconds: durationSeconds,
                        torqueAmplitude: torqueAmplitude,
                        startFrequency: startFrequency,
                        endFrequency: endFrequency,
                    };
                    motionMasterClient.sendRequest({ startSystemIdentification: startSystemIdentification }, messageId);
                    return [2 /*return*/];
            }
        });
    });
}
function startCirculoEncoderNarrowAngleCalibrationProcedureAction(encoderPort, cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var deviceAddress, messageId, startCirculoEncoderNarrowAngleCalibrationProcedure;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectToMotionMaster(cmd.parent);
                    return [4 /*yield*/, getCommandDeviceAddressAsync(cmd.parent)];
                case 1:
                    deviceAddress = _a.sent();
                    messageId = uuid_1.v4();
                    printOnMessageReceived(messageId, cmd.parent.outputFormat);
                    exitOnMessageReceived(messageId, 60000, util_2.MotionMasterMessage.Status.CirculoEncoderNarrowAngleCalibrationProcedure.Success.Code.DONE);
                    encoderPort = parseInt(encoderPort, 10);
                    startCirculoEncoderNarrowAngleCalibrationProcedure = {
                        deviceAddress: deviceAddress,
                        encoderPort: encoderPort,
                    };
                    motionMasterClient.sendRequest({ startCirculoEncoderNarrowAngleCalibrationProcedure: startCirculoEncoderNarrowAngleCalibrationProcedure }, messageId);
                    return [2 /*return*/];
            }
        });
    });
}
function monitorAction(topic, params, cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var deviceAddress, parameters, getDeviceParameterValues;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectToMotionMaster(cmd.parent);
                    return [4 /*yield*/, getCommandDeviceAddressAsync(cmd.parent)];
                case 1:
                    deviceAddress = _a.sent();
                    parameters = params.map(paramToIndexSubindex);
                    getDeviceParameterValues = { deviceAddress: deviceAddress, parameters: parameters };
                    requestStartMonitoringDeviceParameterValues({ getDeviceParameterValues: getDeviceParameterValues, interval: cmd.interval, topic: topic });
                    return [2 /*return*/];
            }
        });
    });
}
//
// helper functions
//
function connectToMotionMaster(cmd) {
    if (cmd.config) {
        var contents = fs_1.default.readFileSync(cmd.config, { encoding: 'utf8' });
        var json = JSON.parse(contents);
        Object.assign(config, json);
    }
    // ping Motion Master in regular intervals
    var pingSystemInterval = rxjs_1.interval(config.pingSystemInterval);
    pingSystemInterval.subscribe(function () { return motionMasterClient.sendRequest({ pingSystem: {} }); });
    // connect to server endpoint
    var serverSocket = zeromq_1.default.socket('dealer');
    debug("Using identity for ZeroMQ DEALER socket: " + config.identity);
    serverSocket.identity = config.identity;
    serverSocket.connect(config.serverEndpoint);
    debug("Connected to ZeroMQ DEALER socket server endpoint: " + config.serverEndpoint);
    // feed data coming from Motion Master to MotionMasterClient
    serverSocket.on('message', function (data) {
        motionMasterClient.input$.next(util_2.decodeMotionMasterMessage(data));
    });
    // send data fed from MotionMasterClient to Motion Master
    motionMasterClient.output$.subscribe(function (message) {
        // log outgoing messages and skip ping messages
        if (!(message && message.request && message.request.pingSystem)) {
            debug(util_1.default.inspect(message, inspectOptions));
        }
        serverSocket.send(Buffer.from(util_2.encodeMotionMasterMessage(message)));
    });
    // connnect to notification endpoint
    var notificationSocket = zeromq_1.default.socket('sub').connect(config.notificationEndpoint);
    debug("Connected to ZeroMQ SUB socket notification endpoint: " + config.notificationEndpoint);
    // subscribe to all topics
    notificationSocket.subscribe('');
    // exit process when a heartbeat message is not received for more than the time specified
    motionMasterClient.selectMessageStatus('systemPong').pipe(operators_1.timeout(config.motionMasterHeartbeatTimeoutDue)).subscribe({
        error: function (err) {
            console.error(err.name + ": Heartbeat message not received for more than " + config.motionMasterHeartbeatTimeoutDue + " ms. Check if Motion Master process is running.");
            process.exit(ExitStatus.TIMEOUT);
        },
    });
    // feed notification data coming from Motion Master to MotionMasterNotification
    notificationSocket.on('message', function (topic, message) {
        motionMasterNotification.input$.next({ topic: topic.toString(), messages: [util_2.decodeMotionMasterMessage(message)] });
    });
}
function requestStartMonitoringDeviceParameterValues(startMonitoringDeviceParameterValues) {
    var messageId = uuid_1.v4();
    motionMasterNotification.selectMessagesByTopic(startMonitoringDeviceParameterValues.topic || '').subscribe(function (messages) {
        var timestamp = Date.now();
        var topic = startMonitoringDeviceParameterValues.topic;
        console.log(util_1.default.inspect({ timestamp: timestamp, topic: topic, messages: messages }, inspectOptions));
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
                    return [4 /*yield*/, motionMasterClient.selectMessage(messageId).pipe(operators_1.first(), operators_1.map(function (message) { return message && message.status ? message.status.deviceParameterInfo : null; })).toPromise()];
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
                var VT = util_2.MotionMasterMessage.Status.DeviceParameterInfo.Parameter.ValueType;
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
function validateParameters(parameters) {
    var error = null;
    if (parameters.some(function (p) { return p.index === 0; })) {
        error = new Error('Parameter with index 0 is requested.');
    }
    if (parameters.some(function (p) { return isNaN(p.index) || isNaN(p.subindex); })) {
        error = new Error('Parameter with unparsable index or subindex is requested.');
    }
    if (error) {
        error.message += '\nExample of correct formats: "0x2002 0x100A:0 0x2003:4".';
        console.error(error.name + ": " + error.message);
        console.error(util_1.default.inspect(parameters, inspectOptions));
        process.exit(ExitStatus.INCORRECT_PARAMETER_FORMAT);
    }
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
                    return [4 /*yield*/, motionMasterClient.selectDeviceAtPosition(cmd.devicePosition).toPromise()];
                case 2:
                    device = _a.sent();
                    if (device) {
                        return [2 /*return*/, device.deviceAddress];
                    }
                    else {
                        console.warn("WARNING: Cannot get device at position " + cmd.devicePosition + " or device list is empty.");
                        return [2 /*return*/, null];
                    }
                    return [3 /*break*/, 4];
                case 3: return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function exitOnMessageReceived(messageId, due, exitOnSuccessCode) {
    if (due === void 0) { due = 10000; }
    motionMasterClient.selectMessage(messageId).pipe(operators_1.first(function (message) {
        if (exitOnSuccessCode === undefined) {
            return true;
        }
        else {
            if (message && message.status) {
                var key = Object.keys(message.status)[0];
                var status_1 = message.status[key];
                if (status_1 && ((status_1.success && status_1.success.code === exitOnSuccessCode) || status_1.error)) {
                    return true;
                }
            }
            return false;
        }
    }), operators_1.timeout(due)).subscribe({
        next: function () {
            debug("Exit on message received " + messageId);
            process.exit(ExitStatus.SUCCESS);
        },
        error: function (err) {
            console.error(err.name + ": Status message " + messageId + " not received for more than " + due + " ms.");
            process.exit(ExitStatus.TIMEOUT);
        },
    });
}
function printOnMessageReceived(messageId, outputFormat) {
    if (outputFormat === void 0) { outputFormat = 'inspect'; }
    motionMasterClient.selectMessage(messageId).subscribe(function (message) {
        var timestamp = Date.now();
        var outputObj = { timestamp: timestamp, message: message };
        switch (outputFormat) {
            case 'json': {
                console.log(JSON.stringify(outputObj));
                break;
            }
            case 'yaml': {
                console.log(yaml_1.default.stringify(outputObj));
                break;
            }
            default: {
                console.log(util_1.default.inspect(outputObj, inspectOptions));
            }
        }
    });
}
function parseOptionValueAsInt(value) {
    return parseInt(value, 10);
}
//# sourceMappingURL=cli.js.map