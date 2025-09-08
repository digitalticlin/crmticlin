-- VERIFICAR PERMISSÕES DO USUÁRIO ATUAL NO SUPABASE

-- 1. Ver qual usuário você está usando
SELECT current_user, current_role;

-- 2. Ver se você é superuser
SELECT 
    rolname,
    rolsuper as is_superuser,
    rolcreaterole as can_create_roles,
    rolcreatedb as can_create_databases,
    rolcanlogin as can_login
FROM pg_roles 
WHERE rolname = current_user;

-- 3. Ver todas as permissões/roles do seu usuário
SELECT 
    r.rolname as role_name,
    r.rolsuper,
    r.rolcreaterole,
    r.rolcreatedb,
    r.rolcanlogin,
    r.rolreplication
FROM pg_roles r
WHERE r.oid = ANY(
    SELECT unnest(pg_auth_members.roleid)
    FROM pg_auth_members 
    WHERE pg_auth_members.member = (
        SELECT oid FROM pg_roles WHERE rolname = current_user
    )
) OR r.rolname = current_user;

-- 4. Verificar owner da tabela auth.users
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'auth' 
AND tablename = 'users';

-- 5. Verificar se você pode criar triggers na tabela auth.users
SELECT 
    has_table_privilege(current_user, 'auth.users', 'TRIGGER') as can_create_triggers_auth_users,
    has_schema_privilege(current_user, 'auth', 'USAGE') as can_use_auth_schema;

-- 6. Ver usuários service_role (que geralmente têm mais permissões)
SELECT rolname, rolsuper 
FROM pg_roles 
WHERE rolname LIKE '%service%' OR rolname LIKE '%postgres%';