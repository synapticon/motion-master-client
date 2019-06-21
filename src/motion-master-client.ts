import { motionmaster } from 'motion-master-proto';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

export class MotionMasterClient {

  motionMasterMessage$: Observable<motionmaster.MotionMasterMessage>;
  status$: Observable<motionmaster.MotionMasterMessage.Status>;
  systemVersion$: Observable<motionmaster.MotionMasterMessage.Status.SystemVersion>;

  constructor(
    private input: Subject<Buffer>,
    private output: Subject<Buffer>,
  ) {
    this.motionMasterMessage$ = this.input.pipe(
      map((buffer: Buffer) => motionmaster.MotionMasterMessage.decode(new Uint8Array(buffer))),
    );
    this.status$ = this.motionMasterMessage$.pipe(map((message) => message.status)) as Observable<motionmaster.MotionMasterMessage.Status>;
    this.systemVersion$ = this.status$.pipe(map((status) => status.systemVersion)) as Observable<motionmaster.MotionMasterMessage.Status.SystemVersion>;
  }

  requestGetSystemVersion(messageId?: string) {
    const getSystemVersion = motionmaster.MotionMasterMessage.Request.GetSystemVersion.create();
    const request: motionmaster.MotionMasterMessage.IRequest = { getSystemVersion };
    const message = this.encodeAsMotionMasterMessage(request, messageId);
    this.output.next(message);
  }

  private encodeAsMotionMasterMessage(request: motionmaster.MotionMasterMessage.IRequest, id?: string): Buffer {
    const message = motionmaster.MotionMasterMessage.create({ id, request });
    return motionmaster.MotionMasterMessage.encode(message).finish() as Buffer;
  }

}
