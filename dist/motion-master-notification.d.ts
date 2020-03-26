import { Subject } from 'rxjs';
import { MotionMasterMessage } from './util';
export declare class MotionMasterNotification {
    /**
     * Buffered messages by topic.
     */
    readonly input$: Subject<{
        topic: string;
        messages: MotionMasterMessage[];
    }>;
    /**
     * Notification messages are system and device events.
     */
    readonly notification$: import("rxjs").Observable<MotionMasterMessage>;
    /**
     * An observable of system event status messages.
     * Motion Master goes through several states until it gets to initialized.
     */
    readonly systemEvent$: import("rxjs").Observable<MotionMasterMessage.Status.ISystemEvent>;
    /**
     * An observable of device event status messages.
     */
    readonly deviceEvent$: import("rxjs").Observable<MotionMasterMessage.Status.IDeviceEvent>;
    /**
     * Select messages by topic.
     * @param t topic to filter by
     * @returns an observable of messages
     */
    selectMessagesByTopic(t: string): import("rxjs").Observable<MotionMasterMessage[]>;
}
//# sourceMappingURL=motion-master-notification.d.ts.map