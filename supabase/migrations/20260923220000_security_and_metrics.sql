-- Invitations are the only path to a new account after the first administrator.
CREATE TABLE public.staff_invitations (
  email TEXT PRIMARY KEY CHECK (email = lower(email)),
  role public.app_role NOT NULL CHECK (role = 'vendedor'),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.staff_invitations TO authenticated;
GRANT ALL ON public.staff_invitations TO service_role;
CREATE POLICY "admin_read_invitations" ON public.staff_invitations FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE assigned_role public.app_role;
BEGIN
  PERFORM pg_advisory_xact_lock(70018231);
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    -- Only used during initial setup. Create the first admin before publishing the app.
    assigned_role := 'admin';
  ELSE
    SELECT role INTO assigned_role FROM public.staff_invitations
      WHERE email = lower(NEW.email) FOR UPDATE;
    IF assigned_role IS NULL THEN
      RAISE EXCEPTION 'Cadastro somente por convite';
    END IF;
    DELETE FROM public.staff_invitations WHERE email = lower(NEW.email);
  END IF;

  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

-- Sellers can access only their assigned commercial records. Unassigned records stay admin-only.
DROP POLICY "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies FOR SELECT TO authenticated
  USING (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()));
DROP POLICY "companies_insert" ON public.companies;
CREATE POLICY "companies_insert" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()));
DROP POLICY "companies_update" ON public.companies;
CREATE POLICY "companies_update" ON public.companies FOR UPDATE TO authenticated
  USING (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()))
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()));

DROP POLICY "leads_select" ON public.leads;
CREATE POLICY "leads_select" ON public.leads FOR SELECT TO authenticated
  USING (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()));
DROP POLICY "leads_insert" ON public.leads;
CREATE POLICY "leads_insert" ON public.leads FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()));
DROP POLICY "leads_update" ON public.leads;
CREATE POLICY "leads_update" ON public.leads FOR UPDATE TO authenticated
  USING (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()))
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()));

DROP POLICY "followups_select" ON public.followups;
CREATE POLICY "followups_select" ON public.followups FOR SELECT TO authenticated
  USING (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()));
DROP POLICY "followups_insert" ON public.followups;
CREATE POLICY "followups_insert" ON public.followups FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()));
DROP POLICY "followups_update" ON public.followups;
CREATE POLICY "followups_update" ON public.followups FOR UPDATE TO authenticated
  USING (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()))
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()));
DROP POLICY "followups_delete" ON public.followups;
CREATE POLICY "followups_delete" ON public.followups FOR DELETE TO authenticated
  USING (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()));

DROP POLICY "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients FOR SELECT TO authenticated
  USING (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()) OR user_id = auth.uid());
DROP POLICY "clients_insert" ON public.clients;
CREATE POLICY "clients_insert" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid() AND user_id IS NULL));
DROP POLICY "clients_update" ON public.clients;
CREATE POLICY "clients_update" ON public.clients FOR UPDATE TO authenticated
  USING (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid()))
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND owner_id = auth.uid() AND user_id IS NULL));

DROP POLICY "sales_insert" ON public.sales;
CREATE POLICY "sales_insert" ON public.sales FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND vendedor_id = auth.uid()
    AND (client_id IS NULL OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.owner_id = auth.uid()))));
DROP POLICY "sales_update" ON public.sales;
CREATE POLICY "sales_update" ON public.sales FOR UPDATE TO authenticated
  USING (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND vendedor_id = auth.uid()))
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND vendedor_id = auth.uid()));

DROP POLICY "plates_select" ON public.plates;
CREATE POLICY "plates_select" ON public.plates FOR SELECT TO authenticated
  USING (public.is_admin() OR public.owns_client(client_id)
    OR (public.has_role(auth.uid(), 'vendedor') AND EXISTS
      (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.owner_id = auth.uid())));
DROP POLICY "plates_insert" ON public.plates;
CREATE POLICY "plates_insert" ON public.plates FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND EXISTS
    (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.owner_id = auth.uid())));
