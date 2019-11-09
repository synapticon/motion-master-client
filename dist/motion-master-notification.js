"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var MotionMasterNotification = /** @class */ (function () {
    function MotionMasterNotification() {
        this.input$ = new rxjs_1.Subject();
        this.message$ = this.input$.pipe(operators_1.filter(function (_a) {
            var topic = _a.topic;
            return topic === 'notification';
        }), operators_1.pluck('message'));
        this.systemEvent$ = this.message$.pipe(operators_1.pluck('status'), operators_1.map(function (status) { return status ? status.systemEvent : null; }));
        this.deviceEvent$ = this.message$.pipe(operators_1.pluck('status'), operators_1.map(function (status) { return status ? status.deviceEvent : null; }));
        this.monitoring$ = this.input$.pipe(operators_1.filter(function (_a) {
            var topic = _a.topic;
            return topic !== 'notification';
        }));
    }
    MotionMasterNotification.prototype.selectByTopic = function (selectTopic) {
        return this.input$.pipe(operators_1.filter(function (_a) {
            var topic = _a.topic;
            return topic === selectTopic;
        }), operators_1.map(function (_a) {
            var message = _a.message;
            return message;
        }));
    };
    return MotionMasterNotification;
}());
exports.MotionMasterNotification = MotionMasterNotification;
//# sourceMappingURL=motion-master-notification.js.map