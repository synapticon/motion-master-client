import { from, Subject } from 'rxjs';
import { filter, map, pluck, switchMap } from 'rxjs/operators';

import { MotionMasterMessage } from './util';

export class MotionMasterNotification {

  /**
   * Buffered messages by topic.
   */
  readonly input$ = new Subject<{ topic: string, messages: MotionMasterMessage[] }>();

  /**
   * Notification messages are system and device events.
   */
  readonly notification$ = this.selectMessagesByTopic('notification').pipe(
    switchMap((messages) => from(messages)),
  );

  /**
   * An observable of system event status messages.
   * Motion Master goes through several states until it gets to initialized.
   */
  readonly systemEvent$ = this.notification$.pipe(
    filter((message) => (message.status && 'systemEvent' in message.status) === true),
    // tslint:disable-next-line: no-non-null-assertion
    map((message) => message.status!.systemEvent!),
  );

  /**
   * An observable of device event status messages.
   */
  readonly deviceEvent$ = this.notification$.pipe(
    filter((message) => (message.status && 'deviceEvent' in message.status) === true),
    // tslint:disable-next-line: no-non-null-assertion
    map((message) => message.status!.deviceEvent!),
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
