import { Observable, Subject } from 'rxjs';
import { filter, map, pluck } from 'rxjs/operators';

import { IMotionMasterMessage, MotionMasterMessage } from './util';

export class MotionMasterNotification {

  readonly input$ = new Subject<{ topic: string, message: IMotionMasterMessage }>();

  /**
   * Notification messages are system and device events.
   */
  notification$ = this.selectByTopic('notification');

  /**
   * An observable of system event status messages.
   * Motion Master goes through several states until it gets to initialized.
   */
  systemEvent$ = this.notification$.pipe(
    pluck('status'),
    map((status) => status ? status.systemEvent : null),
  ) as Observable<MotionMasterMessage.Status.ISystemEvent>;

  /**
   * An observable of device event status messages.
   */
  deviceEvent$ = this.notification$.pipe(
    pluck('status'),
    map((status) => status ? status.deviceEvent : null),
  ) as Observable<MotionMasterMessage.Status.IDeviceEvent>;

  /**
   * Select messages by topic.
   * @param t topic to filter by
   * @returns an observable of messages
   */
  selectByTopic(t: string) {
    return this.input$.pipe(
      filter(({ topic }) => topic === t),
      pluck('message'),
    );
  }

}
