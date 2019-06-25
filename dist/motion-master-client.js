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
        this.systemVersion$ = this.selectStatus$('systemVersion');
        this.deviceInfo$ = this.selectStatus$('deviceInfo');
        this.deviceParameterInfo$ = this.selectStatus$('deviceParameterInfo');
        this.deviceParameterValues$ = this.selectStatus$('deviceParameterValues');
    }
    MotionMasterClient.prototype.sendRequest = function (request, messageId) {
        var message = encodeRequest(request, messageId);
        this.output.next(message);
    };
    MotionMasterClient.prototype.selectStatus$ = function (type) {
        return this.status$.pipe(operators_1.filter(function (status) { return status.type === type; }), operators_1.map(function (status) { return status[type]; }));
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
        var getDeviceInfo = {};
        this.sendRequest({ getDeviceInfo: getDeviceInfo }, messageId);
        return observable;
    };
    MotionMasterClient.prototype.filterNotificationByTopic$ = function (topic) {
        return this.notification.pipe(operators_1.filter(function (notif) { return notif[0].toString('utf8') === topic; }), operators_1.map(function (notif) { return ({ topic: topic, message: decodeMotionMasterMessage(notif[1]) }); }));
    };
    MotionMasterClient.prototype.filterMotionMasterMessageById$ = function (messageId) {
        return this.motionMasterMessage$.pipe(operators_1.filter(function (message) { return message.id === messageId; }));
    };
    return MotionMasterClient;
}());
exports.MotionMasterClient = MotionMasterClient;
//# sourceMappingURL=motion-master-client.js.map