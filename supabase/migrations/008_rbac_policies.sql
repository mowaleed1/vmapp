-- Migration: 008_rbac_policies.sql
-- Description: Implement strict Role-Based Access Control and 'user' isolation

-- 1. Modify roles (change 'viewer' to 'user')
UPDATE roles SET name = 'user', description = 'End user with access only to their own requests and upload interface' WHERE name = 'viewer';

-- 2. Add ai_analysis JSONB column to upload_files
ALTER TABLE upload_files ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

-- 3. Convenience function to get the current user's role securely
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name 
  FROM users u
  JOIN roles r ON u.role_id = r.id
  WHERE u.id = auth.uid()
  LIMIT 1;
$$;

-- 4. Drop all existing "open" policies
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' AND policyname = 'Enable all access for authenticated users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;


-- ==========================================
-- STRICT TICKETS POLICIES
-- ==========================================
CREATE POLICY "Tickets: Admin and Agent all access"
ON tickets FOR ALL TO authenticated
USING ( get_user_role() IN ('admin', 'agent') )
WITH CHECK ( get_user_role() IN ('admin', 'agent') );

CREATE POLICY "Tickets: User read own"
ON tickets FOR SELECT TO authenticated
USING ( get_user_role() = 'user' AND requester_id = auth.uid() );


-- ==========================================
-- STRICT TICKET_COMMENTS POLICIES
-- ==========================================
CREATE POLICY "Comments: Admin and Agent all access"
ON ticket_comments FOR ALL TO authenticated
USING ( get_user_role() IN ('admin', 'agent') )
WITH CHECK ( get_user_role() IN ('admin', 'agent') );

CREATE POLICY "Comments: User read related"
ON ticket_comments FOR SELECT TO authenticated
USING ( 
    get_user_role() = 'user' AND 
    EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_comments.ticket_id AND t.requester_id = auth.uid()) AND
    is_internal = false
);


-- ==========================================
-- STRICT TICKET_ATTACHMENTS POLICIES
-- ==========================================
CREATE POLICY "Attachments: Admin and Agent all access"
ON ticket_attachments FOR ALL TO authenticated
USING ( get_user_role() IN ('admin', 'agent') )
WITH CHECK ( get_user_role() IN ('admin', 'agent') );

CREATE POLICY "Attachments: User read related"
ON ticket_attachments FOR SELECT TO authenticated
USING ( 
    get_user_role() = 'user' AND 
    EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_attachments.ticket_id AND t.requester_id = auth.uid())
);


-- ==========================================
-- STRICT TICKET_ACTIVITY_LOGS POLICIES
-- ==========================================
CREATE POLICY "Logs: Admin and Agent all access"
ON ticket_activity_logs FOR ALL TO authenticated
USING ( get_user_role() IN ('admin', 'agent') )
WITH CHECK ( get_user_role() IN ('admin', 'agent') );

CREATE POLICY "Logs: User read related"
ON ticket_activity_logs FOR SELECT TO authenticated
USING ( 
    get_user_role() = 'user' AND 
    EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_activity_logs.ticket_id AND t.requester_id = auth.uid())
);


-- ==========================================
-- STRICT UPLOAD_BATCHES POLICIES
-- ==========================================
CREATE POLICY "Batches: Admin and Agent all access"
ON upload_batches FOR ALL TO authenticated
USING ( get_user_role() IN ('admin', 'agent') )
WITH CHECK ( get_user_role() IN ('admin', 'agent') );

CREATE POLICY "Batches: User own access"
ON upload_batches FOR ALL TO authenticated
USING ( get_user_role() = 'user' AND user_id = auth.uid() )
WITH CHECK ( get_user_role() = 'user' AND user_id = auth.uid() );


-- ==========================================
-- STRICT UPLOAD_FILES POLICIES
-- ==========================================
CREATE POLICY "Upload Files: Admin and Agent all access"
ON upload_files FOR ALL TO authenticated
USING ( get_user_role() IN ('admin', 'agent') )
WITH CHECK ( get_user_role() IN ('admin', 'agent') );

CREATE POLICY "Upload Files: User own access"
ON upload_files FOR ALL TO authenticated
USING ( get_user_role() = 'user' AND user_id = auth.uid() )
WITH CHECK ( get_user_role() = 'user' AND user_id = auth.uid() );


-- ==========================================
-- USERS, ROLES, TEAMS, ORGANIZATIONS, SLA
-- ==========================================
CREATE POLICY "Roles: Read all" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teams: Read all" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Organizations: Read all" ON organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "SLA: Read all" ON sla_policies FOR SELECT TO authenticated USING (true);

-- Metadata write access restricted to admins
CREATE POLICY "Admin write access for Roles" ON roles FOR ALL TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Admin write access for Teams" ON teams FOR ALL TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Admin write access for Orgs" ON organizations FOR ALL TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Admin write access for SLA" ON sla_policies FOR ALL TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- Users can read other users (needed for assignment dropdowns among internal staff).
-- Alternatively, we could restrict this to agents/admins, but it's safe to read standard DB columns (no sensitive auth data here).
CREATE POLICY "Users: Read all" ON users FOR SELECT TO authenticated USING (true);

-- Users can update themselves, Admins can update anyone (e.g. changing roles)
CREATE POLICY "Users: Update self" ON users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users: Admin update any" ON users FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
