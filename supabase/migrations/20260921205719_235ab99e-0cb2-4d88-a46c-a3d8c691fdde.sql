-- ============ ROLES & PROFILES ============
CREATE TYPE public.app_role AS ENUM ('admin','vendedor','cliente');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendedor');
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- first user becomes admin, everyone else vendedor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.app_role;
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    r := 'admin';
  ELSE
    r := 'vendedor';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "profiles_select_staff" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff());
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ============ PROSPECÇÃO ============
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_empresa TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  segmento TEXT,
  categoria TEXT,
  responsavel TEXT,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  instagram TEXT,
  site TEXT,
  google_url TEXT,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  origem TEXT DEFAULT 'manual',
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'novo',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_companies_owner ON public.companies(owner_id);
CREATE INDEX idx_companies_cidade ON public.companies(cidade);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_select" ON public.companies FOR SELECT TO authenticated
  USING (public.is_admin() OR (public.is_staff() AND (owner_id = auth.uid() OR owner_id IS NULL)));
CREATE POLICY "companies_insert" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());
CREATE POLICY "companies_update" ON public.companies FOR UPDATE TO authenticated
  USING (public.is_admin() OR (public.is_staff() AND (owner_id = auth.uid() OR owner_id IS NULL)))
  WITH CHECK (public.is_staff());
CREATE POLICY "companies_delete" ON public.companies FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============ PIPELINE ============
CREATE TABLE public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  posicao INTEGER NOT NULL DEFAULT 0,
  cor TEXT,
  tipo TEXT NOT NULL DEFAULT 'aberto',
  arquivada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_stages TO authenticated;
GRANT ALL ON public.pipeline_stages TO service_role;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stages_select" ON public.pipeline_stages FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "stages_admin_write" ON public.pipeline_stages FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.pipeline_stages (nome, posicao, tipo) VALUES
 ('Novo Lead',1,'aberto'),('Para Visitar',2,'aberto'),('Visitado',3,'aberto'),
 ('Contatado',4,'aberto'),('Interessado',5,'aberto'),('Follow-up',6,'aberto'),
 ('Proposta Enviada',7,'aberto'),('Negociação',8,'aberto'),
 ('Venda Fechada',9,'ganho'),('Não Fechou',10,'perdido');

-- ============ LEADS (oportunidades) ============
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  titulo TEXT,
  nome_empresa TEXT NOT NULL,
  responsavel TEXT,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  cidade TEXT,
  estado TEXT,
  endereco TEXT,
  segmento TEXT,
  valor_estimado NUMERIC(12,2) DEFAULT 0,
  stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  stage_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ultimo_contato_at TIMESTAMPTZ,
  proxima_acao TEXT,
  proxima_acao_at TIMESTAMPTZ,
  observacoes TEXT,
  posicao INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_owner ON public.leads(owner_id);
