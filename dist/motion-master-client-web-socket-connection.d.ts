import { BehaviorSubject } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { MotionMasterClient } from './motion-master-client';
import { MotionMasterMessage } from './util';
export declare class MotionMasterClientWebSocketConnection {
    wssUrl: string;
    client: MotionMasterClient;
    readonly connected$: BehaviorSubject<boolean>;
    pingDelay: number;
    private pingSystemIntervalObserver;
    private pingSystemIntervalSubscription;
    aliveTimeout: number;
    readonly alive$: BehaviorSubject<boolean>;
    private aliveTimeoutId;
    private closeObserver;
    private openObserver;
    private wssConfig;
    wss$: WebSocketSubject<Uint8Array>;
    message$: import("rxjs").Observable<MotionMasterMessage>;
    private messageSubscription;
    private clientOutputSubscription;
    constructor(wssUrl?: string);
    close(): void;
    open(): void;
    private keepalive;
}
//# sourceMappingURL=motion-master-client-web-socket-connection.d.ts.map