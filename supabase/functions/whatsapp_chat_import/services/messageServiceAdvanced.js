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
exports.processMessagesWithDeduplication = processMessagesWithDeduplication;
var phoneService_ts_1 = require("./phoneService.ts");
// 🧠 Processar mensagens com detecção avançada de duplicados
function processMessagesWithDeduplication(supabase_1, messages_1, instance_1) {
    return __awaiter(this, arguments, void 0, function (supabase, messages, instance, source) {
        var messagesImported, duplicatesSkipped, batchSize, i, batch, _i, batch_1, message, rawPhone, cleanPhone, leadId, messageData, isDuplicate, error, error_1;
        var _a;
        if (source === void 0) { source = 'puppeteer'; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    messagesImported = 0;
                    duplicatesSkipped = 0;
                    if (!messages || !Array.isArray(messages)) {
                        console.log("[Message Service Advanced] \u2139\uFE0F No messages to process");
                        return [2 /*return*/, messagesImported];
                    }
                    console.log("[Message Service Advanced] \uD83D\uDCAC Processing ".concat(messages.length, " messages from ").concat(source));
                    batchSize = 20;
                    i = 0;
                    _b.label = 1;
                case 1:
                    if (!(i < messages.length)) return [3 /*break*/, 13];
                    batch = messages.slice(i, i + batchSize);
                    console.log("[Message Service Advanced] \uD83D\uDCE6 Processing batch ".concat(Math.floor(i / batchSize) + 1, "/").concat(Math.ceil(messages.length / batchSize)));
                    _i = 0, batch_1 = batch;
                    _b.label = 2;
                case 2:
                    if (!(_i < batch_1.length)) return [3 /*break*/, 10];
                    message = batch_1[_i];
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 8, , 9]);
                    rawPhone = message.from || message.remoteJid || message.chatId || '';
                    cleanPhone = (0, phoneService_ts_1.cleanPhoneNumber)(rawPhone);
                    if (!cleanPhone) {
                        console.warn("[Message Service Advanced] \u26A0\uFE0F Message without valid phone:", message);
                        return [3 /*break*/, 9];
                    }
                    return [4 /*yield*/, findOrCreateLead(supabase, cleanPhone, instance, source)];
                case 4:
                    leadId = _b.sent();
                    if (!leadId) {
                        console.warn("[Message Service Advanced] \u26A0\uFE0F Could not find/create lead for:", cleanPhone);
                        return [3 /*break*/, 9];
                    }
                    return [4 /*yield*/, prepareMessageData(message, leadId, instance, source)];
                case 5:
                    messageData = _b.sent();
                    return [4 /*yield*/, checkForDuplicates(supabase, messageData, leadId, instance.id)];
                case 6:
                    isDuplicate = _b.sent();
                    if (isDuplicate) {
                        duplicatesSkipped++;
                        console.log("[Message Service Advanced] \uD83D\uDD04 Duplicate skipped: ".concat(cleanPhone, " - ").concat((_a = messageData.text) === null || _a === void 0 ? void 0 : _a.substring(0, 30), "..."));
                        return [3 /*break*/, 9];
                    }
                    return [4 /*yield*/, supabase
                            .from('messages')
                            .insert(messageData)];
                case 7:
                    error = (_b.sent()).error;
                    if (!error) {
                        messagesImported++;
                        console.log("[Message Service Advanced] \u2705 Message saved: ".concat(cleanPhone, " - ").concat(source));
                    }
                    else {
                        console.error("[Message Service Advanced] \u274C Error saving message:", error);
                    }
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _b.sent();
                    console.warn("[Message Service Advanced] \u26A0\uFE0F Error processing message:", error_1.message);
                    return [3 /*break*/, 9];
                case 9:
                    _i++;
                    return [3 /*break*/, 2];
                case 10:
                    if (!(i + batchSize < messages.length)) return [3 /*break*/, 12];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 150); })];
                case 11:
                    _b.sent();
                    _b.label = 12;
                case 12:
                    i += batchSize;
                    return [3 /*break*/, 1];
                case 13:
                    console.log("[Message Service Advanced] \u2705 Processing completed:", {
                        messagesImported: messagesImported,
                        duplicatesSkipped: duplicatesSkipped,
                        totalProcessed: messages.length,
                        source: source
                    });
                    return [2 /*return*/, messagesImported];
            }
        });
    });
}
// 🔍 Verificar duplicados com múltiplas estratégias
function checkForDuplicates(supabase, messageData, leadId, instanceId) {
    return __awaiter(this, void 0, void 0, function () {
        var byExternalId, byContentHash, timestamp, before, after, byContentTime, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    if (!messageData.external_message_id) return [3 /*break*/, 2];
                    return [4 /*yield*/, supabase
                            .from('messages')
                            .select('id')
                            .eq('external_message_id', messageData.external_message_id)
                            .eq('whatsapp_number_id', instanceId)
                            .maybeSingle()];
                case 1:
                    byExternalId = (_a.sent()).data;
                    if (byExternalId) {
                        console.log("[Duplicate Check] \uD83C\uDFAF Found by external_id: ".concat(messageData.external_message_id));
                        return [2 /*return*/, true];
                    }
                    _a.label = 2;
                case 2:
                    if (!messageData.content_hash) return [3 /*break*/, 4];
                    return [4 /*yield*/, supabase
                            .from('messages')
                            .select('id')
                            .eq('content_hash', messageData.content_hash)
                            .eq('lead_id', leadId)
                            .eq('whatsapp_number_id', instanceId)
                            .maybeSingle()];
                case 3:
                    byContentHash = (_a.sent()).data;
                    if (byContentHash) {
                        console.log("[Duplicate Check] \uD83D\uDD10 Found by content hash: ".concat(messageData.content_hash.substring(0, 8), "..."));
                        return [2 /*return*/, true];
                    }
                    _a.label = 4;
                case 4:
                    if (!(messageData.text && messageData.timestamp)) return [3 /*break*/, 6];
                    timestamp = new Date(messageData.timestamp);
                    before = new Date(timestamp.getTime() - 30000).toISOString();
                    after = new Date(timestamp.getTime() + 30000).toISOString();
                    return [4 /*yield*/, supabase
                            .from('messages')
                            .select('id')
                            .eq('lead_id', leadId)
                            .eq('text', messageData.text)
                            .eq('from_me', messageData.from_me)
                            .gte('timestamp', before)
                            .lte('timestamp', after)
                            .maybeSingle()];
                case 5:
                    byContentTime = (_a.sent()).data;
                    if (byContentTime) {
                        console.log("[Duplicate Check] \u23F1\uFE0F Found by content+time: ".concat(messageData.text.substring(0, 20), "..."));
                        return [2 /*return*/, true];
                    }
                    _a.label = 6;
                case 6: return [2 /*return*/, false]; // Não é duplicado
                case 7:
                    error_2 = _a.sent();
                    console.error("[Duplicate Check] \u274C Error checking duplicates:", error_2);
                    return [2 /*return*/, false]; // Em caso de erro, permitir inserção
                case 8: return [2 /*return*/];
            }
        });
    });
}
// 📝 Preparar dados da mensagem com hashes e IDs
function prepareMessageData(message, leadId, instance, source) {
    return __awaiter(this, void 0, void 0, function () {
        var text, timestamp, contentHash;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    text = message.body || message.text || '';
                    timestamp = message.timestamp ?
                        new Date(typeof message.timestamp === 'number' ? message.timestamp * 1000 : message.timestamp) :
                        new Date();
                    return [4 /*yield*/, generateContentHash(text, timestamp.toISOString(), message.fromMe || false)];
                case 1:
                    contentHash = _a.sent();
                    return [2 /*return*/, {
                            lead_id: leadId,
                            whatsapp_number_id: instance.id,
                            text: text,
                            from_me: Boolean(message.fromMe),
                            timestamp: timestamp.toISOString(),
                            created_by_user_id: instance.created_by_user_id,
                            media_type: getMediaType(message),
                            media_url: message.mediaUrl || message.url || null,
                            external_message_id: message.id || message.messageId || null,
                            import_source: source,
                            content_hash: contentHash,
                            created_at: new Date().toISOString()
                        }];
            }
        });
    });
}
// 🔐 Gerar hash do conteúdo
function generateContentHash(text, timestamp, fromMe) {
    return __awaiter(this, void 0, void 0, function () {
        var content, encoder, data, hashBuffer, hashArray, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    content = "".concat(text, "|").concat(timestamp, "|").concat(fromMe);
                    encoder = new TextEncoder();
                    data = encoder.encode(content);
                    return [4 /*yield*/, crypto.subtle.digest('SHA-256', data)];
                case 1:
                    hashBuffer = _a.sent();
                    hashArray = Array.from(new Uint8Array(hashBuffer));
                    return [2 /*return*/, hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('').substring(0, 32)];
                case 2:
                    error_3 = _a.sent();
                    // Fallback simples se crypto não estiver disponível
                    return [2 /*return*/, "".concat(text.length, "_").concat(timestamp.substring(0, 10), "_").concat(fromMe).replace(/[^a-zA-Z0-9]/g, '_')];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// 👤 Buscar ou criar lead
function findOrCreateLead(supabase, phone, instance, source) {
    return __awaiter(this, void 0, void 0, function () {
        var existingLead, _a, newLead, error, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, supabase
                            .from('leads')
                            .select('id')
                            .eq('phone', phone)
                            .eq('whatsapp_number_id', instance.id)
                            .maybeSingle()];
                case 1:
                    existingLead = (_b.sent()).data;
                    if (existingLead) {
                        return [2 /*return*/, existingLead.id];
                    }
                    return [4 /*yield*/, supabase
                            .from('leads')
                            .insert({
                            phone: phone,
                            name: "Contato +".concat(phone),
                            whatsapp_number_id: instance.id,
                            company_id: instance.company_id || null,
                            created_by_user_id: instance.created_by_user_id,
                            last_message: 'Imported contact',
                            last_message_time: new Date().toISOString(),
                            import_source: source
                        })
                            .select('id')
                            .single()];
                case 2:
                    _a = _b.sent(), newLead = _a.data, error = _a.error;
                    if (error) {
                        console.error("[Message Service Advanced] \u274C Error creating lead:", error);
                        return [2 /*return*/, null];
                    }
                    console.log("[Message Service Advanced] \u2705 Lead created: ".concat(phone, " (").concat(source, ")"));
                    return [2 /*return*/, newLead.id];
                case 3:
                    error_4 = _b.sent();
                    console.error("[Message Service Advanced] \u274C Error in findOrCreateLead:", error_4.message);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// 📎 Obter tipo de mídia
function getMediaType(message) {
    if (message.type === 'image' || message.messageType === 'imageMessage')
        return 'image';
    if (message.type === 'video' || message.messageType === 'videoMessage')
        return 'video';
    if (message.type === 'audio' || message.messageType === 'audioMessage')
        return 'audio';
    if (message.type === 'document' || message.messageType === 'documentMessage')
        return 'document';
    return 'text';
}
