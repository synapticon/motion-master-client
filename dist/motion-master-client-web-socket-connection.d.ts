import { BehaviorSubject } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { MotionMasterClient } from './motion-master-client';
import { MotionMasterMessage } from './util';
export interface IMotionMasterClientWebSocketConnectionConfig {
    aliveTimeout: number;
    pingDelay: number;
    url: string;
}
export declare class MotionMasterClientWebSocketConnection {
    client: MotionMasterClient;
    config: IMotionMasterClientWebSocketConnectionConfig;
    readonly connected$: BehaviorSubject<boolean>;
    private pingSystemIntervalObserver;
    private pingSystemIntervalSubscription;
    readonly alive$: BehaviorSubject<boolean>;
    private aliveTimeoutId;
    private closeObserver;
    private openObserver;
    private wssConfig;
    wss$: WebSocketSubject<Uint8Array>;
    message$: import("rxjs").Observable<MotionMasterMessage>;
    private messageSubscription;
    private clientOutputSubscription;
    constructor(config?: Partial<IMotionMasterClientWebSocketConnectionConfig>);
    close(): void;
    open(): void;
    private keepalive;
}
//# sourceMappingURL=motion-master-client-web-socket-connection.d.ts.map