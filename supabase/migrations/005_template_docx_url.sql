ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS template_docx_url text;

COMMENT ON COLUMN templates.template_docx_url IS
  'Signed URL of the normalized .docx with {{placeholders}} for docxtemplater fill at signing time.';
