import { motionmaster } from 'motion-master-proto';
import { Observable, Subject } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { v4 } from 'uuid';

export function encodeRequest(request: motionmaster.MotionMasterMessage.IRequest, id?: string): Buffer {
  if (!id) {
    id = v4();
  }
  const message = motionmaster.MotionMasterMessage.create({ id, request });
  return motionmaster.MotionMasterMessage.encode(message).finish() as Buffer;
}

export function decodeMotionMasterMessage(buffer: Buffer): motionmaster.MotionMasterMessage {
  return motionmaster.MotionMasterMessage.decode(new Uint8Array(buffer));
}

export interface INotification {
  topic: string;
  message: motionmaster.IMotionMasterMessage;
}

export class MotionMasterClient {

  motionMasterMessage$: Observable<motionmaster.MotionMasterMessage>;
  notification$: Observable<INotification>;
  status$: Observable<motionmaster.MotionMasterMessage.Status>;
  systemVersion$: Observable<motionmaster.MotionMasterMessage.Status.SystemVersion>;
  deviceInfo$: Observable<motionmaster.MotionMasterMessage.Status.DeviceInfo>;
  deviceParameterInfo$: Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterInfo>;
  deviceParameterValues$: Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterValues>;

  constructor(
    private input: Subject<Buffer>,
    private output: Subject<Buffer>,
    private notification: Subject<[Buffer, Buffer]>,
  ) {
    this.motionMasterMessage$ = this.input.pipe(
      map(decodeMotionMasterMessage),
    );

    this.notification$ = this.notification.pipe(
      map((notif) => {
        const topic = notif[0].toString('utf8');
        const message = decodeMotionMasterMessage(notif[1]);
        return { topic, message };
      }),
    );

    this.status$ = this.motionMasterMessage$.pipe(
      map((message) => message.status),
    ) as Observable<motionmaster.MotionMasterMessage.Status>;

    this.systemVersion$ = this.status$.pipe(
      filter((status) => !!status.systemVersion),
      map((status) => status.systemVersion),
    ) as Observable<motionmaster.MotionMasterMessage.Status.SystemVersion>;

    this.deviceInfo$ = this.status$.pipe(
      filter((status) => !!status.deviceInfo),
      map((status) => status.deviceInfo),
    ) as Observable<motionmaster.MotionMasterMessage.Status.DeviceInfo>;

    this.deviceParameterInfo$ = this.status$.pipe(
      filter((status) => !!status.deviceParameterInfo),
      map((status) => status.deviceParameterInfo),
    ) as Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterInfo>;

    this.deviceParameterValues$ = this.status$.pipe(
      filter((status) => !!status.deviceParameterValues),
      map((status) => status.deviceParameterValues),
    ) as Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterValues>;
  }

  sendRequest(request: motionmaster.MotionMasterMessage.IRequest, messageId?: string) {
    const message = encodeRequest(request, messageId);
    this.output.next(message);
  }

  getDeviceAtPosition$(position: number) {
    const messageId = v4();
    const observable = this.motionMasterMessage$.pipe(
      filter((message) => message.id === messageId),
      first(),
      map((message) => message.status),
      map((status) => {
        if (status) {
          const deviceInfo = status.deviceInfo;
          if (deviceInfo && deviceInfo.devices) {
            return deviceInfo.devices[position];
          }
        }
        return null;
      }),
    );
    const getDeviceInfo = {};
    this.sendRequest({ getDeviceInfo }, messageId);
    return observable;
  }

  filterNotificationByTopic$(topic: string): Observable<INotification> {
    return this.notification.pipe(
      filter((notif) => notif[0].toString('utf8') === topic),
      map((notif) => ({ topic, message: decodeMotionMasterMessage(notif[1]) })),
    );
  }

}
