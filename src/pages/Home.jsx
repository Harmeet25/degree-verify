import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contract";

export default function Home({ setPage, wallet, setWallet, contract, setContract }) {
  const [totalCerts, setTotalCerts] = useState("—");

  useEffect(() => {
    if (contract) {
      contract.totalCertificates().then(n => setTotalCerts(n.toString())).catch(() => {});
    }
  }, [contract]);

  async function connectWallet() {
    if (!window.ethereum) { alert("MetaMask not found."); return; }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer  = await provider.getSigner();
      const address = await signer.getAddress();
      setWallet(address);
      // Upgrade to signer-backed contract so Admin can write
      setContract(new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer));
      setPage("admin");
    } catch (err) {
      alert("Connection failed: " + err.message);
    }
  }

  return (
    <div>
      <div className="watermark">VERIFIED</div>
      <div className="page-masthead">
        <div className="masthead-eyebrow">Blockchain — Academic Integrity System</div>
        <h1 className="masthead-title">Degree Certificate<br /><em>Verification Portal</em></h1>
        <div className="masthead-rule" />
        <p className="masthead-sub">
          A decentralised registry for issuing and verifying academic credentials
          on Ethereum. Tamper-proof. Permanently recorded. Instantly verifiable worldwide.
        </p>
      </div>

      <div className="home-body">
        <div>
          <div className="connect-card">
            <div className="connect-card-title">{wallet ? "Wallet Connected" : "Connect Your Wallet"}</div>
            <div className="connect-card-sub">
              {wallet
                ? `Authenticated as ${wallet.slice(0,10)}...${wallet.slice(-6)}. Use Admin Panel to issue certificates.`
                : "Connect MetaMask to issue certificates. Students and Employers can verify without a wallet."
              }
            </div>

            {wallet ? (
              <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                <button className="btn-gold" onClick={() => setPage("admin")}>⚙️ Admin Panel</button>
                <button className="btn-secondary" onClick={() => setPage("employer")}>🔍 Employer Verify</button>
              </div>
            ) : (
              <button className="btn-primary" onClick={connectWallet}>
                <span>⬡</span> Connect MetaMask
              </button>
            )}

            <div className="feature-list">
              {[
                ["⚙️","Admin Panel",    "Upload Excel → batch-issue certificates on blockchain via MetaMask.", "admin"],
                ["🎓","Student Panel",  "Enter enrolment number → fetch & download blockchain certificate.",   "student"],
                ["🔍","Employer Verify","Browse all on-chain certificates & verify authenticity.",             "employer"],
                ["🔒","Immutable Proof","Every certificate is keccak256-hashed on Ethereum Sepolia.",          "home"],
              ].map(([icon,title,desc,target]) => (
                <div className="feature-item" key={title}
                  style={{ cursor: target !== "home" ? "pointer" : "default" }}
                  onClick={() => target !== "home" && setPage(target)}>
                  <span className="feature-icon">{icon}</span>
                  <div>
                    <div className="feature-title">{title}</div>
                    <div className="feature-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="home-stats">
          <div style={{ fontFamily:"var(--f-label)", fontSize:"0.65rem", letterSpacing:"3px", textTransform:"uppercase", color:"var(--ink-light)", marginBottom:"1.25rem", fontWeight:700 }}>
            System Statistics
          </div>
          {[
            ["Certificates on Chain", totalCerts],
            ["Network", "Sepolia"],
            ["Storage", "Blockchain"],
          ].map(([label, val]) => (
            <div className="stat-row" key={label}>
              <div><div className="stat-row-label">{label}</div></div>
              <div className="stat-row-value" style={{ fontSize: label === "Network" ? "1.1rem" : undefined, color: label === "Network" ? "var(--indigo)" : undefined }}>{val}</div>
            </div>
          ))}

          <div style={{ marginTop:"1.5rem", padding:"1.5rem", background:"white", border:"1px solid var(--rule)", fontFamily:"var(--f-mono)", fontSize:"0.7rem", color:"var(--ink-light)", lineHeight:2 }}>
            <div style={{ color:"var(--navy)", fontWeight:500, marginBottom:"0.5rem", fontSize:"0.65rem", letterSpacing:"2px", textTransform:"uppercase", fontFamily:"var(--f-label)" }}>How it works</div>
            <div>① Admin uploads Excel</div>
            <div style={{ paddingLeft:"1rem", color:"var(--gold)" }}>↓ MetaMask signs tx</div>
            <div>② Stored on Ethereum</div>
            <div style={{ paddingLeft:"1rem", color:"var(--gold)" }}>↓ immutable forever</div>
            <div>③ Employer fetches from chain</div>
            <div style={{ paddingLeft:"1rem", color:"var(--gold)" }}>↓ hash comparison</div>
            <div>④ ✅ Authentic or ❌ Tampered</div>
          </div>
        </div>
      </div>
    </div>
  );
}
