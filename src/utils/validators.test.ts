import test, { describe } from "node:test";
import {
  isEmpty,
  isValidEmail,
  doEmailsMatch,
  isValidPhone,
  isValidZip,
  isDateInFuture,
  isDateAtLeast48HoursAhead,
  isDateWithinTwoYears,
  formatCurrency,
  formatPhoneNumber,
} from "./validators";

describe("validators", () => {
  test("isEmpty", () => {
    expect(isEmpty("")).toBe(true);
    expect(isEmpty("   ")).toBe(true);
    expect(isEmpty("abc")).toBe(false);
  });

  test("isValidEmail", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
  });

  test("doEmailsMatch", () => {
    expect(doEmailsMatch("A@b.com", "a@B.com")).toBe(true);
    expect(doEmailsMatch("a@b.com", "c@d.com")).toBe(false);
  });

  test("isValidPhone", () => {
    expect(isValidPhone("123-456-7890")).toBe(true);
    expect(isValidPhone("(123) 456-7890")).toBe(true);
    expect(isValidPhone("1234567890")).toBe(true);
    expect(isValidPhone("12345")).toBe(false);
  });

  test("isValidZip", () => {
    expect(isValidZip("12345")).toBe(true);
    expect(isValidZip("12345-6789")).toBe(true);
    expect(isValidZip("1234")).toBe(false);
  });

  test("isDateInFuture", () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    expect(isDateInFuture(today)).toBe(true);
    expect(isDateInFuture(tomorrow)).toBe(true);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    expect(isDateInFuture(yesterday)).toBe(false);
  });

  test("isDateAtLeast48HoursAhead", () => {
    const now = new Date();
    const in47h = new Date(now.getTime() + 47 * 60 * 60 * 1000);
    const in49h = new Date(now.getTime() + 49 * 60 * 60 * 1000);
    expect(isDateAtLeast48HoursAhead(in47h)).toBe(false);
    expect(isDateAtLeast48HoursAhead(in49h)).toBe(true);
  });

  test("isDateWithinTwoYears", () => {
    const now = new Date();
    const in1y = new Date(now);
    in1y.setFullYear(now.getFullYear() + 1);
    const in3y = new Date(now);
    in3y.setFullYear(now.getFullYear() + 3);
    expect(isDateWithinTwoYears(in1y)).toBe(true);
    expect(isDateWithinTwoYears(in3y)).toBe(false);
  });

  test("formatCurrency", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  test("formatPhoneNumber", () => {
    expect(formatPhoneNumber("1234567890")).toBe("(123) 456-7890");
    expect(formatPhoneNumber("12345")).toBe("12345");
  });
});
function expect(arg0: boolean) {
  throw new Error("Function not implemented.");
}

