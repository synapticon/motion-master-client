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
//# sourceMappingURL=util.d.ts.map