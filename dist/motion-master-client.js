"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var motion_master_proto_1 = require("@synapticon/motion-master-proto");
var operators_1 = require("rxjs/operators");
var uuid_1 = require("uuid");
exports.MotionMasterMessage = motion_master_proto_1.motionmaster.MotionMasterMessage;
/**
 * Encode MotionMasterMessage to typed array.
 * @param message an instance of MotionMasterMessage.
 * @returns Uint8Array
 */
function encodeMotionMasterMessage(message) {
    return exports.MotionMasterMessage.encode(message).finish();
}
exports.encodeMotionMasterMessage = encodeMotionMasterMessage;
/**
 * Decode MotionMasterMessage from typed array.
 * @param data Uint8Array to decode
 * @returns MotionMasterMessage
 */
function decodeMotionMasterMessage(data) {
    return exports.MotionMasterMessage.decode(data);
}
exports.decodeMotionMasterMessage = decodeMotionMasterMessage;
/**
 * Class representing a Motion Master client.
 *
 * It's composed out of input, output and notification streams:
 * - Subscribe to input to receive messages from Motion Master DEALER socket.
 * - Send messages to output stream.
 * - Subscribe to notification stream to receive messages published on a certain topic on Motion Master SUB socket.
 *
 * This class comes with properties and helper methods for:
 * - Automatically decoding messages.
 * - Sending requests and returing typed observables of the matching status messages.
 * - Selecting notification messages with optional decoding.
 * - Selecting device at position.
 */
