import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { bufferCount, filter, map } from 'rxjs/operators';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';

import { MotionMasterNotification } from './motion-master-notification';
import { MotionMasterMessage } from './util';

export class MotionMasterNotificationWebSocketConnection {

  notification = new MotionMasterNotification();

  readonly connected$ = new BehaviorSubject<boolean>(false);

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

  wssConfig: WebSocketSubjectConfig<string | ArrayBuffer> = {
    binaryType: 'arraybuffer',
    closeObserver: this.closeObserver,
    deserializer: (e: MessageEvent) => e.data,
    openObserver: this.openObserver,
    url: this.wssUrl,
  };

  wss$: WebSocketSubject<string | ArrayBuffer> = webSocket(this.wssConfig);

  /**
   * Topic and Motion Master message are sent as a separate WebSocket messages.
   * Collect both topic and Motion Master message and then emit.
   * TODO: Ensure that this works as expected or switch to a single WebSocket message!
   */
  buffer$ = this.wss$.pipe(
    bufferCount(2),
  );

  subscriptions: { [key: string]: Subscription } = Object.create(null);

  constructor(public wssUrl = `ws://${location.hostname}:63525`) { }

  /**
   * Subscribe to a topic and optionally buffer messages.
   * First subscription will open WebSocket connection.
   * @param topic topic to subscribe to
   * @param bufferSize how many messages to buffer before sending
   * @returns subscription
   */
  subscribe(topic: string, bufferSize: number = 1) {
    this.unsubscribe(topic);

    const observable = this.selectByTopic(topic, true).pipe(
      bufferCount(bufferSize),
    );

    // TODO: Distinct until changed get device parameter values.

    const subscription = observable.subscribe((messages) => {
      messages.forEach((message) => this.notification.input$.next({ topic, message }));
    });

    this.subscriptions[topic] = subscription;

    return subscription;
  }

  /**
   * Unsubscribe from a previously subscribed topic.
   * WebSocket connection will close on last unsubscribe.
   * @param topic topic to unsubscribe from
   */
  unsubscribe(topic: string) {
    // TODO: Emit all buffered messages before unsubscribe.
    if (this.subscriptions[topic]) {
      this.subscriptions[topic].unsubscribe();
      delete this.subscriptions[topic];
    }
  }

  /**
   * Unsubscribe from all previously subscribed topics.
   */
  unsubscriberAll() {
    Object.keys(this.subscriptions).forEach((topic) => this.unsubscribe(topic));
  }

  /**
   * Select incoming messages by topic and optionally decode the content.
   * @param topic to filter incoming messages by
   * @param decode to MotionMasterMessage or leave the content as Uint8Array
   * @returns an observable of topic and depending on the value of decode argument: MotionMasterMessage when true, Uint8Array otherwise
   */
  selectByTopic<T extends boolean>(topic: string, decode: T): T extends true
    ? Observable<MotionMasterMessage>
    : Observable<Uint8Array> {
    return this.buffer$.pipe(
      filter((data) => data[0] === topic),
      map((data) => decode
        ? MotionMasterMessage.decode(new Uint8Array(data[1] as ArrayBuffer))
        : new Uint8Array(data[1] as ArrayBuffer),
      ),
    ) as any;
  }

}
