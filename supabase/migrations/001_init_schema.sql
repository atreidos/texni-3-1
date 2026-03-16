-- DocFlow — базовая схема Supabase (PostgreSQL + RLS + триггеры)
-- Эта миграция соответствует содержимому документа SQL.md.
-- Порядок: функции > таблицы > триггеры > RLS > индексы.

-- ============================================================
-- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
-- ============================================================

-- Алиас для auth.uid() — удобство при написании RLS-политик
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT auth.uid();
$$;

-- Возвращает текущий тариф авторизованного пользователя.
-- LANGUAGE plpgsql — тело функции не проверяется до вызова,
-- поэтому функцию можно объявить до создания таблицы profiles.
CREATE OR REPLACE FUNCTION current_user_plan()
RETURNS text
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_plan text;
BEGIN
  SELECT plan INTO v_plan
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN v_plan;
END;
$$;

-- Проверяет, входит ли тариф пользователя в переданный список.
-- Пример: has_plan(ARRAY['pro','business'])
CREATE OR REPLACE FUNCTION has_plan(plans text[])
RETURNS boolean
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_plan text;
BEGIN
  SELECT plan INTO v_plan
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN v_plan = ANY(plans);
END;
$$;

-- Функция-триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Функция-триггер: создаёт профиль при регистрации нового пользователя
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Функция-триггер: обновляет счётчик docs_used в профиле
-- при добавлении или удалении документа
CREATE OR REPLACE FUNCTION handle_docs_used_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET docs_used = docs_used + 1
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET docs_used = GREATEST(docs_used - 1, 0)
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
END;
$$;


-- ============================================================
-- ТАБЛИЦЫ
-- ============================================================

-- -----------------------------------------------------------
-- Профили пользователей
-- id ссылается на auth.users — Supabase управляет паролями
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text          NOT NULL DEFAULT '',
  email         text          NOT NULL DEFAULT '',
  phone         text,
  avatar        text,
  plan          text          NOT NULL DEFAULT 'free'
                              CHECK (plan IN ('free', 'pro', 'business')),
  plan_expires  date,
  docs_used     integer       NOT NULL DEFAULT 0  CHECK (docs_used >= 0),
  docs_limit    integer       NOT NULL DEFAULT 3  CHECK (docs_limit >= 0),
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- Организации пользователя
-- Валидация российских реквизитов через регулярные выражения
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  text        NOT NULL,
  inn                   text        NOT NULL CHECK (inn ~ '^\d{10}$|^\d{12}$'),
  kpp                   text        CHECK (kpp IS NULL OR kpp ~ '^\d{9}$'),
  ogrn                  text        NOT NULL CHECK (ogrn ~ '^\d{13}$|^\d{15}$'),
  address               text,
  phone                 text,
  email                 text,
  is_main               boolean     NOT NULL DEFAULT false,
  -- Банковские реквизиты (необязательные)
  bank_bik              text        CHECK (bank_bik IS NULL OR bank_bik ~ '^\d{9}$'),
  bank_name             text,
  checking_account      text        CHECK (checking_account IS NULL OR checking_account ~ '^\d{20}$'),
  correspondent_account text        CHECK (correspondent_account IS NULL OR correspondent_account ~ '^\d{20}$'),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- Документы пользователя
-- organization_id — необязательная привязка к организации
-- file_path — путь к файлу в Supabase Storage
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid        REFERENCES public.organizations(id) ON DELETE SET NULL,
  name            text        NOT NULL,
  type            text        NOT NULL CHECK (type IN ('pdf', 'docx')),
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'filled', 'signed')),
  file_path       text,
  size_bytes      integer     CHECK (size_bytes IS NULL OR size_bytes >= 0),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- Поля документа (ключ-значение с группировкой)
-- group_name: 'organization' | 'contractor' | 'other'
-- UNIQUE (document_id, field_key) — один ключ на документ
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_fields (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid        NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  field_key   text        NOT NULL,
  group_name  text        NOT NULL CHECK (group_name IN ('organization', 'contractor', 'other')),
  label       text        NOT NULL,
  value       text        NOT NULL DEFAULT '',
  type        text        NOT NULL CHECK (type IN ('text', 'date', 'number')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, field_key)
);

