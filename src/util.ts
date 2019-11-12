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
  // tslint:disable: no-non-null-assertion
  const xValues = x.status!.monitoringParameterValues!.deviceParameterValues!.parameterValues;
  const yValues = y.status!.monitoringParameterValues!.deviceParameterValues!.parameterValues;
  for (let i = 0; i < xValues!.length; i++) {
    if ((xValues![i].intValue !== yValues![i].intValue)
      || (xValues![i].uintValue !== yValues![i].uintValue)
      || (xValues![i].floatValue !== yValues![i].floatValue)
      || (xValues![i].stringValue !== yValues![i].stringValue)
    ) {
      return false;
    }
  }
  return true;
  // tslint:enable: no-non-null-assertion
}
