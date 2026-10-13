CREATE TABLE public.conferencias (
  codigo text PRIMARY KEY CHECK (codigo ~ '^[A-Za-z0-9]{32}$'),
  dados jsonb NOT NULL,
  validacao jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.conferencias TO service_role;
ALTER TABLE public.conferencias ENABLE ROW LEVEL SECURITY;