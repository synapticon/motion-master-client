"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var MotionMasterNotification = /** @class */ (function () {
    function MotionMasterNotification() {
        this.input$ = new rxjs_1.Subject();
        /**
         * Notification messages are system and device events.
         */
        this.notification$ = this.selectByTopic('notification');
        /**
         * An observable of system event status messages.
         * Motion Master goes through several states until it gets to initialized.
         */
        this.systemEvent$ = this.notification$.pipe(operators_1.pluck('status'), operators_1.map(function (status) { return status ? status.systemEvent : null; }));
        /**
         * An observable of device event status messages.
         */
        this.deviceEvent$ = this.notification$.pipe(operators_1.pluck('status'), operators_1.map(function (status) { return status ? status.deviceEvent : null; }));
    }
    /**
     * Select messages by topic.
     * @param t topic to filter by
     * @returns an observable of messages
     */
    MotionMasterNotification.prototype.selectByTopic = function (t) {
        return this.input$.pipe(operators_1.filter(function (_a) {
            var topic = _a.topic;
            return topic === t;
        }), operators_1.pluck('message'));
    };
    return MotionMasterNotification;
}());
exports.MotionMasterNotification = MotionMasterNotification;
//# sourceMappingURL=motion-master-notification.js.map