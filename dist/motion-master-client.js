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
        this.notification$ = this.notification.pipe(operators_1.map(function (notif) {
            var topic = notif[0].toString('utf8');
            var message = decodeMotionMasterMessage(notif[1]);
            return { topic: topic, message: message };
        }));
        this.status$ = this.motionMasterMessage$.pipe(operators_1.map(function (message) { return message.status; }));
        this.systemVersion$ = this.status$.pipe(operators_1.filter(function (status) { return !!status.systemVersion; }), operators_1.map(function (status) { return status.systemVersion; }));
        this.deviceInfo$ = this.status$.pipe(operators_1.filter(function (status) { return !!status.deviceInfo; }), operators_1.map(function (status) { return status.deviceInfo; }));
        this.deviceParameterInfo$ = this.status$.pipe(operators_1.filter(function (status) { return !!status.deviceParameterInfo; }), operators_1.map(function (status) { return status.deviceParameterInfo; }));
        this.deviceParameterValues$ = this.status$.pipe(operators_1.filter(function (status) { return !!status.deviceParameterValues; }), operators_1.map(function (status) { return status.deviceParameterValues; }));
    }
    MotionMasterClient.prototype.requestPingSystem = function (messageId) {
        var pingSystem = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.PingSystem.create();
        var request = { pingSystem: pingSystem };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestGetSystemVersion = function (messageId) {
        var getSystemVersion = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.GetSystemVersion.create();
        var request = { getSystemVersion: getSystemVersion };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestGetDeviceInfo = function (messageId) {
        var getDeviceInfo = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.GetDeviceInfo.create();
        var request = { getDeviceInfo: getDeviceInfo };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestGetDeviceParameterInfo = function (properties, messageId) {
        var getDeviceParameterInfo = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.GetDeviceParameterInfo.create(properties);
        var request = { getDeviceParameterInfo: getDeviceParameterInfo };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestGetDeviceParameterValues = function (properties, messageId) {
        var getDeviceParameterValues = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.create(properties);
        var request = { getDeviceParameterValues: getDeviceParameterValues };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestGetMultiDeviceParameterValues = function (properties, messageId) {
        var getMultiDeviceParameterValues = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.GetMultiDeviceParameterValues.create(properties);
        var request = { getMultiDeviceParameterValues: getMultiDeviceParameterValues };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestSetDeviceParameterValues = function (properties, messageId) {
        var setDeviceParameterValues = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.SetDeviceParameterValues.create(properties);
        var request = { setDeviceParameterValues: setDeviceParameterValues };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestSetMultiDeviceParameterValues = function (properties, messageId) {
        var setMultiDeviceParameterValues = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.SetMultiDeviceParameterValues.create(properties);
        var request = { setMultiDeviceParameterValues: setMultiDeviceParameterValues };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestGetDeviceFileList = function (properties, messageId) {
        var getDeviceFileList = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.GetDeviceFileList.create(properties);
        var request = { getDeviceFileList: getDeviceFileList };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestGetDeviceFile = function (properties, messageId) {
        var getDeviceFile = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.GetDeviceFile.create(properties);
        var request = { getDeviceFile: getDeviceFile };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestSetDeviceFile = function (properties, messageId) {
        var setDeviceFile = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.SetDeviceFile.create(properties);
        var request = { setDeviceFile: setDeviceFile };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestDeleteDeviceFile = function (properties, messageId) {
        var deleteDeviceFile = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.DeleteDeviceFile.create(properties);
        var request = { deleteDeviceFile: deleteDeviceFile };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestResetDeviceFault = function (properties, messageId) {
        var resetDeviceFault = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.ResetDeviceFault.create(properties);
        var request = { resetDeviceFault: resetDeviceFault };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestStopDevice = function (properties, messageId) {
        var stopDevice = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.StopDevice.create(properties);
        var request = { stopDevice: stopDevice };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestStartDeviceFirmwareInstallation = function (properties, messageId) {
        var startDeviceFirmwareInstallation = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.StartDeviceFirmwareInstallation.create(properties);
        var request = { startDeviceFirmwareInstallation: startDeviceFirmwareInstallation };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestGetDeviceLog = function (properties, messageId) {
        var getDeviceLog = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.GetDeviceLog.create(properties);
        var request = { getDeviceLog: getDeviceLog };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestStartCoggingTorqueRecording = function (properties, messageId) {
        var startCoggingTorqueRecording = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.StartCoggingTorqueRecording.create(properties);
        var request = { startCoggingTorqueRecording: startCoggingTorqueRecording };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestGetCoggingTorqueData = function (properties, messageId) {
        var getCoggingTorqueData = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.GetCoggingTorqueData.create(properties);
        var request = { getCoggingTorqueData: getCoggingTorqueData };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestStartOffsetDetection = function (properties, messageId) {
        var startOffsetDetection = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.StartOffsetDetection.create(properties);
        var request = { startOffsetDetection: startOffsetDetection };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestStartPlantIdentification = function (properties, messageId) {
        var startPlantIdentification = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.StartPlantIdentification.create(properties);
        var request = { startPlantIdentification: startPlantIdentification };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestComputeAutoTuningGains = function (properties, messageId) {
        var computeAutoTuningGains = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.ComputeAutoTuningGains.create(properties);
        var request = { computeAutoTuningGains: computeAutoTuningGains };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestSetMotionControllerParameters = function (properties, messageId) {
        var setMotionControllerParameters = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.SetMotionControllerParameters.create(properties);
        var request = { setMotionControllerParameters: setMotionControllerParameters };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestEnableMotionController = function (properties, messageId) {
        var enableMotionController = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.EnableMotionController.create(properties);
        var request = { enableMotionController: enableMotionController };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestDisableMotionController = function (properties, messageId) {
        var disableMotionController = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.DisableMotionController.create(properties);
        var request = { disableMotionController: disableMotionController };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestSetSignalGeneratorParameters = function (properties, messageId) {
        var setSignalGeneratorParameters = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.SetSignalGeneratorParameters.create(properties);
        var request = { setSignalGeneratorParameters: setSignalGeneratorParameters };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestStartSignalGenerator = function (properties, messageId) {
        var startSignalGenerator = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.StartSignalGenerator.create(properties);
        var request = { startSignalGenerator: startSignalGenerator };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestStopSignalGenerator = function (properties, messageId) {
        var stopSignalGenerator = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.StopSignalGenerator.create(properties);
        var request = { stopSignalGenerator: stopSignalGenerator };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestStartMonitoringDeviceParameterValues = function (properties, messageId) {
        var startMonitoringDeviceParameterValues = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.StartMonitoringDeviceParameterValues.create(properties);
        var request = { startMonitoringDeviceParameterValues: startMonitoringDeviceParameterValues };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestStopMonitoringDeviceParameterValues = function (properties, messageId) {
        var stopMonitoringDeviceParameterValues = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.StopMonitoringDeviceParameterValues.create(properties);
        var request = { stopMonitoringDeviceParameterValues: stopMonitoringDeviceParameterValues };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.sendRequest = function (request, messageId) {
        var message = encodeRequest(request, messageId);
        this.output.next(message);
    };
    MotionMasterClient.prototype.getDeviceAtPosition$ = function (position) {
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
        this.requestGetDeviceInfo(messageId);
        return observable;
    };
    MotionMasterClient.prototype.filterNotificationByTopic$ = function (topic) {
        return this.notification.pipe(operators_1.filter(function (notif) { return notif[0].toString('utf8') === topic; }), operators_1.map(function (notif) { return ({ topic: topic, message: decodeMotionMasterMessage(notif[1]) }); }));
    };
    return MotionMasterClient;
}());
exports.MotionMasterClient = MotionMasterClient;
//# sourceMappingURL=motion-master-client.js.map