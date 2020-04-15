import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { bufferCount, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { v4 } from 'uuid';

import { MotionMasterNotification } from './motion-master-notification';
import { IMotionMasterNotificationSubscribeData } from './motion-master-notification-subscribe-data';
import { compareParameterValues, MotionMasterMessage } from './util';

export class MotionMasterNotificationWebSocketConnection {

  notification = new MotionMasterNotification();

  readonly connected$ = new BehaviorSubject<boolean>(false);

  private decoder = new TextDecoder('utf-8');

  private closeObserver = {
    next: () => {
      this.connected$.next(false);
    },
  };

  private openObserver = {
    next: () => {
      this.connected$.next(true);
    },
  };

  wssConfig: WebSocketSubjectConfig<ArrayBuffer> = {
    binaryType: 'arraybuffer',
    closeObserver: this.closeObserver,
    deserializer: (e: MessageEvent) => e.data,
    openObserver: this.openObserver,
    url: this.wssUrl,
  };

  wss$: WebSocketSubject<any> = webSocket(this.wssConfig);

  /**
   * Map the incoming array buffer to topic (string) and payload (encoded protobuf message).
   */
  buffer$: Observable<[string, ArrayBuffer]> = this.wss$.pipe(
    map((buffer: ArrayBuffer) => {
      const end = new Uint8Array(buffer, 0, 1)[0] + 1; // topic length is the 1st byte (topic MUST be less than 255 bytes long)
      const topic = this.decoder.decode(buffer.slice(1, end)); // topic starts from the 2nd byte
      return [topic, buffer.slice(end)]; // the rest is the payload (encoded protobuf message)
    }),
  );

  /**
   * Map request message ids to subscriptions.
   */
  subscriptions: { [key: string]: Subscription } = Object.create(null);

  constructor(
    public wssUrl = `ws://${location.hostname}:63525`,
  ) { }

  /**
   * Subscribe to a topic and optionally buffer messages.
   * First subscription will open WebSocket connection.
   * @param data subscribe data
   * @returns subscription id
   */
  subscribe(data: IMotionMasterNotificationSubscribeData) {
    const { bufferSize = 1, distinct = false, id = v4(), topic } = data;

    let observable = this.selectBufferByTopic(topic, true);

    if (distinct) {
      observable = observable.pipe(
        distinctUntilChanged(compareParameterValues),
      );
    }

    const messages$ = observable.pipe(
      bufferCount(bufferSize),
    );

    const subscription = messages$.subscribe((messages) => {
      this.notification.input$.next({ topic, messages });
    });

    this.subscriptions[id] = subscription;

    return id;
  }

  /**
   * Unsubscribe from a previous subscription.
   * WebSocket connection will close on last unsubscribe.
   * @todo find a way to emit all buffered messages before unsubscribe.
   * @param id message id related to previous subscription
   */
  unsubscribe(id: string) {
    if (this.subscriptions[id]) {
      this.subscriptions[id].unsubscribe();
      delete this.subscriptions[id];
    }
  }

  /**
   * Unsubscribe from all previously subscribed topics.
   */
  unsubscriberAll() {
    Object.keys(this.subscriptions).forEach((id) => this.unsubscribe(id));
  }

  /**
   * Select incoming buffer by topic and optionally decode it to MotionMasterMessage.
   * @param topic to filter incoming messages by
   * @param decode to MotionMasterMessage or leave the content as Uint8Array
   * @returns an observable of topic and depending on the value of decode argument: MotionMasterMessage when true, Uint8Array otherwise
   */
  selectBufferByTopic<T extends boolean>(topic: string, decode: T): T extends true ? Observable<MotionMasterMessage> : Observable<Uint8Array> {
    return this.buffer$.pipe(
      filter((data) => data[0] === topic),
      map((data) => decode
        ? MotionMasterMessage.decode(new Uint8Array(data[1]))
        : new Uint8Array(data[1]),
      ),
    ) as any;
  }

}
