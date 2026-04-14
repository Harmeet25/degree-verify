import { useState } from "react";
import Sidebar   from "./components/Sidebar";
import Home      from "./pages/Home";
import Admin     from "./pages/Admin";
import Student   from "./pages/Student";
import Employer  from "./pages/Employer";
import { usePersistentCerts } from "./hooks/usePersistentCerts";
import "./App.css";

export default function App() {
  const [page, setPage]         = useState("home");
  const [wallet, setWallet]     = useState(null);
  const [contract, setContract] = useState(null);

  // ✅ Persisted across page refreshes via localStorage
  const { certificates, setCertificates, mergeCertificates, clearCertificates } = usePersistentCerts();

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
