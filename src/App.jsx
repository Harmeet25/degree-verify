import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Sidebar   from "./components/Sidebar";
import Home      from "./pages/Home";
import Admin     from "./pages/Admin";
import Student   from "./pages/Student";
import Employer  from "./pages/Employer";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";
import "./App.css";

// Parse a raw on-chain Certificate struct into our UI shape
export function parseCert(c) {
  return {
    id             : c.certHash,
    certId         : c.certId         || "",
    enrolmentNumber: c.enrolmentNumber || "",
    studentName    : c.studentName,
    degree         : c.degree,
    field          : c.fieldOfStudy,
    university     : c.university,
    year           : Number(c.year).toString(),
    issuer         : c.issuer,
    studentWallet  : c.student,
    issuedDate     : new Date(Number(c.timestamp) * 1000)
                       .toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" }),
    verified       : c.isValid,
  };
}

export default function App() {
  const [page, setPage]         = useState("home");
  const [wallet, setWallet]     = useState(null);
  const [contract, setContract] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loadingChain, setLoadingChain] = useState(false);

  // ── Pull all certs from chain whenever contract is ready ──
  useEffect(() => {
    if (contract) fetchAllFromChain(contract);
  }, [contract]);

  async function fetchAllFromChain(ct) {
    setLoadingChain(true);
    try {
      const raw = await ct.getAllCertificates();
      setCertificates(raw.map(parseCert));
    } catch (e) {
      console.error("fetchAllFromChain:", e);
    }
    setLoadingChain(false);
  }

  // Also try read-only on first load so Employer/Student work without connecting wallet
  useEffect(() => {
    async function readOnlyInit() {
      if (!window.ethereum) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const ct = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        // Check contract is reachable
        await ct.totalCertificates();
        // Load certs
        const raw = await ct.getAllCertificates();
        if (raw.length > 0) setCertificates(raw.map(parseCert));
        // Store read-only contract so Student/Employer can query even without wallet
        setContract(ct);
      } catch (e) {
        console.warn("Read-only init failed:", e.message);
      }
    }
    readOnlyInit();
  }, []);

  return (
    <div className="app-root">
      <div className="paper-texture" />
      <Sidebar page={page} setPage={setPage} wallet={wallet} />
      <main className="main-content">
        {page === "home" && (
          <Home
            setPage={setPage}
            wallet={wallet} setWallet={setWallet}
            contract={contract} setContract={setContract}
          />
        )}
        {page === "admin" && (
          <Admin
            wallet={wallet}
            contract={contract}
            onIssued={() => fetchAllFromChain(contract)}
          />
        )}
        {page === "student" && (
          <Student contract={contract} />
        )}
        {page === "employer" && (
          <Employer
            contract={contract}
            certificates={certificates}
            loadingChain={loadingChain}
            onRefresh={() => fetchAllFromChain(contract)}
          />
        )}
      </main>
    </div>
  );
}
