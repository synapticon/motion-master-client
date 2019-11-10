import { Observable, Subject } from 'rxjs';
import { IMotionMasterMessage, MotionMasterMessage } from './util';
export declare class MotionMasterNotification {
    readonly input$: Subject<{
        topic: string;
        message: IMotionMasterMessage;
    }>;
    /**
     * Notification messages are system and device events.
     */
    notification$: Observable<IMotionMasterMessage>;
    /**
     * An observable of system event status messages.
     * Motion Master goes through several states until it gets to initialized.
     */
    systemEvent$: Observable<MotionMasterMessage.Status.ISystemEvent>;
    /**
     * An observable of device event status messages.
     */
    deviceEvent$: Observable<MotionMasterMessage.Status.IDeviceEvent>;
    /**
     * Select messages by topic.
     * @param t topic to filter by
     * @returns an observable of messages
     */
    selectByTopic(t: string): Observable<IMotionMasterMessage>;
}
//# sourceMappingURL=motion-master-notification.d.ts.map