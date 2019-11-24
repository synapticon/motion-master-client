"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var webSocket_1 = require("rxjs/webSocket");
var uuid_1 = require("uuid");
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
         * @todo ensure that bufferCount buffers topic first and message buffer second in all cases.
         */
        this.buffer$ = this.wss$.pipe(operators_1.bufferCount(2));
        /**
         * Map request message ids to subscriptions.
         */
        this.subscriptions = Object.create(null);
    }
    /**
     * Subscribe to a topic and optionally buffer messages.
     * First subscription will open WebSocket connection.
     * @param data subscribe data
     * @returns subscription id
     */
    MotionMasterNotificationWebSocketConnection.prototype.subscribe = function (data) {
        var _this = this;
        var _a = data.bufferSize, bufferSize = _a === void 0 ? 1 : _a, _b = data.distinct, distinct = _b === void 0 ? false : _b, _c = data.id, id = _c === void 0 ? uuid_1.v4() : _c, topic = data.topic;
        var observable = this.selectBufferByTopic(topic, true);
        if (distinct) {
            observable = observable.pipe(operators_1.distinctUntilChanged(util_1.compareParameterValues));
        }
        var messages$ = observable.pipe(operators_1.bufferCount(bufferSize));
        var subscription = messages$.subscribe(function (messages) { return _this.notification.input$.next({ topic: topic, messages: messages }); });
        this.subscriptions[id] = subscription;
        return id;
    };
    /**
     * Unsubscribe from a previous subscription.
     * WebSocket connection will close on last unsubscribe.
     * @todo find a way to emit all buffered messages before unsubscribe.
     * @param id message id related to previous subscription
     */
    MotionMasterNotificationWebSocketConnection.prototype.unsubscribe = function (id) {
        if (this.subscriptions[id]) {
            this.subscriptions[id].unsubscribe();
            delete this.subscriptions[id];
        }
    };
    /**
     * Unsubscribe from all previously subscribed topics.
     */
    MotionMasterNotificationWebSocketConnection.prototype.unsubscriberAll = function () {
        var _this = this;
        Object.keys(this.subscriptions).forEach(function (id) { return _this.unsubscribe(id); });
    };
    /**
     * Select incoming buffer by topic and optionally decode it to MotionMasterMessage.
     * @param topic to filter incoming messages by
     * @param decode to MotionMasterMessage or leave the content as Uint8Array
     * @returns an observable of topic and depending on the value of decode argument: MotionMasterMessage when true, Uint8Array otherwise
     */
    MotionMasterNotificationWebSocketConnection.prototype.selectBufferByTopic = function (topic, decode) {
        return this.buffer$.pipe(operators_1.filter(function (data) { return data[0] === topic; }), operators_1.map(function (data) { return decode
            ? util_1.MotionMasterMessage.decode(new Uint8Array(data[1]))
            : new Uint8Array(data[1]); }));
    };
    return MotionMasterNotificationWebSocketConnection;
}());
exports.MotionMasterNotificationWebSocketConnection = MotionMasterNotificationWebSocketConnection;
//# sourceMappingURL=motion-master-notification-web-socket-connection.js.map