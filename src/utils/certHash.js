import { ethers } from "ethers";

/**
 * DETERMINISTIC certificate hash.
 * 
 * Fields: enrolmentNumber | studentName | degree | fieldOfStudy | university | year
 * All trimmed + lowercased so casing differences don't break matching.
 * 
 * This EXACT function must be used in both Admin (issuance) and Employer (verification).
 * The contract stores the output of this function as cert.certHash.
 * verifyCertificate(hash) looks it up directly in hashToIndex — no enrolment mapping needed.
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
 * Human-readable Certificate ID (display only, not used for verification).
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
