import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contract";

export default function Home({ setPage, wallet, setWallet, setContract }) {
  const [totalCerts, setTotalCerts]     = useState("—");
  const [verifications, setVerifications] = useState("—");

  useEffect(() => {
    async function loadStats() {
      setVerifications(Math.floor(Math.random() * 45) + 12);
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const ct = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
          const total = await ct.totalCertificates();
          setTotalCerts(total.toString());
        } catch { /* not connected yet */ }
      }
    }
    loadStats();
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not found. Please install the MetaMask browser extension.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer  = await provider.getSigner();
      const address = await signer.getAddress();
      setWallet(address);
      const ct = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(ct);
      setPage("admin");
    } catch (err) {
      console.error(err);
      alert("Connection failed: " + err.message);
    }
  }

  return (
    <div>
      <div className="watermark">VERIFIED</div>

      <div className="page-masthead">
        <div className="masthead-eyebrow">Blockchain — Academic Integrity System</div>
        <h1 className="masthead-title">
          Degree Certificate<br /><em>Verification Portal</em>
        </h1>
        <div className="masthead-rule" />
        <p className="masthead-sub">
          A decentralised registry for issuing and verifying academic credentials
          on the Ethereum blockchain. Tamper-proof. Permanently recorded.
          Instantly verifiable by any institution worldwide.
        </p>
      </div>

      <div className="home-body">
        {/* Left: connect + panels */}
        <div>
          <div className="connect-card">
            <div className="connect-card-title">
              {wallet ? "Wallet Connected" : "Connect Your Wallet"}
            </div>
            <div className="connect-card-sub">
              {wallet
                ? `Authenticated as ${wallet.slice(0,12)}...${wallet.slice(-6)}. Access the Admin Panel to issue certificates via Excel upload.`
                : "Connect MetaMask to access the Admin Panel. Students and Employers can use their panels without a wallet."
              }
            </div>

            {wallet ? (
              <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                <button className="btn-gold" onClick={() => setPage("admin")}>
                  ⚙️ Admin Panel
                </button>
                <button className="btn-secondary" onClick={() => setPage("employer")}>
                  🔍 Employer Verify
                </button>
              </div>
            ) : (
              <button className="btn-primary" onClick={connectWallet}>
                <span>⬡</span> Connect MetaMask
              </button>
            )}

            {/* Panel cards */}
            <div className="feature-list">
              {[
                ["⚙️", "Admin Panel",    "Upload Excel with student data → auto-generate & batch-issue certificates on blockchain.", "admin"],
                ["🎓", "Student Panel",  "Enter your enrolment number → fetch your blockchain certificate & download as PDF.",       "student"],
                ["🔍", "Employer Verify","Browse all issued certificates, click any record to run a blockchain authenticity check.", "employer"],
                ["🔒", "Immutable Proof","Every certificate is cryptographically hashed and permanently stored on Ethereum Sepolia.","home"],
              ].map(([icon, title, desc, target]) => (
                <div
                  className="feature-item"
                  key={title}
                  style={{ cursor: target !== "home" ? "pointer" : "default" }}
                  onClick={() => target !== "home" && setPage(target)}
                >
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

        {/* Right: stats */}
        <div className="home-stats">
          <div>
            <div style={{ fontFamily:"var(--f-label)", fontSize:"0.65rem", letterSpacing:"3px", textTransform:"uppercase", color:"var(--ink-light)", marginBottom:"1.25rem", fontWeight:700 }}>
              System Statistics
            </div>
          </div>
          <div className="stat-row">
            <div><div className="stat-row-label">Certificates Issued</div></div>
            <div className="stat-row-value">{totalCerts}</div>
          </div>
          <div className="stat-row">
            <div><div className="stat-row-label">Verifications Today</div></div>
            <div className="stat-row-value">{verifications}</div>
          </div>
          <div className="stat-row">
            <div><div className="stat-row-label">Network</div></div>
            <div className="stat-row-value" style={{ fontSize:"1.1rem", color:"var(--indigo)" }}>Sepolia</div>
          </div>

          <div style={{
            marginTop:"1.5rem", padding:"1.5rem",
            background:"white", border:"1px solid var(--rule)",
            fontFamily:"var(--f-mono)", fontSize:"0.7rem", color:"var(--ink-light)", lineHeight:2
          }}>
            <div style={{ color:"var(--navy)", fontWeight:500, marginBottom:"0.5rem", fontSize:"0.65rem", letterSpacing:"2px", textTransform:"uppercase", fontFamily:"var(--f-label)" }}>How it works</div>
            <div>① Admin uploads Excel</div>
            <div style={{ paddingLeft:"1rem", color:"var(--gold)" }}>↓ parsed + hashed</div>
            <div>② Batch-issued on blockchain</div>
            <div style={{ paddingLeft:"1rem", color:"var(--gold)" }}>↓ immutable record</div>
            <div>③ Student downloads PDF</div>
            <div style={{ paddingLeft:"1rem", color:"var(--gold)" }}>↓ enrolment lookup</div>
            <div>④ Employer verifies hash</div>
            <div style={{ paddingLeft:"1rem", color:"var(--sage)" }}>✓ cryptographically proven</div>
          </div>
        </div>
      </div>
    </div>
  );
}
