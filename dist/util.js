"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var motion_master_proto_1 = require("@synapticon/motion-master-proto");
exports.MotionMasterMessage = motion_master_proto_1.motionmaster.MotionMasterMessage;
/**
 * Encode MotionMasterMessage to typed array.
 * @param message an instance of MotionMasterMessage.
 * @returns Uint8Array
 */
function encodeMotionMasterMessage(message) {
    return exports.MotionMasterMessage.encode(message).finish();
}
exports.encodeMotionMasterMessage = encodeMotionMasterMessage;
/**
 * Decode MotionMasterMessage from typed array.
 * @param data Uint8Array to decode
 * @returns MotionMasterMessage
 */
function decodeMotionMasterMessage(data) {
    return exports.MotionMasterMessage.decode(data);
}
exports.decodeMotionMasterMessage = decodeMotionMasterMessage;
/**
 * @todo handle all type values (rawValue for example) and enable no-non-null-assertion rule.
 * @param x MotionMasterMessage
 * @param y MotionMasterMessage
 */
function compareParameterValues(x, y) {
    // tslint:disable: no-non-null-assertion
    var xValues = x.status.monitoringParameterValues.deviceParameterValues.parameterValues;
    var yValues = y.status.monitoringParameterValues.deviceParameterValues.parameterValues;
    for (var i = 0; i < xValues.length; i++) {
        if ((xValues[i].intValue !== yValues[i].intValue)
            || (xValues[i].uintValue !== yValues[i].uintValue)
            || (xValues[i].floatValue !== yValues[i].floatValue)
            || (xValues[i].stringValue !== yValues[i].stringValue)) {
            return false;
        }
    }
    return true;
    // tslint:enable: no-non-null-assertion
}
exports.compareParameterValues = compareParameterValues;
//# sourceMappingURL=util.js.map