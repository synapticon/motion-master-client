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

/**
 * @todo handle all type values (rawValue for example) and enable no-non-null-assertion rule.
 * @param x MotionMasterMessage
 * @param y MotionMasterMessage
 */
export function compareParameterValues(x: MotionMasterMessage, y: MotionMasterMessage) {
  const xvals = x.status?.monitoringParameterValues?.deviceParameterValues?.parameterValues;
  const yvals = y.status?.monitoringParameterValues?.deviceParameterValues?.parameterValues;

  if (xvals && yvals) {
    for (let i = 0; i < xvals.length; i++) {
      if ((xvals[i].intValue !== yvals[i].intValue)
        || (xvals[i].uintValue !== yvals[i].uintValue)
        || (xvals[i].floatValue !== yvals[i].floatValue)
        || (xvals[i].stringValue !== yvals[i].stringValue)
      ) {
        return false;
      }
    }
  } else {
    throw new Error(`Device parameterValues are empty: ${x.status} ${y.status}`);
  }

  return true;
}