-- -----------------------------------------------------------
-- История платежей
-- INSERT/UPDATE разрешён только через service_role (бэкенд/вебхук),
-- обычный пользователь вставлять платежи не может
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan       text          NOT NULL CHECK (plan IN ('free', 'pro', 'business')),
  amount     numeric(10,2) NOT NULL CHECK (amount >= 0),
  status     text          NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('success', 'pending', 'failed')),
  paid_at    timestamptz,
  created_at timestamptz   NOT NULL DEFAULT now(),
  updated_at timestamptz   NOT NULL DEFAULT now()
);


-- ============================================================
-- ТРИГГЕРЫ
-- ============================================================

-- Автосоздание профиля при регистрации через auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Обновление updated_at: profiles
DROP TRIGGER IF EXISTS trg_updated_at_profiles ON public.profiles;
CREATE TRIGGER trg_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Обновление updated_at: organizations
DROP TRIGGER IF EXISTS trg_updated_at_organizations ON public.organizations;
CREATE TRIGGER trg_updated_at_organizations
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Обновление updated_at: documents
DROP TRIGGER IF EXISTS trg_updated_at_documents ON public.documents;
CREATE TRIGGER trg_updated_at_documents
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Обновление updated_at: document_fields
DROP TRIGGER IF EXISTS trg_updated_at_document_fields ON public.document_fields;
CREATE TRIGGER trg_updated_at_document_fields
  BEFORE UPDATE ON public.document_fields
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Обновление updated_at: payments
DROP TRIGGER IF EXISTS trg_updated_at_payments ON public.payments;
CREATE TRIGGER trg_updated_at_payments
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Автообновление счётчика docs_used при создании/удалении документа
DROP TRIGGER IF EXISTS trg_docs_counter_insert ON public.documents;
CREATE TRIGGER trg_docs_counter_insert
  AFTER INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION handle_docs_used_counter();

DROP TRIGGER IF EXISTS trg_docs_counter_delete ON public.documents;
CREATE TRIGGER trg_docs_counter_delete
  AFTER DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION handle_docs_used_counter();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- -----------------------------------------------------------
-- profiles
-- Анонимный пользователь не имеет доступа ни к чему.
-- INSERT намеренно отсутствует — профиль создаётся только триггером.
-- -----------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- -----------------------------------------------------------
-- organizations
-- -----------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select_own" ON public.organizations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "organizations_insert_own" ON public.organizations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "organizations_update_own" ON public.organizations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "organizations_delete_own" ON public.organizations
  FOR DELETE USING (user_id = auth.uid());

-- -----------------------------------------------------------
-- documents
-- При INSERT проверяем, что organization_id (если указан)
-- принадлежит тому же пользователю.
-- -----------------------------------------------------------
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_own" ON public.documents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "documents_insert_own" ON public.documents
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.organizations
        WHERE id = organization_id
          AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "documents_update_own" ON public.documents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "documents_delete_own" ON public.documents
  FOR DELETE USING (user_id = auth.uid());

-- -----------------------------------------------------------
-- document_fields
-- Доступ через принадлежность родительского документа.
-- -----------------------------------------------------------
ALTER TABLE public.document_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_fields_select_own" ON public.document_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = document_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "document_fields_insert_own" ON public.document_fields
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = document_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "document_fields_update_own" ON public.document_fields
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = document_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "document_fields_delete_own" ON public.document_fields
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = document_id AND user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------
-- payments
-- Пользователь видит только свои платежи.
-- INSERT/UPDATE/DELETE — только через service_role (бэкенд/платёжный вебхук).
-- -----------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (user_id = auth.uid());


-- ============================================================
-- ИНДЕКСЫ
-- ============================================================

-- organizations
CREATE INDEX IF NOT EXISTS idx_organizations_user_id
  ON public.organ