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
    var _a, _b, _c, _d, _e, _f;
    var xvals = (_c = (_b = (_a = x.status) === null || _a === void 0 ? void 0 : _a.monitoringParameterValues) === null || _b === void 0 ? void 0 : _b.deviceParameterValues) === null || _c === void 0 ? void 0 : _c.parameterValues;
    var yvals = (_f = (_e = (_d = y.status) === null || _d === void 0 ? void 0 : _d.monitoringParameterValues) === null || _e === void 0 ? void 0 : _e.deviceParameterValues) === null || _f === void 0 ? void 0 : _f.parameterValues;
    if (xvals && yvals) {
        for (var i = 0; i < xvals.length; i++) {
            if ((xvals[i].intValue !== yvals[i].intValue)
                || (xvals[i].uintValue !== yvals[i].uintValue)
                || (xvals[i].floatValue !== yvals[i].floatValue)
                || (xvals[i].stringValue !== yvals[i].stringValue)) {
                return false;
            }
        }
    }
    else {
        throw new Error("Device parameterValues are empty: " + x.status + " " + y.status);
    }
    return true;
}
exports.compareParameterValues = compareParameterValues;
//# sourceMappingURL=util.js.map