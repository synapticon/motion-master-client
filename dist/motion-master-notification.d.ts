import { Observable, Subject } from 'rxjs';
import { IMotionMasterMessage, MotionMasterMessage } from './util';
export declare class MotionMasterNotification {
    readonly input$: Subject<{
        topic: string;
        message: IMotionMasterMessage;
    }>;
    message$: Observable<IMotionMasterMessage>;
    systemEvent$: Observable<MotionMasterMessage.Status.ISystemEvent>;
    deviceEvent$: Observable<MotionMasterMessage.Status.IDeviceEvent>;
    monitoring$: Observable<{
        topic: string;
        message: IMotionMasterMessage;
    }>;
    selectByTopic(selectTopic: string): Observable<IMotionMasterMessage>;
}
//# sourceMappingURL=motion-master-notification.d.ts.map