CREATE INDEX idx_leads_stage ON public.leads(stage_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_select" ON public.leads FOR SELECT TO authenticated
  USING (public.is_admin() OR (public.is_staff() AND (owner_id = auth.uid() OR owner_id IS NULL)));
CREATE POLICY "leads_insert" ON public.leads FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "leads_update" ON public.leads FOR UPDATE TO authenticated
  USING (public.is_admin() OR (public.is_staff() AND (owner_id = auth.uid() OR owner_id IS NULL)))
  WITH CHECK (public.is_staff());
CREATE POLICY "leads_delete" ON public.leads FOR DELETE TO authenticated USING (public.is_admin());

-- histórico de etapa automático
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activities_lead ON public.activities(lead_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_select" ON public.activities FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (l.owner_id = auth.uid() OR l.owner_id IS NULL)));
CREATE POLICY "activities_insert" ON public.activities FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "activities_delete" ON public.activities FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.log_lead_stage_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nome_etapa TEXT;
BEGIN
  IF NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
    SELECT nome INTO nome_etapa FROM public.pipeline_stages WHERE id = NEW.stage_id;
    NEW.stage_changed_at := now();
    INSERT INTO public.activities (lead_id, tipo, descricao, user_id)
    VALUES (NEW.id, 'etapa', 'Movido para ' || COALESCE(nome_etapa,'etapa'), auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_lead_stage_change BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.log_lead_stage_change();

CREATE OR REPLACE FUNCTION public.log_lead_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activities (lead_id, tipo, descricao, user_id)
  VALUES (NEW.id, 'criacao', 'Lead criado', auth.uid());
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_lead_created AFTER INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.log_lead_created();

CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FOLLOW-UPS ============
CREATE TABLE public.followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'ligacao',
  data DATE NOT NULL DEFAULT (now()::date),
  hora TIME,
  prioridade TEXT NOT NULL DEFAULT 'media',
  observacao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  concluido_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_followups_owner ON public.followups(owner_id);
CREATE INDEX idx_followups_data ON public.followups(data);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followups TO authenticated;
GRANT ALL ON public.followups TO service_role;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "followups_select" ON public.followups FOR SELECT TO authenticated
  USING (public.is_admin() OR (public.is_staff() AND (owner_id = auth.uid() OR owner_id IS NULL)));
CREATE POLICY "followups_insert" ON public.followups FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "followups_update" ON public.followups FOR UPDATE TO authenticated
  USING (public.is_admin() OR (public.is_staff() AND (owner_id = auth.uid() OR owner_id IS NULL)))
  WITH CHECK (public.is_staff());
CREATE POLICY "followups_delete" ON public.followups FOR DELETE TO authenticated
  USING (public.is_admin() OR owner_id = auth.uid());
CREATE TRIGGER trg_followups_updated BEFORE UPDATE ON public.followups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ MENSAGENS ============
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'primeiro_contato',
  conteudo TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_templates TO authenticated;
GRANT ALL ON public.message_templates TO service_role;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_select" ON public.message_templates FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "templates_write" ON public.message_templates FOR ALL TO authenticated
  USING (public.is_admin() OR created_by = auth.uid()) WITH CHECK (public.is_staff());
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ METAS ============
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metrica TEXT NOT NULL,
  periodo TEXT NOT NULL DEFAULT 'mensal',
  data_inicio DATE NOT NULL DEFAULT (now()::date),
  data_fim DATE NOT NULL DEFAULT (now()::date),
  alvo NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_select" ON public.goals FOR SELECT TO authenticated
  USING (public.is_admin() OR owner_id = auth.uid());
CREATE POLICY "goals_write" ON public.goals FOR ALL TO authenticated
  USING (public.is_admin() OR owner_id = auth.uid()) WITH CHECK (public.is_staff());
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CLIENTES ============
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  nome_empresa TEXT NOT NULL,
  responsavel TEXT,
  cnpj TEXT,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  instagram TEXT,
  site TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  plano TEXT,
  data_inicio DATE DEFAULT (now()::date),
  status TEXT NOT NULL DEFAULT 'ativo',
  observacoes TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  google_business_url TEXT,
  google_review_url TEXT,
  reviews_at_start INTEGER,
  reviews_current INTEGER,
  reviews_last_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_owner ON public.clients(owner_id);
CREATE INDEX idx_clients_user ON public.clients(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_select" ON public.clients FOR SELECT TO authenticated
  USING (public.is_admin() OR (public.is_staff() AND (owner_id = auth.uid() OR owner_id IS NULL)) OR user_id = auth.uid());
CREATE POLICY "clients_insert" ON public.clients FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "clients_update" ON public.clients FOR UPDATE TO authenticated
  USING (public.is_admin() OR (public.is_staff() AND (owner_id = auth.uid() OR owner_id IS NULL)))
  WITH CHECK (public.is_staff());
CREATE POLICY "clients_delete" ON public.clients FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.owns_client(_client_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = _client_id AND c.user_id = auth.uid());
$$;

-- ============ VENDAS ============
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_venda DATE NOT NULL DEFAULT (now()::date),
  plano TEXT,
  observacoes TEXT,
  vendedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sales_vendedor ON public.sales(vendedor_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_select" ON public.sales FOR SELECT TO authenticated
  USING (public.is_admin() OR vendedor_id = auth.uid());
CREATE POLICY "sales_insert" ON public.sales FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "sales_update" ON public.sales FOR UPDATE TO authenticated
  USING (public.is_admin() OR vendedor_id = auth.uid()) WITH CHECK (public.is_staff());
CREATE POLICY "sales_delete" ON public.sales FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER trg_sales_updated BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PLACAS ============
CREATE TABLE public.plate_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plate_types TO authenticated;
GRANT ALL ON public.plate_types TO service_role;
ALTER TABLE public.plate_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plate_types_select" ON public.plate_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "plate_types_admin" ON public.plate_types FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.plate_types (nome, slug) VALUES
 ('Google Avaliações','google'),('WhatsApp','whatsapp'),('Instagram','instagram'),
 ('Cardápio','cardapio'),('Site','site'),('Wi-Fi','wifi'),
 ('Link personalizado','link'),('Outro','outro');

CREATE OR REPLACE FUNCTION public.generate_public_id()
RETURNS TEXT LANGUAGE plpgsql VOLATILE SET search_path = public AS $$
DECLARE chars TEXT := 'abcdefghijkmnpqrstuvwxyz23456789'; out TEXT := ''; i INT;
BEGIN
  FOR i IN 1..10 LOOP
    out := out || substr(chars, 1 + floor(random()*length(chars))::int, 1);
  END LOOP;
  RETURN out;
END; $$;

CREATE TABLE public.plates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL UNIQUE DEFAULT public.generate_public_id(),
  codigo_interno TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  plate_type_id UUID REFERENCES public.plate_types(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  data_venda DATE,
  data_ativacao DATE,
  status TEXT NOT NULL DEFAULT 'producao',
  destination_url TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_plates_client ON public.plates(client_id);
CREATE INDEX idx_plates_public_id ON public.plates(public_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plates TO authenticated;
GRANT ALL ON public.plates TO service_role;
ALTER TABLE public.plates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plates_select" ON public.plates FOR SELECT TO authenticated
  USING (public.is_staff() OR public.owns_client(client_id));
CREATE POLICY "plates_insert" ON public.plates FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "plates_update" ON public.plates FOR UPDATE TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "plates_delete" ON public.plates FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER trg_plates_updated BEFORE UPDATE ON public.plates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.destination_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_id UUID NOT NULL REFERENCES public.plates(id) ON DELETE CASCADE,
  url_anterior TEXT,
  url_nova TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dest_hist_plate ON public.destination_history(plate_id);
GRANT SELECT ON public.destination_history TO authenticated;
GRANT ALL ON public.destination_history TO service_role;
ALTER TABLE public.destination_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dest_hist_select" ON public.destination_history FOR SELECT TO authenticated
  USING (public.is_staff() OR EXISTS (SELECT 1 FROM public.plates p WHERE p.id = plate_id AND public.owns_client(p.client_id)));

CREATE OR REPLACE FUNCTION public.log_destination_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.destination_url IS DISTINCT FROM OLD.destination_url THEN
    INSERT INTO public.destination_history (plate_id, url_anterior, url_nova, changed_by)
    VALUES (NEW.id, OLD.destination_url, NEW.destination_url, auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_plate_destination AFTER UPDATE ON public.plates
FOR EACH ROW EXECUTE FUNCTION public.log_destination_change();

-- ============ ACCESS EVENTS (analytics) ============
CREATE TABLE public.access_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_id UUID NOT NULL REFERENCES public.plates(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('nfc','qr','direct')),
  destination_url_snapshot TEXT,
  user_agent TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_access_events_plate ON public.access_events(plate_id);
CREATE INDEX idx_access_events_created ON public.access_events(created_at);
CREATE INDEX idx_access_events_client ON public.access_events(client_id);
GRANT SELECT ON public.access_events TO authenticated;
GRANT ALL ON public.access_events TO service_role;
ALTER TABLE public.access_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "access_events_select" ON public.access_events FOR SELECT TO authenticated
  USING (public.is_staff() OR public.owns_client(client_id));

-- ============ REVIEW SNAPSHOTS ============
CREATE TABLE public.review_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  total_reviews INTEGER NOT NULL,
  rating NUMERIC(3,2),
  fonte TEXT NOT NULL DEFAULT 'manual',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_review_snap_client ON public.review_snapshots(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_snapshots TO authenticated;
GRANT ALL ON public.review_snapshots TO service_role;
ALTER TABLE public.review_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_snap_select" ON public.review_snapshots FOR SELECT TO authenticated
  USING (public.is_staff() OR public.owns_client(client_id));
CREATE POLICY "review_snap_write" ON public.review_snapshots FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ============ RELATÓRIOS ============
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  dados JSONB,
  share_id TEXT NOT NULL UNIQUE DEFAULT public.generate_public_id(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_select" ON public.reports FOR SELECT TO authenticated
  USING (public.is_staff() OR public.owns_client(client_id));
CREATE POLICY "reports_write" ON public.reports FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ============ NOTIFICAÇÕES ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  tipo TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());