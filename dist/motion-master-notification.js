"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var MotionMasterNotification = /** @class */ (function () {
    function MotionMasterNotification() {
        /**
         * Buffered messages by topic.
         */
        this.input$ = new rxjs_1.Subject();
        /**
         * Notification messages are system and device events.
         */
        this.notification$ = this.selectMessagesByTopic('notification').pipe(operators_1.switchMap(function (messages) { return rxjs_1.from(messages); }));
        /**
         * An observable of system event status messages.
         * Motion Master goes through several states until it gets to initialized.
         */
        this.systemEvent$ = this.notification$.pipe(operators_1.filter(function (message) { return (message.status && 'systemEvent' in message.status) === true; }), 
        // tslint:disable-next-line: no-non-null-assertion
        operators_1.map(function (message) { return message.status.systemEvent; }));
        /**
         * An observable of device event status messages.
         */
        this.deviceEvent$ = this.notification$.pipe(operators_1.filter(function (message) { return (message.status && 'deviceEvent' in message.status) === true; }), 
        // tslint:disable-next-line: no-non-null-assertion
        operators_1.map(function (message) { return message.status.deviceEvent; }));
    }
    /**
     * Select messages by topic.
     * @param t topic to filter by
     * @returns an observable of messages
     */
    MotionMasterNotification.prototype.selectMessagesByTopic = function (t) {
        return this.input$.pipe(operators_1.filter(function (_a) {
            var topic = _a.topic;
            return topic === t;
        }), operators_1.pluck('messages'));
    };
    return MotionMasterNotification;
}());
exports.MotionMasterNotification = MotionMasterNotification;
//# sourceMappingURL=motion-master-notification.js.map