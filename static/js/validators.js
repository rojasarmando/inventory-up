/**
 * validators.js — client-side mirrors of the REGLAS.md validation rules.
 *
 * The same rules are enforced server-side (app/schemas.py); these helpers
 * only improve UX by flagging problems before the request is sent.
 *
 * Rules:
 *   name/question: letters only (spaces and accents allowed)
 *   nick: 8-12 chars, letters+numbers, at least 1 special, 1 letter, 1 number
 *   password: 8-12 chars, at least 1 special, 1 letter, 1 number
 *   cedula: 7-8 digits | rif: 7-12 digits | phone: 11 digits
 */

const KajatacaValidators = (() => {
  const SPECIAL_CHARS = "!@#$%^&*_.-";

  const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,40}$/;
  const QUESTION_RE = /^[A-Za-z0-9 ]{6,50}$/;
  const CEDULA_RE = /^\d{7,8}$/;
  const RIF_RE = /^\d{7,12}$/;
  const PHONE_RE = /^\d{11}$/;

  function hasLetter(value) {
    return /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(value);
  }
  function hasDigit(value) {
    return /\d/.test(value);
  }
  function hasSpecial(value) {
    return value.split("").some((ch) => SPECIAL_CHARS.includes(ch));
  }

  /** Returns {valid: boolean, message: i18n key}. */
  function validateName(value) {
    const v = (value || "").trim();
    if (!NAME_RE.test(v)) return { valid: false, message: "error.invalid_name" };
    return { valid: true, message: "" };
  }

  function validateNick(value) {
    const v = (value || "").trim();
    const charsetOk =
      v.length >= 8 &&
      v.length <= 12 &&
      v.split("").every((ch) => /[A-Za-z0-9]/.test(ch) || SPECIAL_CHARS.includes(ch));
    if (!charsetOk || !hasLetter(v) || !hasDigit(v) || !hasSpecial(v)) {
      return { valid: false, message: "error.invalid_nick" };
    }
    return { valid: true, message: "" };
  }

  function validatePassword(value) {
    const v = value || "";
    if (v.length < 8 || v.length > 12) {
      return { valid: false, message: "error.invalid_password" };
    }
    if (!hasLetter(v) || !hasDigit(v) || !hasSpecial(v)) {
      return { valid: false, message: "error.invalid_password" };
    }
    return { valid: true, message: "" };
  }

  function validateCedula(value) {
    const v = (value || "").trim();
    if (!CEDULA_RE.test(v)) return { valid: false, message: "error.invalid_cedula" };
    return { valid: true, message: "" };
  }

  function validateRif(value) {
    const v = (value || "").trim();
    if (!RIF_RE.test(v)) return { valid: false, message: "error.invalid_rif" };
    return { valid: true, message: "" };
  }

  function validatePhone(value) {
    const v = (value || "").trim();
    if (!PHONE_RE.test(v)) return { valid: false, message: "error.invalid_phone" };
    return { valid: true, message: "" };
  }

  function validateQuestion(value) {
    const v = (value || "").trim();
    if (!QUESTION_RE.test(v)) return { valid: false, message: "error.invalid_question" };
    return { valid: true, message: "" };
  }

  // The original REGLAS.md has no rule for the recovery answer; keep a light
  // client-side rule (3-50 chars, letters/numbers/spaces) for good UX.
  const ANSWER_RE = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ ]{3,50}$/;

  function validateAnswer(value) {
    const v = (value || "").trim();
    if (!ANSWER_RE.test(v)) return { valid: false, message: "error.invalid_question" };
    return { valid: true, message: "" };
  }

  /** Price must be a finite number >= 0. */
  function validatePrice(value) {
    const n = Number(value);
    if (value === "" || !Number.isFinite(n) || n < 0) {
      return { valid: false, message: "error.invalid_price" };
    }
    return { valid: true, message: "" };
  }

  /** Tax rate must be a finite number in [0, 100]. */
  function validateTaxRate(value) {
    const n = Number(value);
    if (value === "" || !Number.isFinite(n) || n < 0 || n > 100) {
      return { valid: false, message: "error.invalid_tax_rate" };
    }
    return { valid: true, message: "" };
  }

  /** Stock must be an integer >= 0. */
  function validateStock(value) {
    const n = Number(value);
    if (value === "" || !Number.isInteger(n) || n < 0) {
      return { valid: false, message: "error.invalid_stock" };
    }
    return { valid: true, message: "" };
  }

  /** Movement quantity must be an integer > 0. */
  function validateQuantity(value) {
    const n = Number(value);
    if (value === "" || !Number.isInteger(n) || n <= 0) {
      return { valid: false, message: "error.invalid_quantity" };
    }
    return { valid: true, message: "" };
  }

  /** Unit price must be a finite number >= 0. */
  function validateUnitPrice(value) {
    const n = Number(value);
    if (value === "" || !Number.isFinite(n) || n < 0) {
      return { valid: false, message: "error.invalid_unit_price" };
    }
    return { valid: true, message: "" };
  }

  /** Mark a field as valid/invalid with a Bootstrap error feedback text. */
  function markField(input, result) {
    const wrapper = input.closest(".mb-3") || input.parentElement;
    input.classList.toggle("is-invalid", !result.valid);
    input.classList.toggle("is-valid", result.valid);
    let feedback = wrapper.querySelector(".invalid-feedback");
    if (feedback) {
      feedback.textContent = result.valid ? "" : KajatacaI18n.t(result.message);
    }
  }

  return {
    validateName,
    validateNick,
    validatePassword,
    validateCedula,
    validateRif,
    validatePhone,
    validateQuestion,
    validateAnswer,
    validatePrice,
    validateTaxRate,
    validateStock,
    validateQuantity,
    validateUnitPrice,
    markField,
  };
})();
