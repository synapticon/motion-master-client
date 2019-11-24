import { BehaviorSubject, Observable } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { MotionMasterClient } from './motion-master-client';
import { MotionMasterMessage } from './util';
export declare class MotionMasterClientWebSocketConnection {
    wssUrl: string;
    pingSystemPeriod: number;
    aliveTimeout: number;
    /**
     * An instance of MotionMasterClient bound to this WebSocket connection.
     */
    readonly client: MotionMasterClient;
    /**
     * Emits a boolean value when connection gets opened or closed.
     */
    readonly connected$: BehaviorSubject<boolean>;
    /**
     * Emits a boolean value when Motion Master is considered alive. True when messages are received
     * in regular interval, or false when alive timeout expires.
     */
    readonly alive$: BehaviorSubject<boolean>;
    private pingSystemIntervalObserver;
    private pingSystemIntervalSubscription;
    private aliveTimeoutId;
    private closeObserver;
    private openObserver;
    private wssConfig;
    readonly wss$: WebSocketSubject<Uint8Array>;
    readonly message$: Observable<MotionMasterMessage>;
    private messageSubscription;
    private clientOutputSubscription;
    /**
     * MotionMasterClientWebSocketConnection constructor.
     * @param wssUrl Motion Master Bridge WebSocket client URL.
     * @param pingSystemPeriod timeframe in which to send ping system message to Motion Master.
     * @param aliveTimeout how long to wait for Motion Master message before emitting it's not alive.
     */
    constructor(wssUrl?: string, pingSystemPeriod?: number, aliveTimeout?: number);
    close(): void;
    open(): void;
    private keepalive;
}
//# sourceMappingURL=motion-master-client-web-socket-connection.d.ts.map