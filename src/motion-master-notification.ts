import { from, Observable, Subject } from 'rxjs';
import { filter, pluck, switchMap } from 'rxjs/operators';

import { IMotionMasterMessage } from './util';

export class MotionMasterNotification {

  /**
   * Buffered messages by topic.
   */
  readonly input$ = new Subject<{ topic: string, messages: IMotionMasterMessage[] }>();

  /**
   * Notification messages are system and device events.
   */
  readonly notification$: Observable<IMotionMasterMessage> = this.selectMessagesByTopic('notification').pipe(
    switchMap((messages) => from(messages)),
  );

  /**
   * An observable of system event status messages.
   * Motion Master goes through several states until it gets to initialized.
   */
  readonly systemEvent$: Observable<IMotionMasterMessage> = this.notification$.pipe(
    filter((message) => (message.status && 'systemEvent' in message.status) === true),
  );

  /**
   * An observable of device event status messages.
   */
  readonly deviceEvent$: Observable<IMotionMasterMessage> = this.notification$.pipe(
    filter((message) => (message.status && 'deviceEvent' in message.status) === true),
  );

  /**
   * Select messages by topic.
   * @param t topic to filter by
   * @returns an observable of messages
   */
  selectMessagesByTopic(t: string) {
    return this.input$.pipe(
      filter(({ topic }) => topic === t),
      pluck('messages'),
    );
  }

}
