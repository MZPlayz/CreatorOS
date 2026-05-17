-- prisma/migrations/20260517000000_rls_policies/migration.sql

-- 1. Enable RLS on all models
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BankTransaction" ENABLE ROW LEVEL SECURITY;

-- 2. Force RLS (Applies policies even to table owners)
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Client" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Project" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" FORCE ROW LEVEL SECURITY;
ALTER TABLE "BankTransaction" FORCE ROW LEVEL SECURITY;

-- 3. Define Policies (Native PostgreSQL RLS)
-- Service Role Bypass: If `app.current_user_id` is 'service_role', allow all
-- Otherwise, enforce strict owner isolation with WITH CHECK for inserts/updates

-- User isolation
CREATE POLICY "user_select_policy" ON "User" FOR SELECT USING ("id" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role');
CREATE POLICY "user_mod_policy" ON "User" FOR ALL USING ("id" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role') WITH CHECK ("id" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role');

-- Invoice isolation
CREATE POLICY "invoice_select_policy" ON "Invoice" FOR SELECT USING ("ownerId" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role');
CREATE POLICY "invoice_mod_policy" ON "Invoice" FOR ALL USING ("ownerId" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role') WITH CHECK ("ownerId" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role');

-- Client isolation
CREATE POLICY "client_select_policy" ON "Client" FOR SELECT USING ("ownerId" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role');
CREATE POLICY "client_mod_policy" ON "Client" FOR ALL USING ("ownerId" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role') WITH CHECK ("ownerId" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role');

-- Project isolation
CREATE POLICY "project_select_policy" ON "Project" FOR SELECT USING ("ownerId" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role');
CREATE POLICY "project_mod_policy" ON "Project" FOR ALL USING ("ownerId" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role') WITH CHECK ("ownerId" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role');

-- BankTransaction isolation
CREATE POLICY "banktransaction_select_policy" ON "BankTransaction" FOR SELECT USING (EXISTS (SELECT 1 FROM "Invoice" WHERE "id" = "BankTransaction"."invoiceId" AND ("ownerId" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role')) OR current_setting('app.current_user_id', TRUE) = 'service_role');
CREATE POLICY "banktransaction_mod_policy" ON "BankTransaction" FOR ALL USING (EXISTS (SELECT 1 FROM "Invoice" WHERE "id" = "BankTransaction"."invoiceId" AND ("ownerId" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role')) OR current_setting('app.current_user_id', TRUE) = 'service_role') WITH CHECK (EXISTS (SELECT 1 FROM "Invoice" WHERE "id" = "BankTransaction"."invoiceId" AND ("ownerId" = current_setting('app.current_user_id', TRUE) OR current_setting('app.current_user_id', TRUE) = 'service_role')) OR current_setting('app.current_user_id', TRUE) = 'service_role');