var MotionMasterClient = /** @class */ (function () {
    function MotionMasterClient(input$, output$, notification$) {
        this.input$ = input$;
        this.output$ = output$;
        this.notification$ = notification$;
        this.motionMasterMessage$ = this.input$;
        this.status$ = this.motionMasterMessage$.pipe(operators_1.map(function (message) { return message.status; }));
        this.systemEvent$ = this.status$.pipe(operators_1.map(function (status) { return status ? status['systemEvent'] : undefined; }));
        this.deviceEvent$ = this.status$.pipe(operators_1.map(function (status) { return status ? status['deviceEvent'] : undefined; }));
    }
    MotionMasterClient.prototype.requestPingSystem = function (messageId) {
        var pingSystem = exports.MotionMasterMessage.Request.PingSystem.create();
        var id = this.sendRequest({ pingSystem: pingSystem }, messageId);
        return this.selectMessageStatus('systemPong', id);
    };
    MotionMasterClient.prototype.requestGetSystemVersion = function (messageId) {
        var getSystemVersion = exports.MotionMasterMessage.Request.GetSystemVersion.create();
        var id = this.sendRequest({ getSystemVersion: getSystemVersion }, messageId);
        return this.selectMessageStatus('systemVersion', id);
    };
    MotionMasterClient.prototype.requestGetDeviceInfo = function (messageId) {
        var getDeviceInfo = exports.MotionMasterMessage.Request.GetDeviceInfo.create();
        var id = this.sendRequest({ getDeviceInfo: getDeviceInfo }, messageId);
        return this.selectMessageStatus('deviceInfo', id);
    };
    MotionMasterClient.prototype.requestGetDeviceParameterInfo = function (deviceAddress, messageId) {
        var getDeviceParameterInfo = exports.MotionMasterMessage.Request.GetDeviceParameterInfo.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ getDeviceParameterInfo: getDeviceParameterInfo }, messageId);
        return this.selectMessageStatus('deviceParameterInfo', id);
    };
    MotionMasterClient.prototype.requestGetDeviceParameterValues = function (deviceAddress, parameters, messageId) {
        var getDeviceParameterValues = exports.MotionMasterMessage.Request.GetDeviceParameterValues.create({ deviceAddress: deviceAddress, parameters: parameters });
        var id = this.sendRequest({ getDeviceParameterValues: getDeviceParameterValues }, messageId);
        return this.selectMessageStatus('deviceParameterValues', id);
    };
    MotionMasterClient.prototype.requestSetDeviceParameterValues = function (deviceAddress, parameterValues, messageId) {
        var setDeviceParameterValues = exports.MotionMasterMessage.Request.SetDeviceParameterValues.create({ deviceAddress: deviceAddress, parameterValues: parameterValues });
        var id = this.sendRequest({ setDeviceParameterValues: setDeviceParameterValues }, messageId);
        return this.selectMessageStatus('deviceParameterValues', id);
    };
    MotionMasterClient.prototype.requestGetDeviceFileList = function (deviceAddress, messageId) {
        var getDeviceFileList = exports.MotionMasterMessage.Request.GetDeviceFileList.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ getDeviceFileList: getDeviceFileList }, messageId);
        return this.selectMessageStatus('deviceFileList', id);
    };
    MotionMasterClient.prototype.requestGetDeviceFile = function (deviceAddress, name, messageId) {
        var getDeviceFile = exports.MotionMasterMessage.Request.GetDeviceFile.create({ deviceAddress: deviceAddress, name: name });
        var id = this.sendRequest({ getDeviceFile: getDeviceFile }, messageId);
        return this.selectMessageStatus('deviceFile', id);
    };
    MotionMasterClient.prototype.requestSetDeviceFile = function (deviceAddress, name, content, overwrite, messageId) {
        var setDeviceFile = exports.MotionMasterMessage.Request.SetDeviceFile.create({ deviceAddress: deviceAddress, name: name, content: content, overwrite: overwrite });
        var id = this.sendRequest({ setDeviceFile: setDeviceFile }, messageId);
        return this.selectMessageStatus('deviceFile', id);
    };
    MotionMasterClient.prototype.requestDeleteDeviceFile = function (deviceAddress, name, messageId) {
        var deleteDeviceFile = exports.MotionMasterMessage.Request.DeleteDeviceFile.create({ deviceAddress: deviceAddress, name: name });
        var id = this.sendRequest({ deleteDeviceFile: deleteDeviceFile }, messageId);
        return this.selectMessageStatus('deviceFile', id);
    };
    MotionMasterClient.prototype.requestResetDeviceFault = function (deviceAddress, messageId) {
        var resetDeviceFault = exports.MotionMasterMessage.Request.ResetDeviceFault.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ resetDeviceFault: resetDeviceFault }, messageId);
        return this.selectMessageStatus('deviceFaultReset', id);
    };
    MotionMasterClient.prototype.requestStopDevice = function (deviceAddress, messageId) {
        var stopDevice = exports.MotionMasterMessage.Request.StopDevice.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ stopDevice: stopDevice }, messageId);
        return id;
    };
    MotionMasterClient.prototype.requestStartDeviceFirmwareInstallation = function (deviceAddress, firmwarePackageContent, messageId) {
        var startDeviceFirmwareInstallation = exports.MotionMasterMessage.Request.StartDeviceFirmwareInstallation.create({ deviceAddress: deviceAddress, firmwarePackageContent: firmwarePackageContent });
        var id = this.sendRequest({ startDeviceFirmwareInstallation: startDeviceFirmwareInstallation }, messageId);
        return this.selectMessageStatus('deviceFirmwareInstallation', id);
    };
    MotionMasterClient.prototype.requestGetDeviceLog = function (deviceAddress, messageId) {
        var getDeviceLog = exports.MotionMasterMessage.Request.GetDeviceLog.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ getDeviceLog: getDeviceLog }, messageId);
        return this.selectMessageStatus('deviceLog', id);
    };
    MotionMasterClient.prototype.requestStartCoggingTorqueRecording = function (deviceAddress, skipAutoTuning, messageId) {
        var startCoggingTorqueRecording = exports.MotionMasterMessage.Request.StartCoggingTorqueRecording.create({ deviceAddress: deviceAddress, skipAutoTuning: skipAutoTuning });
        var id = this.sendRequest({ startCoggingTorqueRecording: startCoggingTorqueRecording }, messageId);
        return this.selectMessageStatus('coggingTorqueRecording', id);
    };
    MotionMasterClient.prototype.requestGetCoggingTorqueData = function (deviceAddress, messageId) {
        var getCoggingTorqueData = exports.MotionMasterMessage.Request.GetCoggingTorqueData.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ getCoggingTorqueData: getCoggingTorqueData }, messageId);
        return this.selectMessageStatus('coggingTorqueData', id);
    };
    MotionMasterClient.prototype.requestStartOffsetDetection = function (deviceAddress, messageId) {
        var startOffsetDetection = exports.MotionMasterMessage.Request.StartOffsetDetection.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ startOffsetDetection: startOffsetDetection }, messageId);
        return this.selectMessageStatus('offsetDetection', id);
    };
    MotionMasterClient.prototype.requestStartPlantIdentification = function (deviceAddress, durationSeconds, torqueAmplitude, startFrequency, endFrequency, cutoffFrequency, messageId) {
        var startPlantIdentification = exports.MotionMasterMessage.Request.StartPlantIdentification.create({
            deviceAddress: deviceAddress,
            durationSeconds: durationSeconds,
            torqueAmplitude: torqueAmplitude,
            startFrequency: startFrequency,
            endFrequency: endFrequency,
            cutoffFrequency: cutoffFrequency,
        });
        var id = this.sendRequest({ startPlantIdentification: startPlantIdentification }, messageId);
        return this.selectMessageStatus('plantIdentification', id);
    };
    MotionMasterClient.prototype.requestComputePositionAutoTuningGains = function (deviceAddress, positionParameters, messageId) {
        var computeAutoTuningGains = exports.MotionMasterMessage.Request.ComputeAutoTuningGains.create({ deviceAddress: deviceAddress, positionParameters: positionParameters });
        var id = this.sendRequest({ computeAutoTuningGains: computeAutoTuningGains }, messageId);
        return this.selectMessageStatus('autoTuning', id);
    };
    MotionMasterClient.prototype.requestComputeVelocityAutoTuningGains = function (deviceAddress, velocityParameters, messageId) {
        var computeAutoTuningGains = exports.MotionMasterMessage.Request.ComputeAutoTuningGains.create({ deviceAddress: deviceAddress, velocityParameters: velocityParameters });
        var id = this.sendRequest({ computeAutoTuningGains: computeAutoTuningGains }, messageId);
        return this.selectMessageStatus('autoTuning', id);
    };
    MotionMasterClient.prototype.requestSetMotionControllerParameters = function (deviceAddress, target, messageId) {
        var setMotionControllerParameters = exports.MotionMasterMessage.Request.SetMotionControllerParameters.create({
            deviceAddress: deviceAddress,
            target: target,
        });
        var id = this.sendRequest({ setMotionControllerParameters: setMotionControllerParameters }, messageId);
        return id;
    };
    MotionMasterClient.prototype.requestEnableMotionController = function (deviceAddress, controllerType, filterValue, messageId) {
        var enableMotionController = exports.MotionMasterMessage.Request.EnableMotionController.create({
            deviceAddress: deviceAddress,
            controllerType: controllerType,
            filter: filterValue,
        });
        var id = this.sendRequest({ enableMotionController: enableMotionController }, messageId);
        return this.selectMessageStatus('motionController', id);
    };
    MotionMasterClient.prototype.requestDisableMotionController = function (deviceAddress, messageId) {
        var disableMotionController = exports.MotionMasterMessage.Request.DisableMotionController.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ disableMotionController: disableMotionController }, messageId);
        return this.selectMessageStatus('motionController', id);
    };
    MotionMasterClient.prototype.requestSetSignalGeneratorParameters = function (setSignalGeneratorParameters, messageId) {
        var id = this.sendRequest({ setSignalGeneratorParameters: setSignalGeneratorParameters }, messageId);
        return id;
    };
    MotionMasterClient.prototype.requestStartSignalGenerator = function (deviceAddress, messageId) {
        var startSignalGenerator = exports.MotionMasterMessage.Request.StartSignalGenerator.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ startSignalGenerator: startSignalGenerator }, messageId);
        return this.selectMessageStatus('signalGenerator', id);
    };
    MotionMasterClient.prototype.requestStopSignalGenerator = function (deviceAddress, messageId) {
        var stopSignalGenerator = exports.MotionMasterMessage.Request.StopSignalGenerator.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ stopSignalGenerator: stopSignalGenerator }, messageId);
        return this.selectMessageStatus('signalGenerator', id);
    };
    MotionMasterClient.prototype.requestStartMonitoringDeviceParameterValues = function (deviceAddress, parameters, interval, topic, messageId) {
        var getDeviceParameterValues = { deviceAddress: deviceAddress, parameters: parameters };
        var startMonitoringDeviceParameterValues = exports.MotionMasterMessage.Request.StartMonitoringDeviceParameterValues.create({ getDeviceParameterValues: getDeviceParameterValues, interval: interval, topic: topic });
        var id = this.sendRequest({ startMonitoringDeviceParameterValues: startMonitoringDeviceParameterValues }, messageId);
        return this.selectMessageStatus('monitoringParameterValues', id);
    };
    MotionMasterClient.prototype.requestStopMonitoringDeviceParameterValues = function (startMonitoringRequestId, messageId) {
        var stopMonitoringDeviceParameterValues = exports.MotionMasterMessage.Request.StopMonitoringDeviceParameterValues.create({ startMonitoringRequestId: startMonitoringRequestId });
        var id = this.sendRequest({ stopMonitoringDeviceParameterValues: stopMonitoringDeviceParameterValues }, messageId);
        return this.selectMessageStatus('monitoringParameterValues', id);
    };
    MotionMasterClient.prototype.requestGetEthercatNetworkState = function (deviceAddress, messageId) {
        var getEthercatNetworkState = exports.MotionMasterMessage.Request.GetEthercatNetworkState.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ getEthercatNetworkState: getEthercatNetworkState }, messageId);
        return this.selectMessageStatus('ethercatNetworkState', id);
    };
    MotionMasterClient.prototype.requestSetEthercatNetworkState = function (deviceAddress, state, messageId) {
        var setEthercatNetworkState = exports.MotionMasterMessage.Request.SetEthercatNetworkState.create({ deviceAddress: deviceAddress, state: state });
        var id = this.sendRequest({ setEthercatNetworkState: setEthercatNetworkState }, messageId);
        return this.selectMessageStatus('ethercatNetworkState', id);
    };
    MotionMasterClient.prototype.requestStartNarrowAngleCalibration = function (deviceAddress, messageId) {
        var startNarrowAngleCalibration = exports.MotionMasterMessage.Request.StartNarrowAngleCalibration.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ startNarrowAngleCalibration: startNarrowAngleCalibration }, messageId);
        return this.selectMessageStatus('narrowAngleCalibration', id);
    };
    /**
     * Select device at position in EtherCAT chain. This function makes an initial request to fetch a list of devices.
     * @param position device position in EtherCAT chain
     * @returns an observable of device messages
     */
    MotionMasterClient.prototype.selectDeviceAtPosition = function (position) {
        return this.requestGetDeviceInfo().pipe(operators_1.first(), operators_1.map(function (deviceInfo) {
            if (deviceInfo.devices) {
                return deviceInfo.devices.find(function (device) { return device.position === position; });
            }
            else {
                return null;
            }
        }));
    };
    /**
     * Select incoming messages by id.
     *
     * This function filters messages by id as there can be multiple messages coming in for a single request,
     * e.g. startOffsetDetection → started → progress → done. Ensure that you unsubscribe or use `takeWhile` operator.
     *
     * @param messageId
     * @returns an observable of motion master messages
     */
    MotionMasterClient.prototype.selectMessage = function (messageId) {
        return this.motionMasterMessage$.pipe(operators_1.filter(function (message) { return message.id === messageId; }));
    };
    /**
     * Select incoming messages by id (optionally) and get their status response.
     *
     * This function filters messages by id as there can be multiple messages coming in for a single request,
     * e.g. startOffsetDetection → started → progress → done. Ensure that you unsubscribe or use `takeWhile` operator.
     *
     * @param messageId
     * @param type of status message received as a response
     */
    MotionMasterClient.prototype.selectMessageStatus = function (type, messageId) {
        var message$ = messageId === undefined
            ? this.motionMasterMessage$
            : this.motionMasterMessage$.pipe(operators_1.filter(function (message) { return message.id === messageId; }));
        // we expect Status to be ALWAYS defined on input message
        var status$ = message$.pipe(operators_1.map(function (message) { return message.status; }));
        return status$.pipe(operators_1.map(function (status) { return status[type]; }));
    };
    /**
     * Select notifications by topic.
     * @param topic to filter incoming notifications by
     * @returns an observable of topic and MotionMasterMessage
     */
    MotionMasterClient.prototype.selectNotification = function (topic) {
        return this.notification$.pipe(operators_1.filter(function (notif) { return notif[0].toString() === topic; }), operators_1.map(function (notif) { return ({ topic: topic, message: notif[1] }); }));
    };
    /**
     * Send Request message to output.
     * @param request proto message
     * @param [messageId] identifies request, if no messageId is provided one is generated with uuid v4 and returned
     * @returns passed or generated messageId
     */
    MotionMasterClient.prototype.sendRequest = function (request, messageId) {
        var id = messageId || uuid_1.v4();
        var message = exports.MotionMasterMessage.create({ request: request, id: id });
        this.output$.next(message);
        return id;
    };
    MotionMasterClient.prototype.sendMessage = function (message) {
        this.output$.next(message);
        return message.id;
    };
    return MotionMasterClient;
}());
exports.MotionMasterClient = MotionMasterClient;
//# sourceMappingURL=motion-master-client.js.map