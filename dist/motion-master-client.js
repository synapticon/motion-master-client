"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var motion_master_proto_1 = require("motion-master-proto");
var operators_1 = require("rxjs/operators");
var uuid_1 = require("uuid");
function encodeRequest(request, id) {
    if (!id) {
        id = uuid_1.v4();
    }
    var message = motion_master_proto_1.motionmaster.MotionMasterMessage.create({ id: id, request: request });
    return motion_master_proto_1.motionmaster.MotionMasterMessage.encode(message).finish();
}
exports.encodeRequest = encodeRequest;
function decodeMotionMasterMessage(buffer) {
    return motion_master_proto_1.motionmaster.MotionMasterMessage.decode(new Uint8Array(buffer));
}
exports.decodeMotionMasterMessage = decodeMotionMasterMessage;
var MotionMasterClient = /** @class */ (function () {
    function MotionMasterClient(input, output, notification) {
        this.input = input;
        this.output = output;
        this.notification = notification;
        this.motionMasterMessage$ = this.input.pipe(operators_1.map(decodeMotionMasterMessage));
        this.status$ = this.motionMasterMessage$.pipe(operators_1.map(function (message) { return message.status; }));
        this.systemPong$ = this.selectStatus('systemPong');
        this.systemVersion$ = this.selectStatus('systemVersion');
        this.systemEvent$ = this.selectStatus('systemEvent');
        this.deviceInfo$ = this.selectStatus('deviceInfo');
        this.deviceParameterInfo$ = this.selectStatus('deviceParameterInfo');
        this.deviceParameterValues$ = this.selectStatus('deviceParameterValues');
        this.multiDeviceParameterValues$ = this.selectStatus('multiDeviceParameterValues');
        this.deviceFileList$ = this.selectStatus('deviceFileList');
        this.deviceFile$ = this.selectStatus('deviceFile');
        this.deviceEvent$ = this.selectStatus('deviceEvent');
        this.deviceFirmwareInstallation$ = this.selectStatus('deviceFirmwareInstallation');
        this.deviceLog$ = this.selectStatus('deviceLog');
        this.deviceFaultReset$ = this.selectStatus('deviceFaultReset');
        this.coggingTorqueRecording$ = this.selectStatus('coggingTorqueRecording');
        this.coggingTorqueData$ = this.selectStatus('coggingTorqueData');
        this.offsetDetection$ = this.selectStatus('offsetDetection');
        this.plantIdentification$ = this.selectStatus('plantIdentification');
        this.autoTuning$ = this.selectStatus('autoTuning');
        this.motionController$ = this.selectStatus('motionController');
        this.signalGenerator$ = this.selectStatus('signalGenerator');
        this.monitoringParameterValues$ = this.selectStatus('monitoringParameterValues');
    }
    MotionMasterClient.prototype.requestPingSystem = function (messageId) {
        var pingSystem = {};
        this.sendRequest({ pingSystem: pingSystem }, messageId);
    };
    MotionMasterClient.prototype.requestGetSystemVersion = function (messageId) {
        var getSystemVersion = {};
        this.sendRequest({ getSystemVersion: getSystemVersion }, messageId);
    };
    MotionMasterClient.prototype.requestGetDeviceInfo = function (messageId) {
        var getDeviceInfo = {};
        this.sendRequest({ getDeviceInfo: getDeviceInfo }, messageId);
    };
    MotionMasterClient.prototype.requestGetDeviceParameterInfo = function (deviceAddress, messageId) {
        var getDeviceParameterInfo = { deviceAddress: deviceAddress };
        this.sendRequest({ getDeviceParameterInfo: getDeviceParameterInfo }, messageId);
    };
    MotionMasterClient.prototype.requestGetDeviceParameterValues = function (deviceAddress, parameters, messageId) {
        var getDeviceParameterValues = { deviceAddress: deviceAddress, parameters: parameters };
        this.sendRequest({ getDeviceParameterValues: getDeviceParameterValues }, messageId);
    };
    MotionMasterClient.prototype.requestSetDeviceParameterValues = function (deviceAddress, parameterValues, messageId) {
        var setDeviceParameterValues = { deviceAddress: deviceAddress, parameterValues: parameterValues };
        this.sendRequest({ setDeviceParameterValues: setDeviceParameterValues }, messageId);
    };
    MotionMasterClient.prototype.requestGetDeviceFileList = function (deviceAddress, messageId) {
        var getDeviceFileList = { deviceAddress: deviceAddress };
        this.sendRequest({ getDeviceFileList: getDeviceFileList }, messageId);
    };
    MotionMasterClient.prototype.requestGetDeviceFile = function (deviceAddress, name, messageId) {
        var getDeviceFile = { deviceAddress: deviceAddress, name: name };
        this.sendRequest({ getDeviceFile: getDeviceFile }, messageId);
    };
    MotionMasterClient.prototype.requestSetDeviceFile = function (deviceAddress, name, content, overwrite, messageId) {
        var setDeviceFile = { deviceAddress: deviceAddress, name: name, content: content, overwrite: overwrite };
        this.sendRequest({ setDeviceFile: setDeviceFile }, messageId);
    };
    MotionMasterClient.prototype.requestDeleteDeviceFile = function (deviceAddress, name, messageId) {
        var deleteDeviceFile = { deviceAddress: deviceAddress, name: name };
        this.sendRequest({ deleteDeviceFile: deleteDeviceFile }, messageId);
    };
    MotionMasterClient.prototype.requestResetDeviceFault = function (deviceAddress, messageId) {
        var resetDeviceFault = { deviceAddress: deviceAddress };
        this.sendRequest({ resetDeviceFault: resetDeviceFault }, messageId);
    };
    MotionMasterClient.prototype.requestStopDevice = function (deviceAddress, messageId) {
        var stopDevice = { deviceAddress: deviceAddress };
        this.sendRequest({ stopDevice: stopDevice }, messageId);
    };
    MotionMasterClient.prototype.requestStartDeviceFirmwareInstallation = function (deviceAddress, firmwarePackageContent, messageId) {
        var startDeviceFirmwareInstallation = { deviceAddress: deviceAddress, firmwarePackageContent: firmwarePackageContent };
        this.sendRequest({ startDeviceFirmwareInstallation: startDeviceFirmwareInstallation }, messageId);
    };
    MotionMasterClient.prototype.requestGetDeviceLog = function (deviceAddress, messageId) {
        var getDeviceLog = { deviceAddress: deviceAddress };
        this.sendRequest({ getDeviceLog: getDeviceLog }, messageId);
    };
    MotionMasterClient.prototype.requestStartCoggingTorqueRecording = function (deviceAddress, skipAutoTuning, messageId) {
        var startCoggingTorqueRecording = { deviceAddress: deviceAddress, skipAutoTuning: skipAutoTuning };
        this.sendRequest({ startCoggingTorqueRecording: startCoggingTorqueRecording }, messageId);
    };
    MotionMasterClient.prototype.requestGetCoggingTorqueData = function (deviceAddress, messageId) {
        var getCoggingTorqueData = { deviceAddress: deviceAddress };
        this.sendRequest({ getCoggingTorqueData: getCoggingTorqueData }, messageId);
    };
    MotionMasterClient.prototype.requestStartOffsetDetection = function (deviceAddress, messageId) {
        var startOffsetDetection = { deviceAddress: deviceAddress };
        this.sendRequest({ startOffsetDetection: startOffsetDetection }, messageId);
    };
    MotionMasterClient.prototype.requestSetMotionControllerParameters = function (deviceAddress, target, messageId) {
        var setMotionControllerParameters = {
            deviceAddress: deviceAddress,
            target: target,
        };
        this.sendRequest({ setMotionControllerParameters: setMotionControllerParameters }, messageId);
    };
    MotionMasterClient.prototype.requestEnableMotionController = function (deviceAddress, controllerType, filterValue, messageId) {
        var enableMotionController = {
            deviceAddress: deviceAddress,
            controllerType: controllerType,
            filter: filterValue,
        };
        this.sendRequest({ enableMotionController: enableMotionController }, messageId);
    };
    MotionMasterClient.prototype.requestDisableMotionController = function (deviceAddress, messageId) {
        var disableMotionController = { deviceAddress: deviceAddress };
        this.sendRequest({ disableMotionController: disableMotionController }, messageId);
    };
    MotionMasterClient.prototype.requestStartSignalGenerator = function (deviceAddress, messageId) {
        var startSignalGenerator = { deviceAddress: deviceAddress };
        this.sendRequest({ startSignalGenerator: startSignalGenerator }, messageId);
    };
    MotionMasterClient.prototype.requestStopSignalGenerator = function (deviceAddress, messageId) {
        var stopSignalGenerator = { deviceAddress: deviceAddress };
        this.sendRequest({ stopSignalGenerator: stopSignalGenerator }, messageId);
    };
    MotionMasterClient.prototype.requestStartMonitoringDeviceParameterValues = function (deviceAddress, parameters, interval, topic, messageId) {
        var getDeviceParameterValues = { deviceAddress: deviceAddress, parameters: parameters };
        var startMonitoringDeviceParameterValues = { getDeviceParameterValues: getDeviceParameterValues, interval: interval, topic: topic };
        this.sendRequest({ startMonitoringDeviceParameterValues: startMonitoringDeviceParameterValues }, messageId);
    };
    MotionMasterClient.prototype.requestStopMonitoringDeviceParameterValues = function (startMonitoringRequestId, messageId) {
        var stopMonitoringDeviceParameterValues = { startMonitoringRequestId: startMonitoringRequestId };
        this.sendRequest({ stopMonitoringDeviceParameterValues: stopMonitoringDeviceParameterValues }, messageId);
    };
    MotionMasterClient.prototype.selectDeviceAtPosition = function (position) {
        var messageId = uuid_1.v4();
        var observable = this.motionMasterMessage$.pipe(operators_1.filter(function (message) { return message.id === messageId; }), operators_1.first(), operators_1.map(function (message) { return message.status; }), operators_1.map(function (status) {
            if (status) {
                var deviceInfo = status.deviceInfo;
                if (deviceInfo && deviceInfo.devices) {
                    return deviceInfo.devices[position];
                }
            }
            return null;
        }));
        var getDeviceInfo = {};
        this.sendRequest({ getDeviceInfo: getDeviceInfo }, messageId);
        return observable;
    };
    MotionMasterClient.prototype.selectMessage = function (messageId) {
        return this.motionMasterMessage$.pipe(operators_1.filter(function (message) { return message.id === messageId; }));
    };
    MotionMasterClient.prototype.selectNotification = function (topic, decode) {
        return this.notification.pipe(operators_1.filter(function (notif) { return notif[0].toString('utf8') === topic; }), operators_1.map(function (notif) { return ({ topic: topic, message: decode ? decodeMotionMasterMessage(notif[1]) : notif[1] }); }));
    };
    MotionMasterClient.prototype.selectStatus = function (type) {
        return this.status$.pipe(operators_1.filter(function (status) { return status.type === type; }), operators_1.map(function (status) { return status[type]; }));
    };
    MotionMasterClient.prototype.sendRequest = function (request, messageId) {
        var message = encodeRequest(request, messageId);
        this.output.next(message);
    };
    return MotionMasterClient;
}());
exports.MotionMasterClient = MotionMasterClient;
//# sourceMappingURL=motion-master-client.js.map