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
    MotionMasterClient.prototype.requestGetDeviceParameterInfo = function (deviceAddress, messageId) {
        var getDeviceParameterInfo = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.GetDeviceParameterInfo.create({ deviceAddress: deviceAddress });
        var request = { getDeviceParameterInfo: getDeviceParameterInfo };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestGetDeviceParameterValues = function (deviceAddress, parameters, messageId) {
        var getDeviceParameterValues = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.create({
            deviceAddress: deviceAddress,
            parameters: parameters,
        });
        var request = { getDeviceParameterValues: getDeviceParameterValues };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.requestSetDeviceParameterValues = function (deviceAddress, parameterValues, messageId) {
        var setDeviceParameterValues = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.SetDeviceParameterValues.create({
            deviceAddress: deviceAddress,
            parameterValues: parameterValues,
        });
        var request = { setDeviceParameterValues: setDeviceParameterValues };
        this.sendRequest(request, messageId);
    };
    MotionMasterClient.prototype.sendRequest = function (request, messageId) {
        var message = encodeRequest(request, messageId);
        this.output.next(message);
    };
    MotionMasterClient.prototype.startMonitoringDeviceParameterValues = function (interval, topic, getDeviceParameterValues, messageId) {
        var startMonitoringDeviceParameterValues = motion_master_proto_1.motionmaster.MotionMasterMessage.Request.StartMonitoringDeviceParameterValues.create({
            getDeviceParameterValues: getDeviceParameterValues,
            interval: interval,
            topic: topic,
        });
        var request = { startMonitoringDeviceParameterValues: startMonitoringDeviceParameterValues };
        this.sendRequest(request, messageId);
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