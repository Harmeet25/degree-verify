import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Issue from "./pages/Issue";
import Verify from "./pages/Verify";
import Registry from "./pages/Registry";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("home");
  const [wallet, setWallet] = useState(null);
  const [contract, setContract] = useState(null);
  const [certificates, setCertificates] = useState([]);

  return (
    <div className="app-root">
      <div className="paper-texture" />
      <Sidebar page={page} setPage={setPage} wallet={wallet} />
      <main className="main-content">
        {page === "home"     && <Home     setPage={setPage} wallet={wallet} setWallet={setWallet} setContract={setContract} />}
        {page === "issue"    && <Issue    wallet={wallet} contract={contract} certificates={certificates} setCertificates={setCertificates} />}
        {page === "verify"   && <Verify   wallet={wallet} contract={contract} certificates={certificates} />}
        {page === "registry" && <Registry wallet={wallet} contract={contract} certificates={certificates} setCertificates={setCertificates} />}
      </main>
    </div>
  );
}
