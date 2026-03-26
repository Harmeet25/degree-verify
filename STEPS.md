# 🎓 DEGREE CERTIFICATE VERIFICATION — COMPLETE GUIDE
## Academic Credential Chain DApp (Blockchain)

---

## ══════════════════════════════════════════
## PART 1 — SETUP REACT FRONTEND
## ══════════════════════════════════════════

### STEP 1 — Prerequisites (same as Project 1)
- Node.js installed → nodejs.org
- VS Code installed
- MetaMask extension in browser
- Sepolia testnet ETH (from sepoliafaucet.com)

### STEP 2 — Create React Project
```bash
npm create vite@latest degree-verify -- --template react
cd degree-verify
npm install
npm install ethers
```

### STEP 3 — Copy All Files
Replace/create these files from the ZIP:
```
src/
  App.jsx
  App.css
  main.jsx
  contract.js              ← fill address after deploy
  components/
    Sidebar.jsx
  pages/
    Home.jsx
    Issue.jsx
    Verify.jsx
    Registry.jsx
index.html
package.json
vite.config.js
DegreeCertificate.sol      ← deploy this in Remix
```

### STEP 4 — Run Frontend
```bash
npm run dev
```
Open → http://localhost:5173
✅ You should see the white/navy/gold institutional portal!

---

## ══════════════════════════════════════════
## PART 2 — DEPLOY SMART CONTRACT
## ══════════════════════════════════════════

### STEP 5 — Open Remix IDE
Go to → https://remix.ethereum.org

### STEP 6 — Create Contract File
1. Left sidebar → FILE icon → "contracts" folder
2. Click "+" → name file: DegreeCertificate.sol
3. Paste ALL code from DegreeCertificate.sol

### STEP 7 — Compile
1. Click SOLIDITY COMPILER icon (left sidebar)
2. Version: 0.8.19
3. Enable optimization: 200
4. Click "Compile DegreeCertificate.sol"
5. ✅ No red errors = success

### STEP 8 — Deploy on Sepolia
1. Click DEPLOY icon (left sidebar)
2. Environment → "Injected Provider - MetaMask"
3. MetaMask popup → Connect → confirm Sepolia network
4. Contract → select "DegreeCertificate"
5. Click orange "Deploy" button
6. MetaMask → Confirm
7. Wait 15 seconds…
8. ✅ Contract appears under "Deployed Contracts"!

### STEP 9 — Copy Contract Address
1. Deployed Contracts → click your contract
2. Copy the address (0x…) at the top
3. SAVE IT!

---

## ══════════════════════════════════════════
## PART 3 — CONNECT FRONTEND TO CONTRACT
## ══════════════════════════════════════════

### STEP 10 — Update contract.js
Open src/contract.js and replace:
```javascript
export const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS_HERE";
```
With your actual address from Remix.

### STEP 11 — Test Wallet Connection
1. Open http://localhost:5173
2. Click "Connect MetaMask" on Home page
3. ✅ Sidebar shows your wallet address!

### STEP 12 — Issue a Certificate
1. Click "Issue Certificate" in sidebar
2. Fill in:
   - Student Full Name (e.g., Raj Patel)
   - Student ID (e.g., GU2023CS007)
   - Student's Ethereum Wallet Address (you can use any test address)
   - Degree: select from dropdown
   - Field of Study: select from dropdown
   - Graduation Year: select
   - University: select
   - Grade / CGPA: optional
3. Watch the LIVE CERTIFICATE PREVIEW update in real time on the right!
4. Click "Issue & Record on Blockchain"
5. MetaMask popup → Confirm
6. ✅ Success banner appears with TX hash!

### STEP 13 — Verify a Certificate
1. Click "Verify Degree" in sidebar
2. Enter the student name you just issued (e.g., "Raj Patel")
3. Click "Verify"
4. ✅ Green "Certificate Verified" banner appears with all details!

### STEP 14 — View Registry Ledger
1. Click "Registry Ledger" in sidebar
2. ✅ Table shows all issued certificates with:
   - Number, Name, Degree, University, Year, Status

---

## ══════════════════════════════════════════
## PART 4 — SMART CONTRACT EXPLAINED
## ══════════════════════════════════════════

### Contract: DegreeCertificate.sol

| Function                   | Who can call  | What it does                        |
|----------------------------|--------------|-------------------------------------|
| issueCertificate()         | Authorised   | Issues + records cert on-chain      |
| verifyCertificate(hash)    | Anyone       | Returns true/false for a hash       |
| getCertificatesByStudent() | Anyone       | All certs for a wallet address      |
| getCertificateByHash()     | Anyone       | Get cert details by its hash        |
| getAllCertificates()        | Anyone       | Full public registry                |
| authoriseIssuer()          | Owner only   | Whitelist an institution wallet     |
| revokeIssuer()             | Owner only   | Remove an institution's access      |

### Certificate Struct (stored on-chain):
```
issuer       → wallet that issued it
student      → student wallet address
studentName  → student full name
degree       → degree title
fieldOfStudy → subject area
university   → institution name
year         → graduation year
certHash     → unique hash (generated in frontend)
timestamp    → block time of issuance
isValid      → true (can be revoked by owner)
```

---

## ══════════════════════════════════════════
## PART 5 — 4 PAGES SUMMARY
## ══════════════════════════════════════════

| Page              | Features                                          |
|-------------------|---------------------------------------------------|
| 🏛 Portal Home    | Connect MetaMask, system overview, how-it-works  |
| 📜 Issue Cert     | Form + LIVE certificate preview + on-chain issue |
| 🔍 Verify Degree  | Search by name/hash/wallet, full result display  |
| 📚 Registry       | Public ledger table of all issued certificates   |

---

## ══════════════════════════════════════════
## TROUBLESHOOTING
## ══════════════════════════════════════════

❌ "Not an authorised issuer"
→ The contract restricts who can issue. The deploying wallet is automatically
  the owner and first authorised issuer. Use the same wallet that deployed!

❌ "Certificate hash already exists"
→ Each certificate must have a unique hash. This prevents duplicates.
  Each form submission generates a different hash automatically.

❌ Student wallet address error
→ Make sure you enter a VALID Ethereum address (0x + 40 hex characters).
  For testing, use any address from MetaMask.

❌ getAllCertificates fails
→ Only works if contract is deployed. Local issued certs still show.

❌ Sidebar not visible on mobile
→ The sidebar hides on small screens. Use a desktop browser.

---
## 🎉 PROJECT 2 COMPLETE!
---
