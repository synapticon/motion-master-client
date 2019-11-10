"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var webSocket_1 = require("rxjs/webSocket");
var motion_master_client_1 = require("./motion-master-client");
var util_1 = require("./util");
var MotionMasterClientWebSocketConnection = /** @class */ (function () {
    function MotionMasterClientWebSocketConnection(config) {
        var _this = this;
        this.client = new motion_master_client_1.MotionMasterClient();
        this.config = {
            aliveTimeout: 1000,
            pingDelay: 200,
            url: "ws://" + location.hostname + ":63524",
        };
        this.connected$ = new rxjs_1.BehaviorSubject(false);
        this.pingSystemIntervalObserver = { next: function () { return _this.client.requestPingSystem(); } };
        this.pingSystemIntervalSubscription = new rxjs_1.Subscription();
        this.alive$ = new rxjs_1.BehaviorSubject(false);
        this.aliveTimeoutId = 0;
        this.closeObserver = {
            next: function () {
                _this.pingSystemIntervalSubscription.unsubscribe();
                _this.connected$.next(false);
                self.clearTimeout(_this.aliveTimeoutId);
                _this.alive$.next(false);
            },
        };
        this.openObserver = {
            next: function () {
                _this.pingSystemIntervalSubscription = rxjs_1.interval(_this.config.pingDelay).subscribe(_this.pingSystemIntervalObserver);
                _this.connected$.next(true);
            },
        };
        this.wssConfig = {
            binaryType: 'arraybuffer',
            closeObserver: this.closeObserver,
            deserializer: function (e) { return new Uint8Array(e.data); },
            openObserver: this.openObserver,
            serializer: function (value) { return value; },
            url: this.config.url,
        };
        this.wss$ = webSocket_1.webSocket(this.wssConfig);
        this.message$ = this.wss$.pipe(operators_1.map(function (data) { return util_1.MotionMasterMessage.decode(data); }));
        this.messageSubscription = new rxjs_1.Subscription();
        this.clientOutputSubscription = new rxjs_1.Subscription();
        if (config) {
            this.config = __assign(__assign({}, this.config), config);
        }
    }
    MotionMasterClientWebSocketConnection.prototype.close = function () {
        this.messageSubscription.unsubscribe();
        this.clientOutputSubscription.unsubscribe();
    };
    MotionMasterClientWebSocketConnection.prototype.open = function () {
        var _this = this;
        this.close();
        this.messageSubscription = this.message$.pipe(operators_1.tap(function () { return _this.keepalive(); }), operators_1.filter(function (message) { return message && message.status ? !message.status.systemPong : false; })).subscribe(function (message) {
            _this.client.input$.next(message);
        });
        this.clientOutputSubscription = this.client.output$.subscribe(function (message) {
            _this.wss$.next(util_1.MotionMasterMessage.encode(message).finish());
        });
    };
    MotionMasterClientWebSocketConnection.prototype.keepalive = function () {
        var _this = this;
        if (this.alive$.getValue() === false) {
            this.alive$.next(true);
        }
        self.clearTimeout(this.aliveTimeoutId);
        this.aliveTimeoutId = self.setTimeout(function () { return _this.alive$.next(false); }, this.config.aliveTimeout);
    };
    return MotionMasterClientWebSocketConnection;
}());
exports.MotionMasterClientWebSocketConnection = MotionMasterClientWebSocketConnection;
//# sourceMappingURL=motion-master-client-web-socket-connection.js.map