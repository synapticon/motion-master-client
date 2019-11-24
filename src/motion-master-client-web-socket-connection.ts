import { BehaviorSubject, interval, Observable, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';

import { MotionMasterClient } from './motion-master-client';
import { MotionMasterMessage } from './util';

export class MotionMasterClientWebSocketConnection {

  /**
   * An instance of MotionMasterClient bound to this WebSocket connection.
   */
  readonly client = new MotionMasterClient();

  /**
   * Emits a boolean value when connection gets opened or closed.
   */
  readonly connected$ = new BehaviorSubject<boolean>(false);

  /**
   * Emits a boolean value when Motion Master is considered alive. True when messages are received
   * in regular interval, or false when alive timeout expires.
   */
  readonly alive$ = new BehaviorSubject<boolean>(false);

  private pingSystemIntervalObserver = { next: () => this.client.requestPingSystem() };

  private pingSystemIntervalSubscription = new Subscription();

  private aliveTimeoutId = 0;

  private closeObserver = {
    next: () => {
      this.pingSystemIntervalSubscription.unsubscribe();
      this.connected$.next(false);
      self.clearTimeout(this.aliveTimeoutId);
      this.alive$.next(false);
    },
  };

  private openObserver = {
    next: () => {
      this.pingSystemIntervalSubscription = interval(this.pingSystemPeriod).subscribe(this.pingSystemIntervalObserver);
      this.connected$.next(true);
    },
  };

  private wssConfig: WebSocketSubjectConfig<Uint8Array> = {
    binaryType: 'arraybuffer',
    closeObserver: this.closeObserver,
    deserializer: (e: MessageEvent) => new Uint8Array(e.data),
    openObserver: this.openObserver,
    serializer: (value) => value,
    url: this.wssUrl,
  };

  readonly wss$: WebSocketSubject<Uint8Array> = webSocket(this.wssConfig);

  readonly message$: Observable<MotionMasterMessage> = this.wss$.pipe(
    map((data) => MotionMasterMessage.decode(data)),
  );

  private messageSubscription = new Subscription();
  private clientOutputSubscription = new Subscription();

  /**
   * MotionMasterClientWebSocketConnection constructor.
   * @param wssUrl Motion Master Bridge WebSocket client URL.
   * @param pingSystemPeriod timeframe in which to send ping system message to Motion Master.
   * @param aliveTimeout how long to wait for Motion Master message before emitting it's not alive.
   */
  constructor(
    public wssUrl = `ws://${location.hostname}:63524`,
    public pingSystemPeriod = 150,
    public aliveTimeout = 1000,
  ) { }

  close() {
    this.messageSubscription.unsubscribe();
    this.clientOutputSubscription.unsubscribe();
  }

  open() {
    this.close();

    this.messageSubscription = this.message$.pipe(
      tap(() => this.keepalive()),
      filter((message) => message && message.status ? !message.status.systemPong : false),
    ).subscribe((message) => {
      this.client.input$.next(message);
    });

    this.clientOutputSubscription = this.client.output$.subscribe((message) => {
      this.wss$.next(MotionMasterMessage.encode(message).finish());
    });
  }

  private keepalive() {
    if (this.alive$.getValue() === false) {
      this.alive$.next(true);
    }
    self.clearTimeout(this.aliveTimeoutId);
    this.aliveTimeoutId = self.setTimeout(() => this.alive$.next(false), this.aliveTimeout);
  }

}
