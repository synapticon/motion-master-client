"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var motion_master_proto_1 = require("motion-master-proto");
var operators_1 = require("rxjs/operators");
var uuid_1 = require("uuid");
/**
 * Encode Request in MotionMasterMessage with the provided id.
 * @param id message id
 * @param request oneof request objects
 */
function encodeRequest(id, request) {
    var message = motion_master_proto_1.motionmaster.MotionMasterMessage.create({ id: id, request: request });
    return motion_master_proto_1.motionmaster.MotionMasterMessage.encode(message).finish();
}
exports.encodeRequest = encodeRequest;
/**
 * Decode MotionMasterMessage from typed array.
 * @param data
 */
function decodeMotionMasterMessage(data) {
    return motion_master_proto_1.motionmaster.MotionMasterMessage.decode(data);
}
exports.decodeMotionMasterMessage = decodeMotionMasterMessage;
/**
 * Class representing a Motion Master client.
 *
 * It's composed out of input, output and notification streams:
 * - Subscribe to input to receive encoded messages from Motion Master DEALER socket.
 * - Send encoded messages to output stream.
 * - Subscribe to notification stream to receive messages published on a certain topic on Motion Master SUB socket.
 *
 * This class comes with properties and helper methods for:
 * - Automatically decoding messages.
 * - Sending requests and returing typed observables of the matching status messages.
 * - Selecting notification messages with optional decoding.
 * - Selecting device at position.
 */
