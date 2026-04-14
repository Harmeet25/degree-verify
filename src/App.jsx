import { useState, useEffect } from "react";
import { ethers } from "ethers"; // Import ethers
import Sidebar   from "./components/Sidebar";
import Home      from "./pages/Home";
import Admin     from "./pages/Admin";
import Student   from "./pages/Student";
import Employer  from "./pages/Employer";
import { usePersistentCerts } from "./hooks/usePersistentCerts";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract"; // Import contract details
import "./App.css";

export default function App() {
  const [page, setPage]         = useState("home");
  const [wallet, setWallet]     = useState(null);
  const [contract, setContract] = useState(null);

  const { certificates, setCertificates, mergeCertificates, clearCertificates } = usePersistentCerts();

  // Try to connect automatically on load to fetch chain data
  useEffect(() => {
    async function initContract() {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          // Only create a read-only contract if no wallet is connected yet
          const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
          
          // Fetch latest from chain
          const all = await readOnlyContract.getAllCertificates();
          const parsed = all.map(c => ({
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
            issuedDate     : new Date(Number(c.timestamp) * 1000).toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" }),
            verified       : c.isValid,
          }));
          
          // Overwrite local storage with the authoritative blockchain data
          if (parsed.length > 0) {
             setCertificates(parsed);
          }
        } catch (error) {
          console.error("Failed to fetch initial blockchain data:", error);
        }
      }
    }
    initContract();
  }, []);
  return (
    <div className="app-root">
      <div className="paper-texture" />
      <Sidebar page={page} setPage={setPage} wallet={wallet} />
      <main className="main-content">
        {page === "home"     && (
          <Home
            setPage={setPage}
            wallet={wallet}
            setWallet={setWallet}
            setContract={setContract}
          />
        )}
        {page === "admin"    && (
          <Admin
            wallet={wallet}
            contract={contract}
            certificates={certificates}
            setCertificates={setCertificates}
          />
        )}
        {page === "student"  && (
          <Student
            wallet={wallet}
            contract={contract}
            certificates={certificates}
          />
        )}
        {page === "employer" && (
          <Employer
            wallet={wallet}
            contract={contract}
            certificates={certificates}
            setCertificates={setCertificates}       // used by Refresh from chain
            mergeCertificates={mergeCertificates}   // merge without duplicates
            clearCertificates={clearCertificates}
          />
        )}
      </main>
    </div>
  );
}
