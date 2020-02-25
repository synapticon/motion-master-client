import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { MotionMasterNotification } from './motion-master-notification';
import { IMotionMasterNotificationSubscribeData } from './motion-master-notification-subscribe-data';
import { MotionMasterMessage } from './util';
export declare class MotionMasterNotificationWebSocketConnection {
    wssUrl: string;
    notification: MotionMasterNotification;
    readonly connected$: BehaviorSubject<boolean>;
    private decoder;
    private closeObserver;
    private openObserver;
    wssConfig: WebSocketSubjectConfig<ArrayBuffer>;
    wss$: WebSocketSubject<any>;
    /**
     * Map the incoming array buffer to topic (string) and payload (encoded protobuf message).
     */
    buffer$: Observable<[string, ArrayBuffer]>;
    /**
     * Map request message ids to subscriptions.
     */
    subscriptions: {
        [key: string]: Subscription;
    };
    constructor(wssUrl?: string);
    /**
     * Subscribe to a topic and optionally buffer messages.
     * First subscription will open WebSocket connection.
     * @param data subscribe data
     * @returns subscription id
     */
    subscribe(data: IMotionMasterNotificationSubscribeData): string;
    /**
     * Unsubscribe from a previous subscription.
     * WebSocket connection will close on last unsubscribe.
     * @todo find a way to emit all buffered messages before unsubscribe.
     * @param id message id related to previous subscription
     */
    unsubscribe(id: string): void;
    /**
     * Unsubscribe from all previously subscribed topics.
     */
    unsubscriberAll(): void;
    /**
     * Select incoming buffer by topic and optionally decode it to MotionMasterMessage.
     * @param topic to filter incoming messages by
     * @param decode to MotionMasterMessage or leave the content as Uint8Array
     * @returns an observable of topic and depending on the value of decode argument: MotionMasterMessage when true, Uint8Array otherwise
     */
    selectBufferByTopic<T extends boolean>(topic: string, decode: T): T extends true ? Observable<MotionMasterMessage> : Observable<Uint8Array>;
}
//# sourceMappingURL=motion-master-notification-web-socket-connection.d.ts.map