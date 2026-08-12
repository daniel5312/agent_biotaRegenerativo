-- =================================================================================
-- BIO-101: Esquema Maestro de Biota Protocol (ReFi)
-- Motor: PostgreSQL (Supabase)
-- =================================================================================

-- 1. TABLA: Usuarios (Web2 -> Web3)
CREATE TABLE public.users (
    wallet_address text PRIMARY KEY,
    nombre_completo text,
    telefono text,
    rol text DEFAULT 'campesino',
    tipo_billetera text,
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA: BiotaPassport (La Finca / Identidad)
CREATE TABLE public.biota_passports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_owner text NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
    onchain_token_id integer UNIQUE, -- ID en Celo
    finca_nombre text,
    ubicacion text,
    area_hectareas numeric,
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA: Onboarding (El Oráculo IA)
CREATE TABLE public.onboarding_diagnostics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    passport_id uuid NOT NULL REFERENCES public.biota_passports(id) ON DELETE CASCADE,
    historial_quimicos text,
    fuentes_agua text,
    cultivos_asociados text,
    analisis_ia_resumen text,
    fecha_entrevista timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA: Etapas (ERC-6551 Hijos y Micro-Carbono)
CREATE TABLE public.passport_stages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    passport_id uuid NOT NULL REFERENCES public.biota_passports(id) ON DELETE CASCADE,
    etapa_numero integer NOT NULL, 
    kilogramos_carbono_capturado numeric DEFAULT 0, -- Métrica ReFi
    sha256_data_hash text, -- Ancla Criptográfica
    ipfs_pdf_url text, -- Link al documento original
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLA: Laboratorio (La Ciencia Pesada)
CREATE TABLE public.laboratory_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_id uuid NOT NULL REFERENCES public.passport_stages(id) ON DELETE CASCADE,
    
    -- Físico-Química
    materia_organica_porcentaje numeric,
    ph numeric,
    cice numeric,
    textura_clase text,
    
    -- Microbiología (Tu Lista Dorada flexible)
    microorganismos_jsonb jsonb DEFAULT '{}'::jsonb,
    
    observaciones_laboratorio text,
    laboratorio_nombre text DEFAULT 'Safer Agrobiológicos SAS',
    fecha_muestreo date
);

-- =================================================================================
-- HABILITACIÓN DE SEGURIDAD RLS (Row Level Security)
-- =================================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biota_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratory_results ENABLE ROW LEVEL SECURITY;

-- Políticas temporales para la fase de desarrollo (Permite todo el tráfico).
-- Nota: En producción, ajustaremos esto para que solo el Agente 8004 pueda escribir.
CREATE POLICY "Public Access" ON public.users FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.biota_passports FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.onboarding_diagnostics FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.passport_stages FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.laboratory_results FOR ALL USING (true);