DROP POLICY "plates_update" ON public.plates;
CREATE POLICY "plates_update" ON public.plates FOR UPDATE TO authenticated
  USING (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND EXISTS
    (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.owner_id = auth.uid())))
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND EXISTS
    (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.owner_id = auth.uid())));

DROP POLICY "activities_select" ON public.activities;
CREATE POLICY "activities_select" ON public.activities FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.owner_id = auth.uid()));
DROP POLICY "activities_insert" ON public.activities;
CREATE POLICY "activities_insert" ON public.activities FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND EXISTS
    (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.owner_id = auth.uid())));

DROP POLICY "access_events_select" ON public.access_events;
CREATE POLICY "access_events_select" ON public.access_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.plates p WHERE p.id = plate_id));
DROP POLICY "review_snap_select" ON public.review_snapshots;
CREATE POLICY "review_snap_select" ON public.review_snapshots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id));
DROP POLICY "review_snap_write" ON public.review_snapshots;
CREATE POLICY "review_snap_write" ON public.review_snapshots FOR ALL TO authenticated
  USING (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND EXISTS
    (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.owner_id = auth.uid())))
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND EXISTS
    (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.owner_id = auth.uid())));
DROP POLICY "reports_select" ON public.reports;
CREATE POLICY "reports_select" ON public.reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id));
DROP POLICY "reports_write" ON public.reports;
CREATE POLICY "reports_write" ON public.reports FOR ALL TO authenticated
  USING (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND EXISTS
    (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.owner_id = auth.uid())))
  WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'vendedor') AND EXISTS
    (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.owner_id = auth.uid())));

CREATE INDEX IF NOT EXISTS idx_access_events_plate_created ON public.access_events(plate_id, created_at);
CREATE INDEX IF NOT EXISTS idx_access_events_client_created ON public.access_events(client_id, created_at);

