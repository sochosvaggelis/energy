-- ════════════════════════════════════════════════════════════
-- upsert_submission — with server-side input validation
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.upsert_submission(
  p_lead_info        jsonb,
  p_electricity_info jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_phone        text;
  v_email        text;
  v_name         text;
  v_region       text;
  v_contact_time text;
  v_id           uuid;
BEGIN
  -- ── Extract fields from lead_info ──────────────────────────
  v_phone        := p_lead_info->>'phone';
  v_email        := p_lead_info->>'email';
  v_name         := p_lead_info->>'name';
  v_region       := p_lead_info->>'region';
  v_contact_time := p_lead_info->>'contact_time';

  -- ── Validate phone: exactly 10 digits ──────────────────────
  IF v_phone IS NULL OR v_phone !~ '^\d{10}$' THEN
    RAISE EXCEPTION 'Invalid phone: must be exactly 10 digits, got "%"', COALESCE(v_phone, 'NULL');
  END IF;

  -- ── Validate email: basic format, max 320 chars, NULL ok ───
  IF v_email IS NOT NULL THEN
    IF length(v_email) > 320 THEN
      RAISE EXCEPTION 'Invalid email: must be at most 320 characters, got % chars', length(v_email);
    END IF;
    -- Basic email format: something @ something . something
    IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
      RAISE EXCEPTION 'Invalid email format: "%"', v_email;
    END IF;
  END IF;

  -- ── Validate name: not empty, max 255 chars ────────────────
  IF v_name IS NULL OR trim(v_name) = '' THEN
    RAISE EXCEPTION 'Invalid name: must not be empty';
  END IF;
  IF length(v_name) > 255 THEN
    RAISE EXCEPTION 'Invalid name: must be at most 255 characters, got % chars', length(v_name);
  END IF;

  -- ── Validate region: allowed values only ───────────────────
  IF v_region IS NULL OR v_region NOT IN ('attiki', 'thessaloniki', 'patra', 'larisa', 'other') THEN
    RAISE EXCEPTION 'Invalid region: must be one of attiki, thessaloniki, patra, larisa, other — got "%"',
      COALESCE(v_region, 'NULL');
  END IF;

  -- ── Validate contact_time: allowed values only ─────────────
  IF v_contact_time IS NULL OR v_contact_time NOT IN ('anytime', 'morning', 'noon', 'evening') THEN
    RAISE EXCEPTION 'Invalid contact_time: must be one of anytime, morning, noon, evening — got "%"',
      COALESCE(v_contact_time, 'NULL');
  END IF;

  -- ── Existing logic: find by phone ──────────────────────────
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
-- update_submission_details — with server-side input validation
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
DECLARE
  v_afm          text;
  v_iban         text;
  v_iban_numeric text;
  v_checksum     bigint;
  v_afm_sum      int;
  v_i            int;
  v_exists       boolean;
BEGIN
  -- ── Validate p_id: submission must exist ────────────────────
  SELECT EXISTS (
    SELECT 1 FROM public.submissions WHERE id = p_id
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'Submission % not found', p_id;
  END IF;

  -- ── Validate AFM (Greek tax number) if present ─────────────
  -- Greek AFM is 9 digits. Checksum: for positions 1..8,
  -- sum += digit[i] * 2^(9-i), then sum % 11 % 10 must equal digit[9].
  IF p_detail_form IS NOT NULL AND p_detail_form ? 'afm' THEN
    v_afm := p_detail_form->>'afm';

    IF v_afm IS NULL OR v_afm !~ '^\d{9}$' THEN
      RAISE EXCEPTION 'Invalid AFM: must be exactly 9 digits, got "%"', COALESCE(v_afm, 'NULL');
    END IF;

    v_afm_sum := 0;
    FOR v_i IN 1..8 LOOP
      -- digit at position v_i (1-based), multiplied by 2^(9-v_i)
      v_afm_sum := v_afm_sum
        + (substr(v_afm, v_i, 1)::int) * (1 << (9 - v_i));
    END LOOP;

    IF (v_afm_sum % 11) % 10 <> substr(v_afm, 9, 1)::int THEN
      RAISE EXCEPTION 'Invalid AFM: checksum failed for "%"', v_afm;
    END IF;
  END IF;

  -- ── Validate IBAN if present ───────────────────────────────
  -- Greek IBAN: "GR" followed by exactly 25 digits (27 chars total).
  -- IBAN mod-97 check: move first 4 chars to end, convert letters
  -- to numbers (A=10..Z=35), resulting number mod 97 must equal 1.
  IF p_detail_form IS NOT NULL AND p_detail_form ? 'iban' THEN
    v_iban := upper(trim(p_detail_form->>'iban'));

    -- Format check: GR + 25 digits
    IF v_iban IS NULL OR v_iban !~ '^GR\d{25}$' THEN
      RAISE EXCEPTION 'Invalid IBAN: must match GR followed by 25 digits, got "%"',
        COALESCE(v_iban, 'NULL');
    END IF;

    -- IBAN mod-97 check
    -- Step 1: Move first 4 characters to end
    v_iban := substr(v_iban, 5) || substr(v_iban, 1, 4);

    -- Step 2: Convert letters to numbers (G=16, R=27, etc.)
    v_iban_numeric := '';
    FOR v_i IN 1..length(v_iban) LOOP
      IF substr(v_iban, v_i, 1) BETWEEN 'A' AND 'Z' THEN
        -- A=10, B=11, ..., Z=35
        v_iban_numeric := v_iban_numeric || (ascii(substr(v_iban, v_i, 1)) - 55)::text;
      ELSE
        v_iban_numeric := v_iban_numeric || substr(v_iban, v_i, 1);
      END IF;
    END LOOP;

    -- Step 3: Compute mod 97 on the large number (piece-wise to avoid overflow)
    v_checksum := 0;
    FOR v_i IN 1..length(v_iban_numeric) LOOP
      v_checksum := (v_checksum * 10 + substr(v_iban_numeric, v_i, 1)::int) % 97;
    END LOOP;

    IF v_checksum <> 1 THEN
      RAISE EXCEPTION 'Invalid IBAN: mod-97 check failed for "%"', p_detail_form->>'iban';
    END IF;
  END IF;

  -- ── Existing logic: update the submission ──────────────────
  UPDATE public.submissions
  SET selected_plan  = COALESCE(p_selected_plan, selected_plan),
      detail_form    = COALESCE(p_detail_form, detail_form),
      uploaded_files = COALESCE(p_uploaded_files, uploaded_files)
  WHERE id = p_id;
END;
$$;