var MotionMasterClient = /** @class */ (function () {
    function MotionMasterClient(input, output, notification) {
        this.input = input;
        this.output = output;
        this.notification = notification;
        this.motionMasterMessage$ = this.input.pipe(operators_1.map(decodeMotionMasterMessage));
        this.status$ = this.motionMasterMessage$.pipe(operators_1.map(function (message) { return message.status; })); // we expect Status to be ALWAYS defined on input message
        this.systemEvent$ = this.status$.pipe(operators_1.map(function (status) { return status['systemEvent']; }));
        this.deviceEvent$ = this.status$.pipe(operators_1.map(function (status) { return status['deviceEvent']; }));
    }
    MotionMasterClient.prototype.requestPingSystem = function (messageId) {
        var pingSystem = {};
        var id = this.sendRequest({ pingSystem: pingSystem }, messageId);
        return this.selectMessageStatus(id, 'systemPong');
    };
    MotionMasterClient.prototype.requestGetSystemVersion = function (messageId) {
        var getSystemVersion = {};
        var id = this.sendRequest({ getSystemVersion: getSystemVersion }, messageId);
        return this.selectMessageStatus(id, 'systemVersion');
    };
    MotionMasterClient.prototype.requestGetDeviceInfo = function (messageId) {
        var getDeviceInfo = {};
        var id = this.sendRequest({ getDeviceInfo: getDeviceInfo }, messageId);
        return this.selectMessageStatus(id, 'deviceInfo');
    };
    MotionMasterClient.prototype.requestGetDeviceParameterInfo = function (deviceAddress, messageId) {
        var getDeviceParameterInfo = { deviceAddress: deviceAddress };
        var id = this.sendRequest({ getDeviceParameterInfo: getDeviceParameterInfo }, messageId);
        return this.selectMessageStatus(id, 'deviceParameterInfo');
    };
    MotionMasterClient.prototype.requestGetDeviceParameterValues = function (deviceAddress, parameters, messageId) {
        var getDeviceParameterValues = { deviceAddress: deviceAddress, parameters: parameters };
        var id = this.sendRequest({ getDeviceParameterValues: getDeviceParameterValues }, messageId);
        return this.selectMessageStatus(id, 'deviceParameterValues');
    };
    MotionMasterClient.prototype.requestSetDeviceParameterValues = function (deviceAddress, parameterValues, messageId) {
        var setDeviceParameterValues = { deviceAddress: deviceAddress, parameterValues: parameterValues };
        var id = this.sendRequest({ setDeviceParameterValues: setDeviceParameterValues }, messageId);
        return this.selectMessageStatus(id, 'deviceParameterValues');
    };
    MotionMasterClient.prototype.requestGetDeviceFileList = function (deviceAddress, messageId) {
        var getDeviceFileList = { deviceAddress: deviceAddress };
        var id = this.sendRequest({ getDeviceFileList: getDeviceFileList }, messageId);
        return this.selectMessageStatus(id, 'deviceFileList');
    };
    MotionMasterClient.prototype.requestGetDeviceFile = function (deviceAddress, name, messageId) {
        var getDeviceFile = { deviceAddress: deviceAddress, name: name };
        var id = this.sendRequest({ getDeviceFile: getDeviceFile }, messageId);
        return this.selectMessageStatus(id, 'deviceFile');
    };
    MotionMasterClient.prototype.requestSetDeviceFile = function (deviceAddress, name, content, overwrite, messageId) {
        var setDeviceFile = { deviceAddress: deviceAddress, name: name, content: content, overwrite: overwrite };
        var id = this.sendRequest({ setDeviceFile: setDeviceFile }, messageId);
        return this.selectMessageStatus(id, 'deviceFile');
    };
    MotionMasterClient.prototype.requestDeleteDeviceFile = function (deviceAddress, name, messageId) {
        var deleteDeviceFile = { deviceAddress: deviceAddress, name: name };
        var id = this.sendRequest({ deleteDeviceFile: deleteDeviceFile }, messageId);
        return this.selectMessageStatus(id, 'deviceFile');
    };
    MotionMasterClient.prototype.requestResetDeviceFault = function (deviceAddress, messageId) {
        var resetDeviceFault = { deviceAddress: deviceAddress };
        var id = this.sendRequest({ resetDeviceFault: resetDeviceFault }, messageId);
        return this.selectMessageStatus(id, 'deviceFaultReset');
    };
    MotionMasterClient.prototype.requestStopDevice = function (deviceAddress, messageId) {
        var stopDevice = { deviceAddress: deviceAddress };
        this.sendRequest({ stopDevice: stopDevice }, messageId);
    };
    MotionMasterClient.prototype.requestStartDeviceFirmwareInstallation = function (deviceAddress, firmwarePackageContent, messageId) {
        var startDeviceFirmwareInstallation = { deviceAddress: deviceAddress, firmwarePackageContent: firmwarePackageContent };
        var id = this.sendRequest({ startDeviceFirmwareInstallation: startDeviceFirmwareInstallation }, messageId);
        return this.selectMessageStatus(id, 'deviceFirmwareInstallation');
    };
    MotionMasterClient.prototype.requestGetDeviceLog = function (deviceAddress, messageId) {
        var getDeviceLog = { deviceAddress: deviceAddress };
        var id = this.sendRequest({ getDeviceLog: getDeviceLog }, messageId);
        return this.selectMessageStatus(id, 'deviceLog');
    };
    MotionMasterClient.prototype.requestStartCoggingTorqueRecording = function (deviceAddress, skipAutoTuning, messageId) {
        var startCoggingTorqueRecording = { deviceAddress: deviceAddress, skipAutoTuning: skipAutoTuning };
        var id = this.sendRequest({ startCoggingTorqueRecording: startCoggingTorqueRecording }, messageId);
        return this.selectMessageStatus(id, 'coggingTorqueRecording');
    };
    MotionMasterClient.prototype.requestGetCoggingTorqueData = function (deviceAddress, messageId) {
        var getCoggingTorqueData = { deviceAddress: deviceAddress };
        var id = this.sendRequest({ getCoggingTorqueData: getCoggingTorqueData }, messageId);
        return this.selectMessageStatus(id, 'coggingTorqueData');
    };
    MotionMasterClient.prototype.requestStartOffsetDetection = function (deviceAddress, messageId) {
        var startOffsetDetection = { deviceAddress: deviceAddress };
        var id = this.sendRequest({ startOffsetDetection: startOffsetDetection }, messageId);
        return this.selectMessageStatus(id, 'offsetDetection');
    };
    MotionMasterClient.prototype.requestStartPlantIdentification = function (deviceAddress, durationSeconds, torqueAmplitude, startFrequency, endFrequency, cutoffFrequency, messageId) {
        var startPlantIdentification = {
            deviceAddress: deviceAddress,
            durationSeconds: durationSeconds,
            torqueAmplitude: torqueAmplitude,
            startFrequency: startFrequency,
            endFrequency: endFrequency,
            cutoffFrequency: cutoffFrequency,
        };
        var id = this.sendRequest({ startPlantIdentification: startPlantIdentification }, messageId);
        return this.selectMessageStatus(id, 'plantIdentification');
    };
    MotionMasterClient.prototype.requestSetMotionControllerParameters = function (deviceAddress, target, messageId) {
        var setMotionControllerParameters = {
            deviceAddress: deviceAddress,
            target: target,
        };
        var id = this.sendRequest({ setMotionControllerParameters: setMotionControllerParameters }, messageId);
        return this.selectMessageStatus(id, 'motionController');
    };
    MotionMasterClient.prototype.requestEnableMotionController = function (deviceAddress, controllerType, filterValue, messageId) {
        var enableMotionController = {
            deviceAddress: deviceAddress,
            controllerType: controllerType,
            filter: filterValue,
        };
        var id = this.sendRequest({ enableMotionController: enableMotionController }, messageId);
        return this.selectMessageStatus(id, 'motionController');
    };
    MotionMasterClient.prototype.requestDisableMotionController = function (deviceAddress, messageId) {
        var disableMotionController = { deviceAddress: deviceAddress };
        var id = this.sendRequest({ disableMotionController: disableMotionController }, messageId);
        return this.selectMessageStatus(id, 'motionController');
    };
    MotionMasterClient.prototype.requestStartSignalGenerator = function (deviceAddress, messageId) {
        var startSignalGenerator = { deviceAddress: deviceAddress };
        var id = this.sendRequest({ startSignalGenerator: startSignalGenerator }, messageId);
        return this.selectMessageStatus(id, 'signalGenerator');
    };
    MotionMasterClient.prototype.requestStopSignalGenerator = function (deviceAddress, messageId) {
        var stopSignalGenerator = { deviceAddress: deviceAddress };
        var id = this.sendRequest({ stopSignalGenerator: stopSignalGenerator }, messageId);
        return this.selectMessageStatus(id, 'signalGenerator');
    };
    MotionMasterClient.prototype.requestStartMonitoringDeviceParameterValues = function (deviceAddress, parameters, interval, topic, messageId) {
        var getDeviceParameterValues = { deviceAddress: deviceAddress, parameters: parameters };
        var startMonitoringDeviceParameterValues = { getDeviceParameterValues: getDeviceParameterValues, interval: interval, topic: topic };
        var id = this.sendRequest({ startMonitoringDeviceParameterValues: startMonitoringDeviceParameterValues }, messageId);
        return this.selectMessageStatus(id, 'monitoringParameterValues');
    };
    MotionMasterClient.prototype.requestStopMonitoringDeviceParameterValues = function (startMonitoringRequestId, messageId) {
        var stopMonitoringDeviceParameterValues = { startMonitoringRequestId: startMonitoringRequestId };
        var id = this.sendRequest({ stopMonitoringDeviceParameterValues: stopMonitoringDeviceParameterValues }, messageId);
        return this.selectMessageStatus(id, 'monitoringParameterValues');
    };
    /**
     * Select device at position in EtherCAT chain. This function makes an initial request to fetch a list of devices.
     * @param position device position in EtherCAT chain
     * @returns an observable of device messages
     */
    MotionMasterClient.prototype.selectDeviceAtPosition = function (position) {
        var messageId = uuid_1.v4();
        var observable = this.motionMasterMessage$.pipe(operators_1.filter(function (message) { return message.id === messageId; }), operators_1.first(), operators_1.map(function (message) { return message.status; }), operators_1.map(function (status) {
            if (status) {
                var deviceInfo = status.deviceInfo;
                if (deviceInfo && deviceInfo.devices) {
                    return deviceInfo.devices.find(function (device) { return device.position === position; });
                }
            }
            return null;
        }));
        var getDeviceInfo = {};
        this.sendRequest({ getDeviceInfo: getDeviceInfo }, messageId);
        return observable;
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
     * Select incoming messages by id and get their status response.
     *
     * This function filters messages by id as there can be multiple messages coming in for a single request,
     * e.g. startOffsetDetection → started → progress → done. Ensure that you unsubscribe or use `takeWhile` operator.
     *
     * @param messageId
     * @param type of status message received as a response
     */
    MotionMasterClient.prototype.selectMessageStatus = function (messageId, type) {
        var message$ = this.motionMasterMessage$.pipe(operators_1.filter(function (message) { return message.id === messageId; })); // we expect Status message with the initial id to always come back as a response
        var status$ = message$.pipe(operators_1.map(function (message) { return message.status; })); // we expect Status to be ALWAYS defined on input message
        return status$.pipe(operators_1.map(function (status) { return status[type]; }));
    };
    /**
     * Select notifications by topic and optionally decode the content.
     * @param topic to filter incoming notifications by
     * @param decode to MotionMasterMessage or leave the content as Uint8Array
     * @returns an observable of topic and depending on the value of decode argument: MotionMasterMessage when true, Uint8Array otherwise
     */
    MotionMasterClient.prototype.selectNotification = function (topic, decode) {
        return this.notification.pipe(operators_1.filter(function (notif) { return notif[0].toString() === topic; }), operators_1.map(function (notif) { return ({ topic: topic, message: decode ? decodeMotionMasterMessage(notif[1]) : notif[1] }); }));
    };
    /**
     * Select status messages by type.
     * @param type status type, e.g. 'systemVersion', 'offsetDetection'
     * @returns an observable of status messages depending on the passed type
     */
    MotionMasterClient.prototype.selectStatus = function (type) {
        return this.status$.pipe(operators_1.filter(function (status) { return status.type === type; }), operators_1.map(function (status) { return status[type]; }));
    };
    /**
     * Send encoded Request message to output.
     * @param request proto message
     * @param [messageId] identifies request, if no messageId is provided one is generated with uuid v4 and returned
     * @returns passed or generated messageId
     */
    MotionMasterClient.prototype.sendRequest = function (request, messageId) {
        if (!messageId) {
            messageId = uuid_1.v4();
        }
        var message = encodeRequest(messageId, request);
        this.output.next(message);
        return messageId;
    };
    return MotionMasterClient;
}());
exports.MotionMasterClient = MotionMasterClient;
//# sourceMappingURL=motion-master-client.js.map