-- Invoker privileges and RLS apply: client users see only their own events.
CREATE OR REPLACE FUNCTION public.access_summary(
  p_plate_id UUID DEFAULT NULL, p_client_id UUID DEFAULT NULL, p_days INTEGER DEFAULT 30,
  p_from DATE DEFAULT NULL, p_to DATE DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE result JSONB;
BEGIN
  IF p_days NOT BETWEEN 1 AND 365 OR (p_from IS NOT NULL AND p_to IS NOT NULL AND (p_from > p_to OR p_to - p_from > 365)) THEN
    RAISE EXCEPTION 'Período inválido';
  END IF;
  WITH visible AS (
    SELECT source, (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS day
    FROM public.access_events
    WHERE (p_plate_id IS NULL OR plate_id = p_plate_id)
      AND (p_client_id IS NULL OR client_id = p_client_id)
  ), buckets AS (
    SELECT day, count(*)::int AS total,
      count(*) FILTER (WHERE source = 'nfc')::int AS nfc,
      count(*) FILTER (WHERE source = 'qr')::int AS qr
    FROM visible WHERE day BETWEEN COALESCE(p_from, (now() AT TIME ZONE 'America/Sao_Paulo')::date - p_days + 1)
      AND COALESCE(p_to, (now() AT TIME ZONE 'America/Sao_Paulo')::date)
    GROUP BY day
  ), summary AS (
    SELECT jsonb_build_object('total',count(*),'nfc',count(*) FILTER (WHERE source='nfc'),
      'qr',count(*) FILTER (WHERE source='qr')) AS counts,
      count(*) FILTER (WHERE day = (now() AT TIME ZONE 'America/Sao_Paulo')::date) AS today,
      count(*) FILTER (WHERE day >= (now() AT TIME ZONE 'America/Sao_Paulo')::date - 6) AS last7,
      count(*) FILTER (WHERE day >= (now() AT TIME ZONE 'America/Sao_Paulo')::date - 29) AS last30,
      count(*) FILTER (WHERE day >= date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date) AS month
    FROM visible
  )
  SELECT jsonb_build_object('all',s.counts,'today',s.today,'last7',s.last7,
    'last30',s.last30,'month',s.month,'series',COALESCE((
      SELECT jsonb_agg(jsonb_build_object('day', day, 'total', total, 'nfc', nfc, 'qr', qr) ORDER BY day)
      FROM buckets), '[]'::jsonb)) INTO result FROM summary s;
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.access_summary(UUID, UUID, INTEGER, DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.access_summary(UUID, UUID, INTEGER, DATE, DATE) TO authenticated;

CREATE OR REPLACE FUNCTION public.commercial_summary()
RETURNS JSONB LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH lead_counts AS (
    SELECT count(*) AS total,
      count(*) FILTER (WHERE lower(s.nome) LIKE '%novo%') AS novos,
      count(*) FILTER (WHERE lower(s.nome) LIKE '%contatado%') AS contatados,
      count(*) FILTER (WHERE lower(s.nome) LIKE '%interessado%') AS interessados,
      count(*) FILTER (WHERE lower(s.nome) LIKE '%proposta%') AS propostas
    FROM public.leads l LEFT JOIN public.pipeline_stages s ON s.id = l.stage_id
  ), sale_counts AS (
    SELECT count(*) AS total,
      count(*) FILTER (WHERE data_venda >= date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date) AS mes,
      COALESCE(sum(valor) FILTER (WHERE data_venda >= date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date),0) AS faturamento
    FROM public.sales
  ), client_counts AS (
    SELECT count(*) FILTER (WHERE status = 'ativo') AS ativos,
      count(*) FILTER (WHERE created_at >= date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo') AS novos
    FROM public.clients
  ), plate_counts AS (
    SELECT count(*) AS total, count(*) FILTER (WHERE status='ativa') AS ativas,
      count(*) FILTER (WHERE status='producao') AS producao,
      count(*) FILTER (WHERE status IN ('inativa','pausada')) AS inativas
    FROM public.plates
  ), followup_counts AS (
    SELECT count(*) FILTER (WHERE status='pendente' AND data=(now() AT TIME ZONE 'America/Sao_Paulo')::date) AS hoje,
      count(*) FILTER (WHERE status='pendente' AND data<(now() AT TIME ZONE 'America/Sao_Paulo')::date) AS atrasados,
      min(data) FILTER (WHERE status='pendente' AND data<(now() AT TIME ZONE 'America/Sao_Paulo')::date) AS mais_antigo
    FROM public.followups
  )
  SELECT jsonb_build_object(
    'leads', jsonb_build_object('total',l.total,'novos',l.novos,'contatados',l.contatados,'interessados',l.interessados,'propostas',l.propostas),
    'sales', jsonb_build_object('total',s.total,'mes',s.mes,'faturamento',s.faturamento),
    'clients', jsonb_build_object('ativos',c.ativos,'novos',c.novos),
    'plates', jsonb_build_object('total',p.total,'ativas',p.ativas,'producao',p.producao,'inativas',p.inativas),
    'followups', jsonb_build_object('hoje',f.hoje,'atrasados',f.atrasados,'mais_antigo',f.mais_antigo)
  ) FROM lead_counts l CROSS JOIN sale_counts s CROSS JOIN client_counts c CROSS JOIN plate_counts p CROSS JOIN followup_counts f;
$$;
REVOKE ALL ON FUNCTION public.commercial_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.commercial_summary() TO authenticated;

CREATE OR REPLACE FUNCTION public.record_review_snapshot(p_client_id UUID, p_total INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF p_total < 0 THEN RAISE EXCEPTION 'Total inválido'; END IF;
  UPDATE public.clients SET reviews_current=p_total, reviews_last_updated_at=now()
  WHERE id=p_client_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cliente não encontrado ou sem permissão'; END IF;
  INSERT INTO public.review_snapshots(client_id,total_reviews,fonte,created_by)
  VALUES (p_client_id,p_total,'manual',auth.uid());
END; $$;
REVOKE ALL ON FUNCTION public.record_review_snapshot(UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_review_snapshot(UUID, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_initial_reviews()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.reviews_at_start IS NOT NULL THEN
    INSERT INTO public.review_snapshots(client_id,total_reviews,fonte,created_by)
    VALUES (NEW.id,NEW.reviews_at_start,'manual',auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_initial_reviews AFTER INSERT ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.record_initial_reviews();
REVOKE ALL ON FUNCTION public.record_initial_reviews() FROM PUBLIC, anon, authenticated;
