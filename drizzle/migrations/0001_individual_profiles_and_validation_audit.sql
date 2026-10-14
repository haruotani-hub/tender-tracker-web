CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 nome text NOT NULL DEFAULT '',
 matricula text NOT NULL DEFAULT '',
 criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read_own ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE FUNCTION public.create_tcv_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.profiles(id, nome, matricula) VALUES (NEW.id, coalesce(NEW.raw_user_meta_data->>'nome',''), coalesce(NEW.raw_user_meta_data->>'matricula',''));
 RETURN NEW;
END; $$;
CREATE TRIGGER create_tcv_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_tcv_profile();
ALTER TABLE public.conferencias ADD COLUMN responsavel_id uuid;
GRANT SELECT, INSERT ON public.conferencias TO authenticated;
GRANT ALL ON public.conferencias TO service_role;
CREATE POLICY conferences_read_own ON public.conferencias FOR SELECT TO authenticated USING (responsavel_id = auth.uid());
CREATE POLICY conferences_insert_own ON public.conferencias FOR INSERT TO authenticated WITH CHECK (responsavel_id = auth.uid());
CREATE TABLE public.validacao_auditoria (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 codigo text NOT NULL REFERENCES public.conferencias(codigo),
 responsavel_id uuid NOT NULL,
 nome text NOT NULL,
 matricula text NOT NULL,
 ato text NOT NULL,
 concorda boolean NOT NULL,
 justificativa text NOT NULL DEFAULT '',
 registrado_em timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(codigo, ato)
);
GRANT SELECT ON public.validacao_auditoria TO authenticated;
GRANT ALL ON public.validacao_auditoria TO service_role;
ALTER TABLE public.validacao_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_read_own ON public.validacao_auditoria FOR SELECT TO authenticated USING (responsavel_id = auth.uid());
CREATE FUNCTION public.register_tcv_creation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; t timestamptz := clock_timestamp();
BEGIN
 IF auth.uid() IS NULL OR NEW.responsavel_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Autenticação individual obrigatória'; END IF;
 SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
 IF p.id IS NULL OR btrim(p.nome) !~ '\S+\s+\S+' OR p.matricula !~ '^C[0-9]{6}$' THEN RAISE EXCEPTION 'Complete nome e matrícula Caixa no perfil'; END IF;
 NEW.dados := jsonb_set(NEW.dados, '{session,validacaoCaixa}', jsonb_build_object('nome',p.nome,'matricula',p.matricula,'responsavelId',p.id,'validadoEm',t,'autenticacao','individual'));
 INSERT INTO public.validacao_auditoria(codigo,responsavel_id,nome,matricula,ato,concorda,registrado_em) VALUES (NEW.codigo,p.id,p.nome,p.matricula,'caixa',true,t);
 RETURN NEW;
END; $$;
CREATE TRIGGER register_tcv_creation AFTER INSERT ON public.conferencias FOR EACH ROW EXECUTE FUNCTION public.register_tcv_creation();
CREATE FUNCTION public.validate_tcv_individual(p_codigo text, p_concorda boolean, p_justificativa text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; v jsonb; t timestamptz := clock_timestamp(); changed text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação individual obrigatória'; END IF;
 IF p_codigo !~ '^[A-Za-z0-9]{32}$' THEN RAISE EXCEPTION 'Código inválido'; END IF;
 IF p_concorda IS NULL OR length(coalesce(p_justificativa,'')) > 2000 OR (NOT p_concorda AND btrim(coalesce(p_justificativa,'')) = '') THEN RAISE EXCEPTION 'Justificativa obrigatória'; END IF;
 SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
 IF p.id IS NULL OR btrim(p.nome) !~ '\S+\s+\S+' OR btrim(p.matricula) = '' THEN RAISE EXCEPTION 'Complete nome e matrícula no perfil'; END IF;
 v := jsonb_build_object('concorda',p_concorda,'justificativa',CASE WHEN p_concorda THEN '' ELSE btrim(p_justificativa) END,'nome',p.nome,'matricula',p.matricula,'responsavelId',p.id,'validadoEm',t,'autenticacao','individual');
 UPDATE public.conferencias SET validacao = v WHERE codigo = p_codigo AND validacao IS NULL RETURNING codigo INTO changed;
 IF changed IS NULL THEN RAISE EXCEPTION 'Conferência não encontrada ou já validada'; END IF;
 INSERT INTO public.validacao_auditoria(codigo,responsavel_id,nome,matricula,ato,concorda,justificativa,registrado_em) VALUES (p_codigo,p.id,p.nome,p.matricula,'egttv',p_concorda,v->>'justificativa',t);
 RETURN v;
END; $$;
REVOKE ALL ON FUNCTION public.validate_tcv_individual(text,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_tcv_individual(text,boolean,text) TO authenticated;
REVOKE ALL ON FUNCTION public.register_tcv_creation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_tcv_profile() FROM PUBLIC;