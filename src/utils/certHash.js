import { ethers } from "ethers";

/**
 * Deterministic certificate hash.
 * Input order is fixed — must never change, as stored hashes depend on it.
 *
 * Fields used (all lowercased + trimmed for safety):
 *   enrolmentNumber | studentName | degree | fieldOfStudy | university | year
 *
 * Returns a 0x-prefixed keccak256 hex string (same as ethers v6 style).
 */
export function generateCertHash({ enrolmentNumber, studentName, degree, fieldOfStudy, university, year }) {
  const raw = [
    String(enrolmentNumber  ?? "").trim().toLowerCase(),
    String(studentName      ?? "").trim().toLowerCase(),
    String(degree           ?? "").trim().toLowerCase(),
    String(fieldOfStudy     ?? "").trim().toLowerCase(),
    String(university       ?? "").trim().toLowerCase(),
    String(year             ?? "").trim(),
  ].join("|");

  return ethers.keccak256(ethers.toUtf8Bytes(raw));
}

/**
 * Human-readable Certificate ID (not used for hashing — display only).
 */
export function generateCertId(studentName, enrolmentNumber, year) {
  const initials = String(studentName)
    .split(" ")
    .map(w => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 3);
  return `CERT-${initials}-${year}-${String(enrolmentNumber).slice(-4).toUpperCase()}`;
}
