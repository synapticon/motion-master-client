import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';

import { MotionMasterClient } from './motion-master-client';
import { MotionMasterMessage } from './util';

export interface IMotionMasterClientWebSocketConnectionConfig {
  aliveTimeout: number;
  pingDelay: number;
  url: string;
}

export class MotionMasterClientWebSocketConnection {

  client = new MotionMasterClient();

  config: IMotionMasterClientWebSocketConnectionConfig = {
    aliveTimeout: 1000,
    pingDelay: 200,
    url: `ws://${location.hostname}:63524`,
  };

  readonly connected$ = new BehaviorSubject<boolean>(false);

  private pingSystemIntervalObserver = { next: () => this.client.requestPingSystem() };
  private pingSystemIntervalSubscription = new Subscription();

  readonly alive$ = new BehaviorSubject<boolean>(false);
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
      this.pingSystemIntervalSubscription = interval(this.config.pingDelay).subscribe(this.pingSystemIntervalObserver);
      this.connected$.next(true);
    },
  };

  private wssConfig: WebSocketSubjectConfig<Uint8Array> = {
    binaryType: 'arraybuffer',
    closeObserver: this.closeObserver,
    deserializer: (e: MessageEvent) => new Uint8Array(e.data),
    openObserver: this.openObserver,
    serializer: (value) => value,
    url: this.config.url,
  };

  wss$: WebSocketSubject<Uint8Array> = webSocket(this.wssConfig);

  message$ = this.wss$.pipe(
    map((data) => MotionMasterMessage.decode(data)),
  );

  private messageSubscription = new Subscription();
  private clientOutputSubscription = new Subscription();

  constructor(config?: Partial<IMotionMasterClientWebSocketConnectionConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

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
    this.aliveTimeoutId = self.setTimeout(() => this.alive$.next(false), this.config.aliveTimeout);
  }

}
