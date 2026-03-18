-- ============================================================
-- Supabase RLS Policies — EnergyCompare
-- Τρέξε αυτό το script στο Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Helper: is_admin()
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 2. Helper: is_staff()
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE user_id = auth.uid()
  );
$$;

-- ════════════════════════════════════════════════════════════
-- 3. RPC: upsert_submission
--    Αντικαθιστά τα direct SELECT+INSERT/UPDATE στο frontend
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.upsert_submission(
  p_lead_info    jsonb,
  p_electricity_info jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_phone  text;
  v_id     uuid;
BEGIN
  v_phone := p_lead_info->>'phone';

  -- Find existing submission by phone only
  SELECT id INTO v_id
  FROM public.submissions
  WHERE lead_info->>'phone' = v_phone
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    -- Update existing — keep status & uploaded files intact
    UPDATE public.submissions
    SET lead_info        = p_lead_info,
        electricity_info = p_electricity_info,
        submitted_at     = now()
    WHERE id = v_id;
  ELSE
    -- Insert new
    INSERT INTO public.submissions (lead_info, electricity_info, submitted_at, status)
    VALUES (p_lead_info, p_electricity_info, now(), 'Νέο')
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 4. RPC: update_submission_details
--    Αντικαθιστά τα direct UPDATE στο PlanDetailSidebar
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_submission_details(
  p_id              uuid,
  p_selected_plan   jsonb DEFAULT NULL,
  p_detail_form     jsonb DEFAULT NULL,
  p_uploaded_files  jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.submissions
  SET selected_plan  = COALESCE(p_selected_plan, selected_plan),
      detail_form    = COALESCE(p_detail_form, detail_form),
      uploaded_files = COALESCE(p_uploaded_files, uploaded_files)
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission % not found', p_id;
  END IF;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 5. Enable RLS on all tables
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff       ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════
-- 6. Drop existing policies (clean slate)
-- ════════════════════════════════════════════════════════════
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('submissions','plans','providers','settings','staff')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 7. SUBMISSIONS policies
-- ════════════════════════════════════════════════════════════

-- Anon users can INSERT (initial form submission through RPC,
-- but we also allow direct insert as fallback)
CREATE POLICY "submissions_anon_insert"
  ON public.submissions FOR INSERT
  TO anon
  WITH CHECK (true);

-- Staff can SELECT all submissions
CREATE POLICY "submissions_staff_select"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (public.is_staff());

-- Staff can UPDATE submissions (status, notes, details)
CREATE POLICY "submissions_staff_update"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Only admin can DELETE submissions
CREATE POLICY "submissions_admin_delete"
  ON public.submissions FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ════════════════════════════════════════════════════════════
-- 8. PLANS policies
-- ════════════════════════════════════════════════════════════

-- Anyone (including anon) can read plans (frontend needs this)
CREATE POLICY "plans_public_select"
  ON public.plans FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admin can insert/update/delete plans
CREATE POLICY "plans_admin_insert"
  ON public.plans FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "plans_admin_update"
  ON public.plans FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "plans_admin_delete"
  ON public.plans FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ════════════════════════════════════════════════════════════
-- 9. PROVIDERS policies
-- ════════════════════════════════════════════════════════════

-- Anyone can read providers (frontend needs this)
CREATE POLICY "providers_public_select"
  ON public.providers FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admin can insert/update/delete providers
CREATE POLICY "providers_admin_insert"
  ON public.providers FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "providers_admin_update"
  ON public.providers FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "providers_admin_delete"
  ON public.providers FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ════════════════════════════════════════════════════════════
-- 10. SETTINGS policies
-- ════════════════════════════════════════════════════════════

-- Anyone can read settings (frontend needs TEA value)
CREATE POLICY "settings_public_select"
  ON public.settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admin can insert/update/delete settings
CREATE POLICY "settings_admin_insert"
  ON public.settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "settings_admin_update"
  ON public.settings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "settings_admin_delete"
  ON public.settings FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ════════════════════════════════════════════════════════════
-- 11. STAFF policies
-- ════════════════════════════════════════════════════════════

-- Authenticated users can see their own staff record
CREATE POLICY "staff_self_select"
  ON public.staff FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin can see all staff
CREATE POLICY "staff_admin_select"
  ON public.staff FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Only admin can insert/update/delete staff
CREATE POLICY "staff_admin_insert"
  ON public.staff FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "staff_admin_update"
  ON public.staff FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "staff_admin_delete"
  ON public.staff FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ════════════════════════════════════════════════════════════
-- 12. Grant RPC execute permissions
-- ════════════════════════════════════════════════════════════
GRANT EXECUTE ON FUNCTION public.upsert_submission(jsonb, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_submission_details(uuid, jsonb, jsonb, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- ════════════════════════════════════════════════════════════
-- 13. Audit log table
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id),
  user_email  text,
  action      text NOT NULL,
  entity      text,
  entity_id   text,
  details     jsonb,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view audit log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.is_staff());

CREATE POLICY "Staff can insert audit log"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
