import type { FieldError } from "./validation-response.ts";

const INN_REGEX = /^\d{10}$|^\d{12}$/;
const KPP_REGEX = /^\d{9}$/;
const OGRN_REGEX = /^\d{13}$|^\d{15}$/;
const BIK_REGEX = /^\d{9}$/;
const ACCOUNT_REGEX = /^\d{20}$/;

/** Собирает все ошибки реквизитов организации (поля совпадают с ключами ошибок на фронте). */
export function collectOrgFormErrors(form: Record<string, unknown>): FieldError[] {
  const errors: FieldError[] = [];

  const name = String(form?.name ?? "").trim();
  if (!name) {
    errors.push({ field: "name", message: "Название организации обязательно" });
  }

  const inn = String(form?.inn ?? "").trim();
  if (!inn) {
    errors.push({ field: "inn", message: "ИНН обязателен" });
  } else if (!INN_REGEX.test(inn)) {
    errors.push({ field: "inn", message: "ИНН — 10 цифр (юрлицо) или 12 цифр (ИП)" });
  }

  const ogrn = String(form?.ogrn ?? "").trim();
  if (!ogrn) {
    errors.push({ field: "ogrn", message: "ОГРН обязателен" });
  } else if (!OGRN_REGEX.test(ogrn)) {
    errors.push({ field: "ogrn", message: "ОГРН — 13 цифр (юрлицо) или 15 цифр (ИП)" });
  }

  const kpp = form?.kpp ? String(form.kpp).trim() : null;
  if (kpp && !KPP_REGEX.test(kpp)) {
    errors.push({ field: "kpp", message: "КПП — 9 цифр" });
  }

  const bank = form?.bank && typeof form.bank === "object" && form.bank !== null
    ? form.bank as Record<string, unknown>
    : null;
  const bik = bank ? String(bank.bik ?? "").trim() : "";
  if (bik !== "" && !BIK_REGEX.test(bik)) {
    errors.push({ field: "bik", message: "БИК — 9 цифр" });
  }

  const checkingAccount = bank ? String(bank.checkingAccount ?? "").trim() : "";
  if (checkingAccount !== "" && !ACCOUNT_REGEX.test(checkingAccount)) {
    errors.push({ field: "checkingAccount", message: "Расчётный счёт — 20 цифр" });
  }

  const correspondentAccount = bank ? String(bank.correspondentAccount ?? "").trim() : "";
  if (correspondentAccount !== "" && !ACCOUNT_REGEX.test(correspondentAccount)) {
    errors.push({ field: "correspondentAccount", message: "Корр. счёт — 20 цифр" });
  }

  return errors;
}
