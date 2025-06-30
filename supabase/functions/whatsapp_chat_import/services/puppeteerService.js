"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.createImportSession = createImportSession;
exports.processImportProgress = processImportProgress;
exports.getImportSessionStatus = getImportSessionStatus;
exports.deleteImportSession = deleteImportSession;
exports.sendCompletionNotification = sendCompletionNotification;
// Configurações da VPS Puppeteer
var VPS_PUPPETEER_CONFIG = {
    baseUrl: Deno.env.get('PUPPETEER_VPS_URL') || 'http://31.97.163.57:3001',
    token: Deno.env.get('VPS_PUPPETEER_IMPORT') || '8bb0c4f8a89d254783d693050ecd7ff4878534f46a87ece12b24f506548ce430',
    webhookUrl: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_chat_import'
};
// 🎭 Criar sessão de importação na VPS Puppeteer
function createImportSession(instanceId, instanceName) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    console.log("[Puppeteer Service] \uD83D\uDE80 Creating session for instance: ".concat(instanceId));
                    return [4 /*yield*/, fetch("".concat(VPS_PUPPETEER_CONFIG.baseUrl, "/start-import"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(VPS_PUPPETEER_CONFIG.token)
                            },
                            body: JSON.stringify({
                                instanceId: instanceId,
                                instanceName: instanceName,
                                webhookUrl: VPS_PUPPETEER_CONFIG.webhookUrl
                            })
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    console.log("[Puppeteer Service] \u2705 Session response:", data);
                    return [2 /*return*/, {
                            success: true,
                            sessionId: data.sessionId,
                            qrCode: data.qrCode,
                            status: data.status || 'waiting_qr'
                        }];
                case 3:
                    error_1 = _a.sent();
                    console.error("[Puppeteer Service] \u274C Error creating session:", error_1);
                    return [2 /*return*/, {
                            success: false,
                            error: error_1.message
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// 📊 Processar progresso da importação (chamado pelo webhook)
function processImportProgress(supabase_1, instance_1, contacts_1, messages_1) {
    return __awaiter(this, arguments, void 0, function (supabase, instance, contacts, messages, source) {
        var contactsImported, messagesImported, _i, contacts_2, contact, contactData, contactError, error_2, _a, messages_2, message, messageData, messageError, error_3, error_4;
        if (source === void 0) { source = 'puppeteer'; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 13, , 14]);
                    console.log("[Puppeteer Service] \uD83D\uDCE5 Processing batch: ".concat(contacts.length, " contacts, ").concat(messages.length, " messages"));
                    contactsImported = 0;
                    messagesImported = 0;
                    if (!(contacts.length > 0)) return [3 /*break*/, 6];
                    _i = 0, contacts_2 = contacts;
                    _b.label = 1;
                case 1:
                    if (!(_i < contacts_2.length)) return [3 /*break*/, 6];
                    contact = contacts_2[_i];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    contactData = {
                        external_id: contact.id || contact.number,
                        name: contact.name || contact.pushname || contact.number,
                        phone: contact.number,
                        instance_id: instance.id,
                        created_by_user_id: instance.created_by_user_id,
                        import_source: source,
                        import_date: new Date().toISOString(),
                        raw_data: contact
                    };
                    return [4 /*yield*/, supabase
                            .from('whatsapp_contacts')
                            .upsert(contactData, {
                            onConflict: 'external_id,instance_id'
                        })];
                case 3:
                    contactError = (_b.sent()).error;
                    if (!contactError) {
                        contactsImported++;
                    }
                    else {
                        console.error("[Puppeteer Service] \u274C Contact error:", contactError);
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _b.sent();
                    console.error("[Puppeteer Service] \u274C Contact processing error:", error_2);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    if (!(messages.length > 0)) return [3 /*break*/, 12];
                    _a = 0, messages_2 = messages;
                    _b.label = 7;
                case 7:
                    if (!(_a < messages_2.length)) return [3 /*break*/, 12];
                    message = messages_2[_a];
                    _b.label = 8;
                case 8:
                    _b.trys.push([8, 10, , 11]);
                    messageData = {
                        external_id: message.id || "".concat(message.from, "_").concat(message.timestamp),
                        content: message.body || message.text || '',
                        sender_number: message.from,
                        recipient_number: message.to,
                        message_type: message.type || 'text',
                        timestamp: new Date(message.timestamp * 1000).toISOString(),
                        instance_id: instance.id,
                        created_by_user_id: instance.created_by_user_id,
                        import_source: source,
                        import_date: new Date().toISOString(),
                        raw_data: message
                    };
                    return [4 /*yield*/, supabase
                            .from('whatsapp_messages')
                            .upsert(messageData, {
                            onConflict: 'external_id,instance_id'
                        })];
                case 9:
                    messageError = (_b.sent()).error;
                    if (!messageError) {
                        messagesImported++;
                    }
                    else {
                        console.error("[Puppeteer Service] \u274C Message error:", messageError);
                    }
                    return [3 /*break*/, 11];
                case 10:
                    error_3 = _b.sent();
                    console.error("[Puppeteer Service] \u274C Message processing error:", error_3);
                    return [3 /*break*/, 11];
                case 11:
                    _a++;
                    return [3 /*break*/, 7];
                case 12:
                    console.log("[Puppeteer Service] \u2705 Imported: ".concat(contactsImported, " contacts, ").concat(messagesImported, " messages"));
                    return [2 /*return*/, {
                            success: true,
                            contactsImported: contactsImported,
                            messagesImported: messagesImported
                        }];
                case 13:
                    error_4 = _b.sent();
                    console.error("[Puppeteer Service] \u274C Processing error:", error_4);
                    return [2 /*return*/, {
                            success: false,
                            error: error_4.message,
                            contactsImported: 0,
                            messagesImported: 0
                        }];
                case 14: return [2 /*return*/];
            }
        });
    });
}
// 🔄 Obter status da sessão na VPS
function getImportSessionStatus(sessionId) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    console.log("[Puppeteer Service] \uD83D\uDCCA Getting status for session: ".concat(sessionId));
                    return [4 /*yield*/, fetch("".concat(VPS_PUPPETEER_CONFIG.baseUrl, "/session-status/").concat(sessionId), {
                            method: 'GET',
                            headers: {
                                'Authorization': "Bearer ".concat(VPS_PUPPETEER_CONFIG.token)
                            }
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    console.log("[Puppeteer Service] \u2705 Status response:", data);
                    return [2 /*return*/, __assign({ success: true }, data)];
                case 3:
                    error_5 = _a.sent();
                    console.error("[Puppeteer Service] \u274C Error getting status:", error_5);
                    return [2 /*return*/, {
                            success: false,
                            error: error_5.message
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// 🗑️ Deletar sessão na VPS (cleanup)
function deleteImportSession(sessionId) {
    return __awaiter(this, void 0, void 0, function () {
        var puppeteerVpsUrl, puppeteerToken, response, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    puppeteerVpsUrl = Deno.env.get('PUPPETEER_VPS_URL') || 'http://31.97.163.57:3001';
                    puppeteerToken = Deno.env.get('VPS_PUPPETEER_IMPORT') || 'default-token';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(puppeteerVpsUrl, "/delete-session/").concat(sessionId), {
                            method: 'DELETE',
                            headers: {
                                'Authorization': "Bearer ".concat(puppeteerToken)
                            }
                        })];
                case 2:
                    response = _a.sent();
                    return [2 /*return*/, response.ok];
                case 3:
                    error_6 = _a.sent();
                    console.error("[Puppeteer Service] \u274C Error deleting session:", error_6);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// 🔔 Enviar notificação de conclusão (webhook interno)
function sendCompletionNotification(supabase, sessionData) {
    return __awaiter(this, void 0, void 0, function () {
        var session, instanceName, userId, phoneNumber, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, supabase
                            .from('whatsapp_import_sessions')
                            .select("\n        *,\n        whatsapp_instances (\n          instance_name,\n          vps_instance_id,\n          created_by_user_id\n        )\n      ")
                            .eq('id', sessionData.sessionId)
                            .single()];
                case 1:
                    session = (_a.sent()).data;
                    if (!session || !session.whatsapp_instances) {
                        console.error('[Puppeteer Service] ❌ Session or instance not found');
                        return [2 /*return*/, false];
                    }
                    instanceName = session.whatsapp_instances.instance_name;
                    userId = session.whatsapp_instances.created_by_user_id;
                    phoneNumber = session.whatsapp_instances.vps_instance_id || 'N/A';
                    // Criar notificação no banco para o usuário
                    return [4 /*yield*/, supabase
                            .from('notifications')
                            .insert({
                            user_id: userId,
                            type: 'import_completed',
                            title: "Importa\u00E7\u00E3o Conclu\u00EDda - ".concat(instanceName),
                            message: "A importa\u00E7\u00E3o do hist\u00F3rico do n\u00FAmero ".concat(phoneNumber, " foi conclu\u00EDda com sucesso! ").concat(session.total_contacts || 0, " contatos e ").concat(session.total_messages || 0, " mensagens foram importados."),
                            data: {
                                sessionId: session.id,
                                instanceId: session.instance_id,
                                instanceName: instanceName,
                                phoneNumber: phoneNumber,
                                totalContacts: session.total_contacts || 0,
                                totalMessages: session.total_messages || 0,
                                importSource: 'puppeteer'
                            },
                            read: false,
                            created_at: new Date().toISOString()
                        })];
                case 2:
                    // Criar notificação no banco para o usuário
                    _a.sent();
                    console.log("[Puppeteer Service] \uD83D\uDD14 Notification sent to user: ".concat(userId));
                    // Opcional: Enviar notificação em tempo real via WebSocket/Realtime
                    // supabase.channel('notifications').send({ ... })
                    return [2 /*return*/, true];
                case 3:
                    error_7 = _a.sent();
                    console.error("[Puppeteer Service] \u274C Error sending notification:", error_7);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
