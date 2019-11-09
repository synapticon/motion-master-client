import { Observable, Subject } from 'rxjs';
import { filter, map, pluck } from 'rxjs/operators';

import { IMotionMasterMessage, MotionMasterMessage } from './util';

export class MotionMasterNotification {

  readonly input$ = new Subject<{ topic: string, message: IMotionMasterMessage }>();

  message$ = this.input$.pipe(
    filter(({ topic }) => topic === 'notification'),
    pluck('message'),
  );

  systemEvent$ = this.message$.pipe(
    pluck('status'),
    map((status) => status ? status.systemEvent : null),
  ) as Observable<MotionMasterMessage.Status.ISystemEvent>;

  deviceEvent$ = this.message$.pipe(
    pluck('status'),
    map((status) => status ? status.deviceEvent : null),
  ) as Observable<MotionMasterMessage.Status.IDeviceEvent>;

  monitoring$ = this.input$.pipe(
    filter(({ topic }) => topic !== 'notification'),
  );

  selectByTopic(selectTopic: string) {
    return this.input$.pipe(
      filter(({ topic }) => topic === selectTopic),
      map(({ message }) => message),
    );
  }

}
