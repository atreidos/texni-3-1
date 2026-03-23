-- ============================================================
-- Bucket "documents" для хранения PDF/DOCX
-- Путь: {user_id}/{document_id}/{filename}
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'documents',
  'documents',
  false,
  52428800
) ON CONFLICT (id) DO NOTHING;

-- RLS: пользователь может загружать только в свою папку (первый сегмент пути = auth.uid())
CREATE POLICY "documents_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "documents_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "documents_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
