"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var webSocket_1 = require("rxjs/webSocket");
var motion_master_notification_1 = require("./motion-master-notification");
var util_1 = require("./util");
var MotionMasterNotificationWebSocketConnection = /** @class */ (function () {
    function MotionMasterNotificationWebSocketConnection(wssUrl) {
        var _this = this;
        if (wssUrl === void 0) { wssUrl = "ws://" + location.hostname + ":63525"; }
        this.wssUrl = wssUrl;
        this.notification = new motion_master_notification_1.MotionMasterNotification();
        this.connected$ = new rxjs_1.BehaviorSubject(false);
        this.closeObserver = {
            next: function () {
                _this.connected$.next(false);
            },
        };
        this.openObserver = {
            next: function () {
                _this.connected$.next(true);
            },
        };
        this.wssConfig = {
            binaryType: 'arraybuffer',
            closeObserver: this.closeObserver,
            deserializer: function (e) { return e.data; },
            openObserver: this.openObserver,
            url: this.wssUrl,
        };
        this.wss$ = webSocket_1.webSocket(this.wssConfig);
        /**
         * Topic and Motion Master message are sent as a separate WebSocket messages.
         * Collect both topic and Motion Master message and then emit.
         * TODO: Ensure that this works as expected or switch to a single WebSocket message!
         */
        this.buffer$ = this.wss$.pipe(operators_1.bufferCount(2));
        this.subscriptions = Object.create(null);
    }
    /**
     * Subscribe to a topic and optionally buffer messages.
     * First subscription will open WebSocket connection.
     * @param topic topic to subscribe to
     * @param bufferSize how many messages to buffer before sending
     * @returns subscription
     */
    MotionMasterNotificationWebSocketConnection.prototype.subscribe = function (topic, bufferSize) {
        var _this = this;
        if (bufferSize === void 0) { bufferSize = 1; }
        this.unsubscribe(topic);
        var observable = this.selectByTopic(topic, true).pipe(operators_1.bufferCount(bufferSize));
        // TODO: Distinct until changed get device parameter values.
        var subscription = observable.subscribe(function (messages) {
            messages.forEach(function (message) { return _this.notification.input$.next({ topic: topic, message: message }); });
        });
        this.subscriptions[topic] = subscription;
        return subscription;
    };
    /**
     * Unsubscribe from a previously subscribed topic.
     * WebSocket connection will close on last unsubscribe.
     * @param topic topic to unsubscribe from
     */
    MotionMasterNotificationWebSocketConnection.prototype.unsubscribe = function (topic) {
        // TODO: Emit all buffered messages before unsubscribe.
        if (this.subscriptions[topic]) {
            this.subscriptions[topic].unsubscribe();
            delete this.subscriptions[topic];
        }
    };
    /**
     * Unsubscribe from all previously subscribed topics.
     */
    MotionMasterNotificationWebSocketConnection.prototype.unsubscriberAll = function () {
        var _this = this;
        Object.keys(this.subscriptions).forEach(function (topic) { return _this.unsubscribe(topic); });
    };
    /**
     * Select incoming messages by topic and optionally decode the content.
     * @param topic to filter incoming messages by
     * @param decode to MotionMasterMessage or leave the content as Uint8Array
     * @returns an observable of topic and depending on the value of decode argument: MotionMasterMessage when true, Uint8Array otherwise
     */
    MotionMasterNotificationWebSocketConnection.prototype.selectByTopic = function (topic, decode) {
        return this.buffer$.pipe(operators_1.filter(function (data) { return data[0] === topic; }), operators_1.map(function (data) { return decode
            ? util_1.MotionMasterMessage.decode(new Uint8Array(data[1]))
            : new Uint8Array(data[1]); }));
    };
    return MotionMasterNotificationWebSocketConnection;
}());
exports.MotionMasterNotificationWebSocketConnection = MotionMasterNotificationWebSocketConnection;
//# sourceMappingURL=motion-master-notification-web-socket-connection.js.map