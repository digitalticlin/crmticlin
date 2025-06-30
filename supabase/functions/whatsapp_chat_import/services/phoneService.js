"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanPhoneNumber = cleanPhoneNumber;
function cleanPhoneNumber(phone) {
    return phone.replace(/\D/g, '');
}
