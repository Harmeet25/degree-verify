import { ethers } from "ethers";

/**
 * Generates a deterministic certificate hash.
 * MUST be identical in Admin (issuance) and Employer (verification).
 * Field order and normalisation (trim + lowercase) must never change.
 */
export function generateCertHash({ enrolmentNumber, studentName, degree, fieldOfStudy, university, year }) {
  const raw = [
    String(enrolmentNumber ?? "").trim().toLowerCase(),
    String(studentName     ?? "").trim().toLowerCase(),
    String(degree          ?? "").trim().toLowerCase(),
    String(fieldOfStudy    ?? "").trim().toLowerCase(),
    String(university      ?? "").trim().toLowerCase(),
    String(year            ?? "").trim(),
  ].join("|");
  return ethers.keccak256(ethers.toUtf8Bytes(raw));
}

export function generateCertId(studentName, enrolmentNumber, year) {
  const initials = String(studentName).split(" ").map(w => w[0] ?? "").join("").toUpperCase().slice(0, 3);
  return `CERT-${initials}-${year}-${String(enrolmentNumber).slice(-4).toUpperCase()}`;
}
