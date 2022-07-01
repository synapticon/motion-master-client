"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotionMasterNotificationWebSocketConnection = void 0;
var rxjs_1 = require("rxjs");
var lodash_1 = require("lodash");
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
        this.monitoringTimedout$ = new rxjs_1.Subject();
        this.decoder = new TextDecoder('utf-8');
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
         * Map the incoming array buffer to topic (string) and payload (encoded protobuf message).
         */
        this.buffer$ = this.wss$.pipe(operators_1.map(function (buffer) {
            var end = new Uint8Array(buffer, 0, 1)[0] + 1; // topic length is the 1st byte (topic MUST be less than 255 bytes long)
            var topic = _this.decoder.decode(buffer.slice(1, end)); // topic starts from the 2nd byte
            return [topic, buffer.slice(end)]; // the rest is the payload (encoded protobuf message)
        }));
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
        var _a = data.bufferSize, bufferSize = _a === void 0 ? 1 : _a, _b = data.distinct, distinct = _b === void 0 ? false : _b, _c = data.id, id = _c === void 0 ? uuid_1.v4() : _c, topic = data.topic, monitoringTimeoutDue = data.monitoringTimeoutDue;
        var observable = this.selectBufferByTopic(topic, true);
        if (distinct) {
            observable = observable.pipe(
            // compare values only, ignore timestamps
            operators_1.distinctUntilChanged(function (x, y) {
                var _a, _b, _c, _d, _e, _f;
                return lodash_1.isEqual((_c = (_b = (_a = x === null || x === void 0 ? void 0 : x.status) === null || _a === void 0 ? void 0 : _a.monitoringParameterValues) === null || _b === void 0 ? void 0 : _b.deviceParameterValues) === null || _c === void 0 ? void 0 : _c.parameterValues, (_f = (_e = (_d = y === null || y === void 0 ? void 0 : y.status) === null || _d === void 0 ? void 0 : _d.monitoringParameterValues) === null || _e === void 0 ? void 0 : _e.deviceParameterValues) === null || _f === void 0 ? void 0 : _f.parameterValues);
            }));
        }
        var messages$ = observable.pipe(operators_1.bufferCount(bufferSize));
        var subscription = messages$.subscribe(function (messages) {
            _this.notification.input$.next({ topic: topic, messages: messages });
        });
        if (monitoringTimeoutDue) {
            subscription.add(observable.pipe(operators_1.timeout(monitoringTimeoutDue)).subscribe({
                error: function () { return _this.monitoringTimedout$.next({ id: id, topic: topic }); },
            }));
        }
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
    MotionMasterNotificationWebSocketConnection.prototype.unsubscribeAll = function () {
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