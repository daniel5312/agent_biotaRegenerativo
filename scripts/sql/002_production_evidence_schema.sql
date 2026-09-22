-- BIO-MVP: producción regenerativa, recetas, insumos, trabajo y evidencias.
-- Usa la misma base PostgreSQL de Supabase. Los binarios viven en Storage.

CREATE TABLE IF NOT EXISTS public.production_records (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    passport_id uuid REFERENCES public.biota_passports(id) ON DELETE CASCADE,
    wallet_address text NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
    nombre_proceso text NOT NULL,
    cultivo_producto text,
    temporada text,
    estado text NOT NULL DEFAULT 'EN_CURSO'
        CHECK (estado IN ('PLANIFICADO', 'EN_CURSO', 'COMPLETADO', 'EN_REVISION')),
    fecha_inicio date,
    fecha_fin date,
    resumen text,
    creado_en timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS production_records_wallet_idx
    ON public.production_records (wallet_address, creado_en DESC);

CREATE TABLE IF NOT EXISTS public.regenerative_recipes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    production_id uuid REFERENCES public.production_records(id) ON DELETE CASCADE,
    wallet_address text NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
    nombre text NOT NULL,
    objetivo text,
    version integer NOT NULL DEFAULT 1,
    instrucciones text,
    preparacion_fecha date,
    observaciones text,
    creado_en timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.recipe_inputs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id uuid NOT NULL REFERENCES public.regenerative_recipes(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    categoria text NOT NULL DEFAULT 'BIOINSUMO',
    cantidad numeric,
    unidad text,
    origen text,
    es_regenerativo boolean NOT NULL DEFAULT true,
    lote_proveedor text,
    observaciones text
);

CREATE TABLE IF NOT EXISTS public.work_processes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    production_id uuid NOT NULL REFERENCES public.production_records(id) ON DELETE CASCADE,
    orden integer NOT NULL DEFAULT 1,
    nombre text NOT NULL,
    descripcion text NOT NULL,
    trabajador_wallet text REFERENCES public.users(wallet_address),
    trabajadores_count integer NOT NULL DEFAULT 1 CHECK (trabajadores_count > 0),
    horas_trabajadas numeric CHECK (horas_trabajadas IS NULL OR horas_trabajadas >= 0),
    herramientas text,
    realizado_en timestamptz,
    estado text NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'REPORTADO', 'VERIFICADO', 'RECHAZADO')),
    creado_en timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- La tabla creada por 001/evidencias.sql se amplía para enlazar cada archivo
-- con la ficha técnica y con el trabajo documentado.
ALTER TABLE public.producer_evidence
    ADD COLUMN IF NOT EXISTS production_id uuid REFERENCES public.production_records(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS process_id uuid REFERENCES public.work_processes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS recipe_id uuid REFERENCES public.regenerative_recipes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS captured_latitude numeric,
    ADD COLUMN IF NOT EXISTS captured_longitude numeric,
    ADD COLUMN IF NOT EXISTS reviewed_by text,
    ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
    ADD COLUMN IF NOT EXISTS review_notes text;

CREATE INDEX IF NOT EXISTS producer_evidence_production_idx
    ON public.producer_evidence (production_id, created_at DESC);

CREATE INDEX IF NOT EXISTS work_processes_production_idx
    ON public.work_processes (production_id, orden);

ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regenerative_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_processes ENABLE ROW LEVEL SECURITY;

-- Políticas de desarrollo MVP. Sustituir por políticas basadas en auth.uid()
-- cuando la identidad Supabase quede conectada a las wallets.
CREATE POLICY "Public production records MVP" ON public.production_records
    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public recipes MVP" ON public.regenerative_recipes
    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public recipe inputs MVP" ON public.recipe_inputs
    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public work processes MVP" ON public.work_processes
    FOR ALL USING (true) WITH CHECK (true);
