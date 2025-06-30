"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processContacts = processContacts;
var phoneService_ts_1 = require("./phoneService.ts");
function processContacts(supabase, contacts, instance) {
    return __awaiter(this, void 0, void 0, function () {
        var contactsImported, _i, contacts_1, contact, cleanPhone, existingLead, error, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    contactsImported = 0;
                    if (!contacts || !Array.isArray(contacts)) {
                        console.log("[Contact Service] \u2139\uFE0F No contacts to process");
                        return [2 /*return*/, contactsImported];
                    }
                    console.log("[Contact Service] \uD83D\uDC65 Processing ".concat(contacts.length, " contacts"));
                    _i = 0, contacts_1 = contacts;
                    _a.label = 1;
                case 1:
                    if (!(_i < contacts_1.length)) return [3 /*break*/, 9];
                    contact = contacts_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 7, , 8]);
                    cleanPhone = (0, phoneService_ts_1.cleanPhoneNumber)(contact.id || contact.phone || '');
                    if (!cleanPhone) {
                        console.warn("[Contact Service] \u26A0\uFE0F Contact without valid phone:", contact);
                        return [3 /*break*/, 8];
                    }
                    return [4 /*yield*/, supabase
                            .from('leads')
                            .select('id')
                            .eq('phone', cleanPhone)
                            .eq('whatsapp_number_id', instance.id)
                            .single()];
                case 3:
                    existingLead = (_a.sent()).data;
                    if (!!existingLead) return [3 /*break*/, 5];
                    return [4 /*yield*/, supabase
                            .from('leads')
                            .insert({
                            phone: cleanPhone,
                            name: contact.name || contact.pushname || "Contact-".concat(cleanPhone.substring(cleanPhone.length - 4)),
                            whatsapp_number_id: instance.id,
                            created_by_user_id: instance.created_by_user_id, // 🔥 CRÍTICO: Vincular ao criador da instância
                            last_message: 'Imported contact',
                            last_message_time: new Date().toISOString(),
                            created_at: new Date().toISOString()
                        })];
                case 4:
                    error = (_a.sent()).error;
                    if (!error) {
                        contactsImported++;
                        console.log("[Contact Service] \u2705 Contact saved: ".concat(cleanPhone));
                    }
                    else {
                        console.error("[Contact Service] \u274C Error saving contact ".concat(cleanPhone, ":"), error);
                    }
                    return [3 /*break*/, 6];
                case 5:
                    console.log("[Contact Service] \u2139\uFE0F Contact already exists: ".concat(cleanPhone));
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    console.warn("[Contact Service] \u26A0\uFE0F Error processing contact:", error_1.message);
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 1];
                case 9: return [2 /*return*/, contactsImported];
            }
        });
    });
}
