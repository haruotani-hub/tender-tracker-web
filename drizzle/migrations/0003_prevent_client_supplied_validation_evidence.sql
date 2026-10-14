CREATE OR REPLACE FUNCTION public.register_tcv_creation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; t timestamptz := clock_timestamp();
BEGIN
 IF auth.uid() IS NULL OR NEW.responsavel_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Autenticação individual obrigatória'; END IF;
 SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
 IF p.id IS NULL OR btrim(p.nome) !~ '\S+\s+\S+' OR p.matricula !~ '^C[0-9]{6}$' THEN RAISE EXCEPTION 'Complete nome e matrícula Caixa no perfil'; END IF;
 UPDATE public.conferencias SET validacao = NULL, criado_em = t, dados = jsonb_set(NEW.dados, '{session,validacaoCaixa}', jsonb_build_object('nome',p.nome,'matricula',p.matricula,'responsavelId',p.id,'validadoEm',t,'autenticacao','individual')) WHERE codigo = NEW.codigo;
 INSERT INTO public.validacao_auditoria(codigo,responsavel_id,nome,matricula,ato,concorda,registrado_em) VALUES (NEW.codigo,p.id,p.nome,p.matricula,'caixa',true,t);
 RETURN NEW;
END; $$;