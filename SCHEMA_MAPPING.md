# Schema Mapping - Database vs TypeScript

## AI_AGENTS Table (from RETORNO)
**Database Fields:**
- id: uuid (NOT NULL, default: gen_random_uuid())
- name: text (NOT NULL)
- type: text (NOT NULL)
- status: text (NOT NULL, default: 'inactive')
- funnel_id: uuid (NULLABLE)
- whatsapp_number_id: uuid (NULLABLE)
- messages_count: integer (NOT NULL, default: 0)
- created_by_user_id: uuid (NOT NULL)
- created_at: timestamp with time zone (NOT NULL, default: now())
- updated_at: timestamp with time zone (NOT NULL, default: now())
- agent_function: text (NULLABLE, default: '')
- agent_objective: text (NULLABLE, default: '')
- communication_style: text (NULLABLE, default: '')
- communication_style_examples: jsonb (NULLABLE, default: '[]')
- company_info: text (NULLABLE, default: '')
- products_services: text (NULLABLE, default: '')
- rules_guidelines: jsonb (NULLABLE, default: '[]')
- prohibitions: jsonb (NULLABLE, default: '[]')
- client_objections: jsonb (NULLABLE, default: '[]')
- funnel_configuration: jsonb (NULLABLE, default: '[]')
- flow: jsonb (NULLABLE, default: '[]')

**Current TypeScript AIAgent Interface:**
- id: string ✓
- name: string ✓
- type: 'attendance' | 'sales' | 'support' | 'custom' ✓
- status: 'active' | 'inactive' ✓
- funnel_id?: string ✓
- whatsapp_number_id?: string ✓
- messages_count: number ✓
- created_by_user_id: string ✓
- created_at: string ✓
- updated_at: string ✓
- **MISSING:** All prompt-related fields from database

## PROFILES Table (from RETORNO)
**Database Fields:**
- id: uuid (NOT NULL)
- full_name: text (NOT NULL)
- username: text (NULLABLE)
- document_id: text (NULLABLE)
- whatsapp: text (NULLABLE)
- role: USER-DEFINED (NULLABLE, default: 'admin')
- created_by_user_id: uuid (NULLABLE)
- created_at: timestamp with time zone (NULLABLE, default: now())
- updated_at: timestamp with time zone (NULLABLE, default: now())
- email: text (NULLABLE)
- invite_status: text (NULLABLE, default: 'pending')
- temp_password: text (NULLABLE)
- invite_sent_at: timestamp with time zone (NULLABLE)
- linked_auth_user_id: uuid (NULLABLE)
- invite_token: uuid (NULLABLE, default: gen_random_uuid())
- avatar_url: text (NULLABLE)
- phone: text (NULLABLE)
- position: text (NULLABLE)
- department: text (NULLABLE)
- last_login_at: timestamp with time zone (NULLABLE)
- is_active: boolean (NULLABLE, default: true)
- invite_expires_at: timestamp with time zone (NULLABLE)

## Critical Discrepancies Found:
1. **AIAgent queries missing required fields** (type, status, messages_count, etc.)
2. **CreateAIAgentPromptData missing fields** (products_services_examples, etc.)
3. **Profile queries using non-existent field mappings**
4. **Supabase functions not properly typed**

## Error Categories:
- **CRITICAL:** Compilation blockers (missing required fields)
- **HIGH:** Runtime failures (incorrect queries)
- **MEDIUM:** Type mismatches (string literals)
- **LOW:** Optional field warnings