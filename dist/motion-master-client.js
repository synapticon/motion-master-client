"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotionMasterClient = void 0;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var uuid_1 = require("uuid");
var util_1 = require("./util");
var MotionMasterClient = /** @class */ (function () {
    function MotionMasterClient() {
        /**
         * Decoded message instances coming from Motion Master.
         * @see https://github.com/protobufjs/protobuf.js#toolset Message.decode
         */
        this.input$ = new rxjs_1.Subject();
        /**
         * Message instances or objects going to Motion Master.
         * @see https://github.com/protobufjs/protobuf.js#toolset Message.encode
         */
        this.output$ = new rxjs_1.Subject();
    }
    MotionMasterClient.prototype.requestPingSystem = function (messageId) {
        var pingSystem = util_1.MotionMasterMessage.Request.PingSystem.create();
        var id = this.sendRequest({ pingSystem: pingSystem }, messageId);
        return this.selectMessageStatus('systemPong', id);
    };
    MotionMasterClient.prototype.requestGetSystemVersion = function (messageId) {
        var getSystemVersion = util_1.MotionMasterMessage.Request.GetSystemVersion.create();
        var id = this.sendRequest({ getSystemVersion: getSystemVersion }, messageId);
        return this.selectMessageStatus('systemVersion', id);
    };
    MotionMasterClient.prototype.requestGetDeviceInfo = function (messageId) {
        var getDeviceInfo = util_1.MotionMasterMessage.Request.GetDeviceInfo.create();
        var id = this.sendRequest({ getDeviceInfo: getDeviceInfo }, messageId);
        return this.selectMessageStatus('deviceInfo', id);
    };
    MotionMasterClient.prototype.requestGetDeviceParameterInfo = function (deviceAddress, messageId) {
        var getDeviceParameterInfo = util_1.MotionMasterMessage.Request.GetDeviceParameterInfo.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ getDeviceParameterInfo: getDeviceParameterInfo }, messageId);
        return this.selectMessageStatus('deviceParameterInfo', id);
    };
    MotionMasterClient.prototype.requestGetDeviceParameterValues = function (deviceAddress, parameters, sendProgress, messageId) {
        if (sendProgress === void 0) { sendProgress = false; }
        var getDeviceParameterValues = util_1.MotionMasterMessage.Request.GetDeviceParameterValues.create({ deviceAddress: deviceAddress, parameters: parameters, sendProgress: sendProgress });
        var id = this.sendRequest({ getDeviceParameterValues: getDeviceParameterValues }, messageId);
        return this.selectMessageStatus('deviceParameterValues', id);
    };
    MotionMasterClient.prototype.requestSetDeviceParameterValues = function (deviceAddress, parameterValues, messageId) {
        var setDeviceParameterValues = util_1.MotionMasterMessage.Request.SetDeviceParameterValues.create({ deviceAddress: deviceAddress, parameterValues: parameterValues });
        var id = this.sendRequest({ setDeviceParameterValues: setDeviceParameterValues }, messageId);
        return this.selectMessageStatus('deviceParameterValues', id);
    };
    MotionMasterClient.prototype.requestGetDeviceFileList = function (deviceAddress, messageId) {
        var getDeviceFileList = util_1.MotionMasterMessage.Request.GetDeviceFileList.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ getDeviceFileList: getDeviceFileList }, messageId);
        return this.selectMessageStatus('deviceFileList', id);
    };
    MotionMasterClient.prototype.requestGetDeviceFile = function (deviceAddress, name, messageId) {
        var getDeviceFile = util_1.MotionMasterMessage.Request.GetDeviceFile.create({ deviceAddress: deviceAddress, name: name });
        var id = this.sendRequest({ getDeviceFile: getDeviceFile }, messageId);
        return this.selectMessageStatus('deviceFile', id);
    };
    MotionMasterClient.prototype.requestSetDeviceFile = function (deviceAddress, name, content, overwrite, messageId) {
        var setDeviceFile = util_1.MotionMasterMessage.Request.SetDeviceFile.create({ deviceAddress: deviceAddress, name: name, content: content, overwrite: overwrite });
        var id = this.sendRequest({ setDeviceFile: setDeviceFile }, messageId);
        return this.selectMessageStatus('deviceFile', id);
    };
    MotionMasterClient.prototype.requestDeleteDeviceFile = function (deviceAddress, name, messageId) {
        var deleteDeviceFile = util_1.MotionMasterMessage.Request.DeleteDeviceFile.create({ deviceAddress: deviceAddress, name: name });
        var id = this.sendRequest({ deleteDeviceFile: deleteDeviceFile }, messageId);
        return this.selectMessageStatus('deviceFile', id);
    };
    MotionMasterClient.prototype.requestResetDeviceFault = function (deviceAddress, messageId) {
        var resetDeviceFault = util_1.MotionMasterMessage.Request.ResetDeviceFault.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ resetDeviceFault: resetDeviceFault }, messageId);
        return this.selectMessageStatus('deviceFaultReset', id);
    };
    MotionMasterClient.prototype.requestStopDevice = function (deviceAddress, messageId) {
        var stopDevice = util_1.MotionMasterMessage.Request.StopDevice.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ stopDevice: stopDevice }, messageId);
        return id;
    };
    MotionMasterClient.prototype.requestStartDeviceFirmwareInstallation = function (deviceAddress, firmwarePackageContent, skipSiiInstallation, messageId) {
        if (skipSiiInstallation === void 0) { skipSiiInstallation = false; }
        var startDeviceFirmwareInstallation = util_1.MotionMasterMessage.Request.StartDeviceFirmwareInstallation.create({ deviceAddress: deviceAddress, firmwarePackageContent: firmwarePackageContent, skipSiiInstallation: skipSiiInstallation });
        var id = this.sendRequest({ startDeviceFirmwareInstallation: startDeviceFirmwareInstallation }, messageId);
        return this.selectMessageStatus('deviceFirmwareInstallation', id);
    };
    MotionMasterClient.prototype.requestGetDeviceLog = function (deviceAddress, messageId) {
        var getDeviceLog = util_1.MotionMasterMessage.Request.GetDeviceLog.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ getDeviceLog: getDeviceLog }, messageId);
        return this.selectMessageStatus('deviceLog', id);
    };
    MotionMasterClient.prototype.requestStartCoggingTorqueRecording = function (deviceAddress, skipAutoTuning, messageId) {
        var startCoggingTorqueRecording = util_1.MotionMasterMessage.Request.StartCoggingTorqueRecording.create({ deviceAddress: deviceAddress, skipAutoTuning: skipAutoTuning });
        var id = this.sendRequest({ startCoggingTorqueRecording: startCoggingTorqueRecording }, messageId);
        return this.selectMessageStatus('coggingTorqueRecording', id);
    };
    MotionMasterClient.prototype.requestGetCoggingTorqueData = function (deviceAddress, messageId) {
        var getCoggingTorqueData = util_1.MotionMasterMessage.Request.GetCoggingTorqueData.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ getCoggingTorqueData: getCoggingTorqueData }, messageId);
        return this.selectMessageStatus('coggingTorqueData', id);
    };
    MotionMasterClient.prototype.requestStartOffsetDetection = function (deviceAddress, messageId) {
        var startOffsetDetection = util_1.MotionMasterMessage.Request.StartOffsetDetection.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ startOffsetDetection: startOffsetDetection }, messageId);
        return this.selectMessageStatus('offsetDetection', id);
    };
    MotionMasterClient.prototype.requestStartPlantIdentification = function (deviceAddress, durationSeconds, torqueAmplitude, startFrequency, endFrequency, cutoffFrequency, messageId) {
        var startPlantIdentification = util_1.MotionMasterMessage.Request.StartPlantIdentification.create({
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
        var computeAutoTuningGains = util_1.MotionMasterMessage.Request.ComputeAutoTuningGains.create({ deviceAddress: deviceAddress, positionParameters: positionParameters });
        var id = this.sendRequest({ computeAutoTuningGains: computeAutoTuningGains }, messageId);
        return this.selectMessageStatus('autoTuning', id);
    };
    MotionMasterClient.prototype.requestComputeVelocityAutoTuningGains = function (deviceAddress, velocityParameters, messageId) {
        var computeAutoTuningGains = util_1.MotionMasterMessage.Request.ComputeAutoTuningGains.create({ deviceAddress: deviceAddress, velocityParameters: velocityParameters });
        var id = this.sendRequest({ computeAutoTuningGains: computeAutoTuningGains }, messageId);
        return this.selectMessageStatus('autoTuning', id);
    };
    MotionMasterClient.prototype.requestComputeFullAutoTuningGains = function (deviceAddress, type, controllerType, messageId) {
        if (controllerType === void 0) { controllerType = util_1.MotionMasterMessage.Request.ComputeFullAutoTuningGains.ControllerType.UNSPECIFIED; }
        var computeFullAutoTuningGains = util_1.MotionMasterMessage.Request.ComputeFullAutoTuningGains.create({ deviceAddress: deviceAddress, type: type, controllerType: controllerType });
        var id = this.sendRequest({ computeFullAutoTuningGains: computeFullAutoTuningGains }, messageId);
        return this.selectMessageStatus('fullAutoTuning', id);
    };
    MotionMasterClient.prototype.requestSetMotionControllerParameters = function (deviceAddress, target, messageId) {
        var setMotionControllerParameters = util_1.MotionMasterMessage.Request.SetMotionControllerParameters.create({
            deviceAddress: deviceAddress,
            target: target,
        });
        var id = this.sendRequest({ setMotionControllerParameters: setMotionControllerParameters }, messageId);
        return id;
    };
    MotionMasterClient.prototype.requestEnableMotionController = function (deviceAddress, controllerType, filterValue, messageId) {
        var enableMotionController = util_1.MotionMasterMessage.Request.EnableMotionController.create({
            deviceAddress: deviceAddress,
            controllerType: controllerType,
            filter: filterValue,
        });
        var id = this.sendRequest({ enableMotionController: enableMotionController }, messageId);
        return this.selectMessageStatus('motionController', id);
    };
    MotionMasterClient.prototype.requestDisableMotionController = function (deviceAddress, messageId) {
        var disableMotionController = util_1.MotionMasterMessage.Request.DisableMotionController.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ disableMotionController: disableMotionController }, messageId);
        return this.selectMessageStatus('motionController', id);
    };
    MotionMasterClient.prototype.requestSetSignalGeneratorParameters = function (setSignalGeneratorParameters, messageId) {
        var id = this.sendRequest({ setSignalGeneratorParameters: setSignalGeneratorParameters }, messageId);
        return id;
    };
    MotionMasterClient.prototype.requestStartSignalGenerator = function (deviceAddress, messageId) {
        var startSignalGenerator = util_1.MotionMasterMessage.Request.StartSignalGenerator.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ startSignalGenerator: startSignalGenerator }, messageId);
        return this.selectMessageStatus('signalGenerator', id);
    };
    MotionMasterClient.prototype.requestStopSignalGenerator = function (deviceAddress, messageId) {
        var stopSignalGenerator = util_1.MotionMasterMessage.Request.StopSignalGenerator.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ stopSignalGenerator: stopSignalGenerator }, messageId);
        return this.selectMessageStatus('signalGenerator', id);
    };
    MotionMasterClient.prototype.requestStartMonitoringDeviceParameterValues = function (deviceAddress, parameters, interval, topic, messageId) {
        var getDeviceParameterValues = { deviceAddress: deviceAddress, parameters: parameters };
        var startMonitoringDeviceParameterValues = util_1.MotionMasterMessage.Request.StartMonitoringDeviceParameterValues.create({ getDeviceParameterValues: getDeviceParameterValues, interval: interval, topic: topic });
        var id = this.sendRequest({ startMonitoringDeviceParameterValues: startMonitoringDeviceParameterValues }, messageId);
        return this.selectMessageStatus('monitoringParameterValues', id);
    };
    MotionMasterClient.prototype.requestStopMonitoringDeviceParameterValues = function (startMonitoringRequestId, messageId) {
        var stopMonitoringDeviceParameterValues = util_1.MotionMasterMessage.Request.StopMonitoringDeviceParameterValues.create({ startMonitoringRequestId: startMonitoringRequestId });
        var id = this.sendRequest({ stopMonitoringDeviceParameterValues: stopMonitoringDeviceParameterValues }, messageId);
        return this.selectMessageStatus('monitoringParameterValues', id);
    };
    MotionMasterClient.prototype.requestGetEthercatNetworkState = function (deviceAddress, messageId) {
        var getEthercatNetworkState = util_1.MotionMasterMessage.Request.GetEthercatNetworkState.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ getEthercatNetworkState: getEthercatNetworkState }, messageId);
        return this.selectMessageStatus('ethercatNetworkState', id);
    };
    MotionMasterClient.prototype.requestSetEthercatNetworkState = function (deviceAddress, state, messageId) {
        var setEthercatNetworkState = util_1.MotionMasterMessage.Request.SetEthercatNetworkState.create({ deviceAddress: deviceAddress, state: state });
        var id = this.sendRequest({ setEthercatNetworkState: setEthercatNetworkState }, messageId);
        return this.selectMessageStatus('ethercatNetworkState', id);
    };
    MotionMasterClient.prototype.requestStartNarrowAngleCalibration = function (deviceAddress, messageId) {
        var startNarrowAngleCalibration = util_1.MotionMasterMessage.Request.StartNarrowAngleCalibration.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ startNarrowAngleCalibration: startNarrowAngleCalibration }, messageId);
        return this.selectMessageStatus('narrowAngleCalibration', id);
    };
    MotionMasterClient.prototype.requestSetSystemClientTimeout = function (timeoutMs, messageId) {
        var setSystemClientTimeout = util_1.MotionMasterMessage.Request.SetSystemClientTimeout.create({ timeoutMs: timeoutMs });
        var id = this.sendRequest({ setSystemClientTimeout: setSystemClientTimeout }, messageId);
        return id;
    };
    MotionMasterClient.prototype.requestStartSystemIdentification = function (deviceAddress, durationSeconds, torqueAmplitude, startFrequency, endFrequency, messageId) {
        var startSystemIdentification = util_1.MotionMasterMessage.Request.StartSystemIdentification.create({
            deviceAddress: deviceAddress,
            durationSeconds: durationSeconds,
            torqueAmplitude: torqueAmplitude,
            startFrequency: startFrequency,
            endFrequency: endFrequency,
        });
        var id = this.sendRequest({ startSystemIdentification: startSystemIdentification }, messageId);
        return this.selectMessageStatus('systemIdentification', id);
    };
    MotionMasterClient.prototype.requestGetCirculoEncoderMagnetDistance = function (deviceAddress, encoderOrdinal, ringRevision, messageId) {
        var getCirculoEncoderMagnetDistance = util_1.MotionMasterMessage.Request.GetCirculoEncoderMagnetDistance.create({
            deviceAddress: deviceAddress,
            encoderOrdinal: encoderOrdinal,
            ringRevision: ringRevision,
        });
        var id = this.sendRequest({ getCirculoEncoderMagnetDistance: getCirculoEncoderMagnetDistance }, messageId);
        return this.selectMessageStatus('circuloEncoderMagnetDistance', id);
    };
    MotionMasterClient.prototype.requestStartCirculoEncoderNarrowAngleCalibrationProcedure = function (deviceAddress, encoderOrdinal, messageId) {
        var startCirculoEncoderNarrowAngleCalibrationProcedure = util_1.MotionMasterMessage.Request.StartCirculoEncoderNarrowAngleCalibrationProcedure.create({
            deviceAddress: deviceAddress,
            encoderOrdinal: encoderOrdinal,
        });
        var id = this.sendRequest({ startCirculoEncoderNarrowAngleCalibrationProcedure: startCirculoEncoderNarrowAngleCalibrationProcedure }, messageId);
        return this.selectMessageStatus('circuloEncoderNarrowAngleCalibrationProcedure', id);
    };
    MotionMasterClient.prototype.requestGetDeviceCia402State = function (deviceAddress, messageId) {
        var getDeviceCia402State = util_1.MotionMasterMessage.Request.GetDeviceCiA402State.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ getDeviceCia402State: getDeviceCia402State }, messageId);
        return this.selectMessageStatus('deviceCia402State', id);
    };
    MotionMasterClient.prototype.requestSetDeviceCia402State = function (deviceAddress, state, messageId) {
        var setDeviceCia402State = util_1.MotionMasterMessage.Request.SetDeviceCiA402State.create({ deviceAddress: deviceAddress, state: state });
        var id = this.sendRequest({ setDeviceCia402State: setDeviceCia402State }, messageId);
        return this.selectMessageStatus('deviceCia402State', id);
    };
    MotionMasterClient.prototype.requestGetSystemLog = function (messageId) {
        var getSystemLog = util_1.MotionMasterMessage.Request.GetSystemLog.create({});
        var id = this.sendRequest({ getSystemLog: getSystemLog }, messageId);
        return this.selectMessageStatus('systemLog', id);
    };
    MotionMasterClient.prototype.requestStartDeviceSiiRestore = function (devicePosition, siiContent, messageId) {
        var startDeviceSiiRestore = util_1.MotionMasterMessage.Request.StartDeviceSiiRestore.create({
            devicePosition: devicePosition,
            siiContent: siiContent,
        });
        var id = this.sendRequest({ startDeviceSiiRestore: startDeviceSiiRestore }, messageId);
        return this.selectMessageStatus('deviceSiiRestore', id);
    };
    MotionMasterClient.prototype.requestStartOpenLoopFieldControl = function (properties, messageId) {
        var startOpenLoopFieldControl = util_1.MotionMasterMessage.Request.StartOpenLoopFieldControl.create(properties);
        var id = this.sendRequest({ startOpenLoopFieldControl: startOpenLoopFieldControl }, messageId);
        return this.selectMessageStatus('openLoopFieldControl', id);
    };
    MotionMasterClient.prototype.requestStartFullAutoTuning = function (deviceAddress, type, controllerType, messageId) {
        if (controllerType === void 0) { controllerType = util_1.MotionMasterMessage.Request.StartFullAutoTuning.ControllerType.UNSPECIFIED; }
        var startFullAutoTuning = util_1.MotionMasterMessage.Request.StartFullAutoTuning.create({ deviceAddress: deviceAddress, type: type, controllerType: controllerType });
        var id = this.sendRequest({ startFullAutoTuning: startFullAutoTuning }, messageId);
        return this.selectMessageStatus('fullAutoTuning', id);
    };
    MotionMasterClient.prototype.requestStopFullAutoTuning = function (deviceAddress, messageId) {
        var stopFullAutoTuning = util_1.MotionMasterMessage.Request.StopFullAutoTuning.create({ deviceAddress: deviceAddress });
        var id = this.sendRequest({ stopFullAutoTuning: stopFullAutoTuning }, messageId);
        return this.selectMessageStatus('fullAutoTuning', id);
    };
    MotionMasterClient.prototype.requestStartCirculoEncoderConfiguration = function (deviceAddress, encoderOrdinal, messageId) {
        var startCirculoEncoderConfiguration = util_1.MotionMasterMessage.Request.StartCirculoEncoderConfiguration.create({ deviceAddress: deviceAddress, encoderOrdinal: encoderOrdinal });
        var id = this.sendRequest({ startCirculoEncoderConfiguration: startCirculoEncoderConfiguration }, messageId);
        return this.selectMessageStatus('circuloEncoderConfiguration', id);
    };
    MotionMasterClient.prototype.requestStopCirculoEncoderNarrowAngleCalibrationProcedure = function (deviceAddress, encoderOrdinal, messageId) {
        var stopCirculoEncoderNarrowAngleCalibrationProcedure = util_1.MotionMasterMessage.Request.StopCirculoEncoderNarrowAngleCalibrationProcedure.create({ deviceAddress: deviceAddress, encoderOrdinal: encoderOrdinal });
        var id = this.sendRequest({ stopCirculoEncoderNarrowAngleCalibrationProcedure: stopCirculoEncoderNarrowAngleCalibrationProcedure }, messageId);
        return this.selectMessageStatus('circuloEncoderNarrowAngleCalibrationProcedure', id);
    };
    MotionMasterClient.prototype.requestStartOsCommand = function (deviceAddress, timeoutMs, command, messageId) {
        var startOsCommand = util_1.MotionMasterMessage.Request.StartOsCommand.create({ command: command, deviceAddress: deviceAddress, timeoutMs: timeoutMs });
        var id = this.sendRequest({ startOsCommand: startOsCommand }, messageId);
        return this.selectMessageStatus('osCommand', id);
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
        return this.input$.pipe(operators_1.filter(function (message) { return message.id === messageId; }));
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
            ? this.input$
            : this.input$.pipe(operators_1.filter(function (message) { return message.id === messageId; }));
        // we expect Status to be ALWAYS defined on input message
        var status$ = message$.pipe(operators_1.map(function (message) { return message.status; }));
        return status$.pipe(operators_1.map(function (status) { return status[type]; }));
    };
    /**
     * Send Request message to output.
     * @param request proto message
     * @param [messageId] identifies request, if no messageId is provided one is generated with uuid v4 and returned
     * @returns passed or generated messageId
     */
    MotionMasterClient.prototype.sendRequest = function (request, messageId) {
        var id = messageId || uuid_1.v4();
        var message = util_1.MotionMasterMessage.create({ request: request, id: id });
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