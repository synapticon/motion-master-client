import { Observable, Subject } from 'rxjs';
import { IMotionMasterMessage } from './util';
export declare class MotionMasterNotification {
    /**
     * Buffered messages by topic.
     */
    readonly input$: Subject<{
        topic: string;
        messages: IMotionMasterMessage[];
    }>;
    /**
     * Notification messages are system and device events.
     */
    readonly notification$: Observable<IMotionMasterMessage>;
    /**
     * An observable of system event status messages.
     * Motion Master goes through several states until it gets to initialized.
     */
    readonly systemEvent$: Observable<IMotionMasterMessage>;
    /**
     * An observable of device event status messages.
     */
    readonly deviceEvent$: Observable<IMotionMasterMessage>;
    /**
     * Select messages by topic.
     * @param t topic to filter by
     * @returns an observable of messages
     */
    selectMessagesByTopic(t: string): Observable<IMotionMasterMessage[]>;
}
//# sourceMappingURL=motion-master-notification.d.ts.map