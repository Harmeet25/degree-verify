// ─────────────────────────────────────────────────────────
//  STEP AFTER REDEPLOY:
//  1. Deploy DegreeCertificate.sol in Remix on Sepolia
//  2. Copy the deployed contract address (0x...)
//  3. Paste it below as CONTRACT_ADDRESS
//  4. Clear localStorage: DevTools → Application → Local Storage → Clear All
//  5. npm run dev  (or push to Vercel)
// ─────────────────────────────────────────────────────────

export const CONTRACT_ADDRESS = "0x9fBcF276AAE5ED13c2a8FA115DBfEc339f9c045d"; // ← REPLACE with new address after redeploy

export const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "address[]", "name": "_students",     "type": "address[]" },
      { "internalType": "string[]",  "name": "_enrolments",   "type": "string[]"  },
      { "internalType": "string[]",  "name": "_names",        "type": "string[]"  },
      { "internalType": "string[]",  "name": "_degrees",      "type": "string[]"  },
      { "internalType": "string[]",  "name": "_fields",       "type": "string[]"  },
      { "internalType": "string[]",  "name": "_universities", "type": "string[]"  },
      { "internalType": "uint256[]", "name": "_years",        "type": "uint256[]" },
      { "internalType": "string[]",  "name": "_certHashes",   "type": "string[]"  },
      { "internalType": "string[]",  "name": "_certIds",      "type": "string[]"  }
    ],
    "name": "batchIssueCertificates",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_issuer", "type": "address" }],
    "name": "authoriseIssuer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_certHash", "type": "string" }],
    "name": "verifyCertificate",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_enrolment", "type": "string" },
      { "internalType": "string", "name": "_hash",      "type": "string" }
    ],
    "name": "verifyCertificateHash",
    "outputs": [
      { "internalType": "bool", "name": "authentic", "type": "bool" },
      { "internalType": "bool", "name": "exists",    "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_enrolment", "type": "string" }],
    "name": "getCertificateByEnrolment",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "issuer",           "type": "address" },
          { "internalType": "address", "name": "student",          "type": "address" },
          { "internalType": "string",  "name": "enrolmentNumber",  "type": "string"  },
          { "internalType": "string",  "name": "studentName",      "type": "string"  },
          { "internalType": "string",  "name": "degree",           "type": "string"  },
          { "internalType": "string",  "name": "fieldOfStudy",     "type": "string"  },
          { "internalType": "string",  "name": "university",       "type": "string"  },
          { "internalType": "uint256", "name": "year",             "type": "uint256" },
          { "internalType": "string",  "name": "certHash",         "type": "string"  },
          { "internalType": "string",  "name": "certId",           "type": "string"  },
          { "internalType": "uint256", "name": "timestamp",        "type": "uint256" },
          { "internalType": "bool",    "name": "isValid",          "type": "bool"    }
        ],
        "internalType": "struct DegreeCertificate.Certificate",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCertificates",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "issuer",           "type": "address" },
          { "internalType": "address", "name": "student",          "type": "address" },
          { "internalType": "string",  "name": "enrolmentNumber",  "type": "string"  },
          { "internalType": "string",  "name": "studentName",      "type": "string"  },
          { "internalType": "string",  "name": "degree",           "type": "string"  },
          { "internalType": "string",  "name": "fieldOfStudy",     "type": "string"  },
          { "internalType": "string",  "name": "university",       "type": "string"  },
          { "internalType": "uint256", "name": "year",             "type": "uint256" },
          { "internalType": "string",  "name": "certHash",         "type": "string"  },
          { "internalType": "string",  "name": "certId",           "type": "string"  },
          { "internalType": "uint256", "name": "timestamp",        "type": "uint256" },
          { "internalType": "bool",    "name": "isValid",          "type": "bool"    }
        ],
        "internalType": "struct DegreeCertificate.Certificate[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalCertificates",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "authorisedIssuers",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
];
