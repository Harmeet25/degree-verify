// ─────────────────────────────────────────────────────────────────────────────
// After deploying DegreeCertificate.sol in Remix IDE on Sepolia,
// paste your contract address below.
// ─────────────────────────────────────────────────────────────────────────────

export const CONTRACT_ADDRESS = "0x72eB4fDf85007eE60e4bB7BfF2DB6DdDeB80bA73";

export const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_student", "type": "address" },
      { "internalType": "string",  "name": "_studentName", "type": "string" },
      { "internalType": "string",  "name": "_degree", "type": "string" },
      { "internalType": "string",  "name": "_fieldOfStudy", "type": "string" },
      { "internalType": "string",  "name": "_university", "type": "string" },
      { "internalType": "uint256", "name": "_year", "type": "uint256" },
      { "internalType": "string",  "name": "_certHash", "type": "string" }
    ],
    "name": "issueCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_student", "type": "address" }],
    "name": "getCertificatesByStudent",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "issuer",      "type": "address" },
          { "internalType": "address", "name": "student",     "type": "address" },
          { "internalType": "string",  "name": "studentName", "type": "string" },
          { "internalType": "string",  "name": "degree",      "type": "string" },
          { "internalType": "string",  "name": "fieldOfStudy","type": "string" },
          { "internalType": "string",  "name": "university",  "type": "string" },
          { "internalType": "uint256", "name": "year",        "type": "uint256" },
          { "internalType": "string",  "name": "certHash",    "type": "string" },
          { "internalType": "uint256", "name": "timestamp",   "type": "uint256" },
          { "internalType": "bool",    "name": "isValid",     "type": "bool" }
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
    "name": "getAllCertificates",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "issuer",      "type": "address" },
          { "internalType": "address", "name": "student",     "type": "address" },
          { "internalType": "string",  "name": "studentName", "type": "string" },
          { "internalType": "string",  "name": "degree",      "type": "string" },
          { "internalType": "string",  "name": "fieldOfStudy","type": "string" },
          { "internalType": "string",  "name": "university",  "type": "string" },
          { "internalType": "uint256", "name": "year",        "type": "uint256" },
          { "internalType": "string",  "name": "certHash",    "type": "string" },
          { "internalType": "uint256", "name": "timestamp",   "type": "uint256" },
          { "internalType": "bool",    "name": "isValid",     "type": "bool" }
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
    "inputs": [{ "internalType": "string", "name": "_certHash", "type": "string" }],
    "name": "verifyCertificate",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalCertificates",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];
