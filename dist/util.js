"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeMotionMasterMessage = exports.encodeMotionMasterMessage = exports.MotionMasterMessage = void 0;
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
//# sourceMappingURL=util.js.map