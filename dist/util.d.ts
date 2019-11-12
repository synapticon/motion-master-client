import { motionmaster } from '@synapticon/motion-master-proto';
export import MotionMasterMessage = motionmaster.MotionMasterMessage;
export import IMotionMasterMessage = motionmaster.IMotionMasterMessage;
/**
 * Encode MotionMasterMessage to typed array.
 * @param message an instance of MotionMasterMessage.
 * @returns Uint8Array
 */
export declare function encodeMotionMasterMessage(message: IMotionMasterMessage): Uint8Array;
/**
 * Decode MotionMasterMessage from typed array.
 * @param data Uint8Array to decode
 * @returns MotionMasterMessage
 */
export declare function decodeMotionMasterMessage(data: Uint8Array): motionmaster.MotionMasterMessage;
/**
 * @todo handle all type values (rawValue for example) and enable no-non-null-assertion rule.
 * @param x MotionMasterMessage
 * @param y MotionMasterMessage
 */
export declare function compareParameterValues(x: MotionMasterMessage, y: MotionMasterMessage): boolean;
//# sourceMappingURL=util.d.ts.map