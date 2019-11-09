import { motionmaster } from '@synapticon/motion-master-proto';

export import MotionMasterMessage = motionmaster.MotionMasterMessage;
export import IMotionMasterMessage = motionmaster.IMotionMasterMessage;

/**
 * Encode MotionMasterMessage to typed array.
 * @param message an instance of MotionMasterMessage.
 * @returns Uint8Array
 */
export function encodeMotionMasterMessage(message: IMotionMasterMessage) {
  return MotionMasterMessage.encode(message).finish();
}

/**
 * Decode MotionMasterMessage from typed array.
 * @param data Uint8Array to decode
 * @returns MotionMasterMessage
 */
export function decodeMotionMasterMessage(data: Uint8Array) {
  return MotionMasterMessage.decode(data);
}
