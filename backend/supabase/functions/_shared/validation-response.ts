/**
 * Единый JSON для ошибок валидации (400):
 * - одна ошибка: { error, field }
 * - несколько: { error, field, errors: [{ field, message }, ...] }
 *   (field/error — первая ошибка для обратной совместимости)
 */
export type FieldError = { field: string; message: string };

export type ValidationErrorBody = {
  error: string;
  field?: string;
  errors?: FieldError[];
};

export function validation400(
  cors: Record<string, string>,
  fieldErrors: FieldError[],
): Response {
  if (fieldErrors.length === 0) {
    return new Response(
      JSON.stringify({ error: "Ошибка валидации" } satisfies ValidationErrorBody),
      { status: 400, headers: cors },
    );
  }
  const first = fieldErrors[0];
  const body: ValidationErrorBody = {
    error: first.message,
    field: first.field,
  };
  if (fieldErrors.length > 1) {
    body.errors = fieldErrors;
  }
  return new Response(JSON.stringify(body), { status: 400, headers: cors });
}

export function validation400One(
  cors: Record<string, string>,
  field: string,
  message: string,
): Response {
  return validation400(cors, [{ field, message }]);
}
