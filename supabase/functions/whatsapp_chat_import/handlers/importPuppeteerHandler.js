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
exports.handleImportPuppeteer = handleImportPuppeteer;
var puppeteerService_ts_1 = require("../services/puppeteerService.ts");
function handleImportPuppeteer(supabase, user, body) {
    return __awaiter(this, void 0, void 0, function () {
        var action, instanceId, _a, instance, instanceError, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    action = body.action, instanceId = body.instanceId;
                    console.log("[Puppeteer Handler] \uD83C\uDFAD Action: ".concat(action, " for instance: ").concat(instanceId));
                    if (!(action === 'webhook_progress')) return [3 /*break*/, 2];
                    return [4 /*yield*/, handleWebhookProgress(supabase, body)];
                case 1: return [2 /*return*/, _c.sent()];
                case 2:
                    if (!(instanceId && user && action !== 'import_via_puppeteer')) return [3 /*break*/, 4];
                    return [4 /*yield*/, supabase
                            .from('whatsapp_instances')
                            .select('*')
                            .eq('id', instanceId)
                            .eq('created_by_user_id', user.id)
                            .single()];
                case 3:
                    _a = _c.sent(), instance = _a.data, instanceError = _a.error;
                    if (instanceError || !instance) {
                        return [2 /*return*/, {
                                success: false,
                                error: 'Instance not found or access denied',
                                status: 404
                            }];
                    }
                    _c.label = 4;
                case 4:
                    _b = action;
                    switch (_b) {
                        case 'import_via_puppeteer': return [3 /*break*/, 5];
                        case 'webhook_progress': return [3 /*break*/, 7];
                        case 'get_status': return [3 /*break*/, 9];
                    }
                    return [3 /*break*/, 11];
                case 5: return [4 /*yield*/, handleCreateSession(supabase, user, body)];
                case 6: return [2 /*return*/, _c.sent()];
                case 7: return [4 /*yield*/, handleWebhookProgress(supabase, body)];
                case 8: return [2 /*return*/, _c.sent()];
                case 9: return [4 /*yield*/, handleGetStatus(supabase, body)];
                case 10: return [2 /*return*/, _c.sent()];
                case 11: return [2 /*return*/, {
                        success: false,
                        error: "Unknown action: ".concat(action),
                        status: 400
                    }];
            }
        });
    });
}
// 🆕 Criar sessão de importação + QR Code
function handleCreateSession(supabase, user, body) {
    return __awaiter(this, void 0, void 0, function () {
        var instanceId, userValidation, instanceName, sessionResult, _a, newSession, insertError, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    instanceId = body.instanceId, userValidation = body.userValidation;
                    console.log("[Puppeteer Handler] \uD83D\uDE80 Creating import session for: ".concat(instanceId));
                    instanceName = (userValidation === null || userValidation === void 0 ? void 0 : userValidation.instanceName) || "import_".concat(instanceId);
                    console.log("[Puppeteer Handler] \uD83D\uDCF1 Instance data:", { instanceId: instanceId, instanceName: instanceName });
                    return [4 /*yield*/, (0, puppeteerService_ts_1.createImportSession)(instanceId, instanceName)];
                case 1:
                    sessionResult = _b.sent();
                    if (!sessionResult.success) return [3 /*break*/, 3];
                    return [4 /*yield*/, supabase
                            .from('instances_puppeteer')
                            .insert({
                            instance_id: instanceId,
                            user_id: user.id,
                            session_id: sessionResult.sessionId,
                            qr_code: sessionResult.qrCode,
                            status: 'waiting_qr'
                        })
                            .select()
                            .single()];
                case 2:
                    _a = _b.sent(), newSession = _a.data, insertError = _a.error;
                    if (insertError) {
                        console.error("[Puppeteer Handler] \u274C Error saving session:", insertError);
                        throw new Error('Failed to save session');
                    }
                    console.log("[Puppeteer Handler] \u2705 Session created: ".concat(sessionResult.sessionId));
                    return [2 /*return*/, {
                            success: true,
                            sessionId: sessionResult.sessionId,
                            qrCode: sessionResult.qrCode,
                            status: 'waiting_qr',
                            message: 'QR Code gerado. Escaneie para iniciar importação.'
                        }];
                case 3: throw new Error(sessionResult.error || 'Failed to create session');
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_1 = _b.sent();
                    console.error("[Puppeteer Handler] \u274C Error creating session:", error_1);
                    return [2 /*return*/, {
                            success: false,
                            error: error_1.message,
                            status: 500
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// 🆕 Receber webhook de progresso da VPS
function handleWebhookProgress(supabase, body) {
    return __awaiter(this, void 0, void 0, function () {
        var sessionId, _a, progress, status_1, _b, contacts, _c, messages, error, totalContacts, totalMessages, updateData, session, result, session, error_2;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 9, , 10]);
                    console.log('[Webhook DEBUG] Body recebido:', JSON.stringify(body));
                    sessionId = body.sessionId, _a = body.progress, progress = _a === void 0 ? 0 : _a, status_1 = body.status, _b = body.contacts, contacts = _b === void 0 ? [] : _b, _c = body.messages, messages = _c === void 0 ? [] : _c, error = body.error, totalContacts = body.totalContacts, totalMessages = body.totalMessages;
                    console.log("[Puppeteer Handler] \uD83D\uDCCA Progress webhook: ".concat(sessionId, " - ").concat(progress, "% - ").concat(status_1));
                    updateData = {
                        status: status_1,
                        progress: progress,
                        total_contacts: totalContacts,
                        total_messages: totalMessages,
                        error_message: error
                    };
                    // Se há QR Code na requisição, atualizar também
                    if (body.qrCode) {
                        updateData.qr_code = body.qrCode;
                        console.log("[Puppeteer Handler] \uD83D\uDCF1 QR Code recebido via webhook: ".concat(body.qrCode.length, " chars"));
                    }
                    return [4 /*yield*/, supabase
                            .from('instances_puppeteer')
                            .update(updateData)
                            .eq('session_id', sessionId)];
                case 1:
                    _d.sent();
                    if (!(contacts.length > 0 || messages.length > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, supabase
                            .from('instances_puppeteer')
                            .select("\n          instance_id,\n          whatsapp_instances (*)\n        ")
                            .eq('session_id', sessionId)
                            .single()];
                case 2:
                    session = (_d.sent()).data;
                    if (!(session === null || session === void 0 ? void 0 : session.whatsapp_instances)) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, puppeteerService_ts_1.processImportProgress)(supabase, session.whatsapp_instances, contacts, messages, 'puppeteer')];
                case 3:
                    result = _d.sent();
                    console.log("[Puppeteer Handler] \uD83D\uDCE5 Batch processed: ".concat(result.contactsImported, " contacts, ").concat(result.messagesImported, " messages"));
                    _d.label = 4;
                case 4:
                    if (!(status_1 === 'completed')) return [3 /*break*/, 8];
                    return [4 /*yield*/, supabase
                            .from('instances_puppeteer')
                            .select('instance_id')
                            .eq('session_id', sessionId)
                            .single()];
                case 5:
                    session = (_d.sent()).data;
                    if (!session) return [3 /*break*/, 8];
                    // Marcar instância como histórico importado
                    return [4 /*yield*/, supabase
                            .from('whatsapp_instances')
                            .update({
                            history_imported: true,
                            last_sync_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                            .eq('id', session.instance_id)];
                case 6:
                    // Marcar instância como histórico importado
                    _d.sent();
                    // Marcar sessão como completada
                    return [4 /*yield*/, supabase
                            .from('instances_puppeteer')
                            .update({
                            completed_at: new Date().toISOString()
                        })
                            .eq('session_id', sessionId)];
                case 7:
                    // Marcar sessão como completada
                    _d.sent();
                    console.log("[Puppeteer Handler] \uD83C\uDF89 Import completed for session: ".concat(sessionId));
                    _d.label = 8;
                case 8: return [2 /*return*/, {
                        success: true,
                        message: 'Progress updated',
                        status: 200
                    }];
                case 9:
                    error_2 = _d.sent();
                    console.error('[Webhook DEBUG] Erro global:', error_2);
                    return [2 /*return*/, {
                            success: false,
                            error: error_2.message,
                            status: 500
                        }];
                case 10: return [2 /*return*/];
            }
        });
    });
}
// 🆕 Obter status da sessão
function handleGetStatus(supabase, body) {
    return __awaiter(this, void 0, void 0, function () {
        var sessionId, _a, session, error, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    sessionId = body.sessionId;
                    return [4 /*yield*/, supabase
                            .from('whatsapp_import_sessions')
                            .select('*')
                            .eq('id', sessionId)
                            .single()];
                case 1:
                    _a = _b.sent(), session = _a.data, error = _a.error;
                    if (error || !session) {
                        return [2 /*return*/, {
                                success: false,
                                error: 'Session not found',
                                status: 404
                            }];
                    }
                    return [2 /*return*/, {
                            success: true,
                            session: {
                                id: session.id,
                                status: session.status,
                                progress: session.progress || 0,
                                qrCode: session.qr_code,
                                totalContacts: session.total_contacts,
                                totalMessages: session.total_messages,
                                errorMessage: session.error_message,
                                createdAt: session.created_at,
                                updatedAt: session.updated_at
                            },
                            status: 200
                        }];
                case 2:
                    error_3 = _b.sent();
                    console.error("[Puppeteer Handler] \u274C Error getting status:", error_3);
                    return [2 /*return*/, {
                            success: false,
                            error: error_3.message,
                            status: 500
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
