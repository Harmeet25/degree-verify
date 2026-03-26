import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contract";

export default function Home({ setPage, wallet, setWallet, setContract }) {

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not found. Please install the MetaMask browser extension.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWallet(address);
      const ct = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(ct);
      setPage("registry");
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
        <div class="masthead-rule" />
        <p className="masthead-sub">
          A decentralised registry for issuing and verifying academic credentials
          on the Ethereum blockchain. Tamper-proof. Permanently recorded.
          Instantly verifiable by any institution worldwide.
        </p>
      </div>

      <div className="home-body">
        {/* Left: connect card */}
        <div>
          <div className="connect-card">
            <div className="connect-card-title">
              {wallet ? "Wallet Connected" : "Connect Your Wallet"}
            </div>
            <div className="connect-card-sub">
              {wallet
                ? `You are authenticated as ${wallet.slice(0,12)}...${wallet.slice(-6)}. You may now issue, verify, and browse certificates on-chain.`
                : "Connect MetaMask to issue certificates as an authorised institution or to verify any credential against the blockchain registry."
              }
            </div>

            {wallet ? (
              <div style={{display:"flex",gap:"1rem",flexWrap:"wrap"}}>
                <button className="btn-gold" onClick={() => setPage("issue")}>
                  📜 Issue Certificate
                </button>
                <button className="btn-secondary" onClick={() => setPage("verify")}>
                  🔍 Verify a Degree
                </button>
              </div>
            ) : (
              <button className="btn-primary" onClick={connectWallet}>
                <span>⬡</span> Connect MetaMask
              </button>
            )}

            <div className="feature-list">
              {[
                ["🔒","Immutable Records","Every certificate is permanently hashed and stored on Sepolia testnet."],
                ["⚡","Instant Verification","Verify any credential in seconds using wallet address or certificate ID."],
                ["🌐","Globally Accessible","Any institution or employer can verify credentials without intermediaries."],
                ["🎓","Multi-Degree Support","Issue Bachelor, Master, PhD, Diploma and Honours degrees."],
              ].map(([icon,title,desc]) => (
                <div className="feature-item" key={title}>
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
            <div style={{fontFamily:"var(--f-label)",fontSize:"0.65rem",letterSpacing:"3px",textTransform:"uppercase",color:"var(--ink-light)",marginBottom:"1.25rem",fontWeight:700}}>
              System Statistics
            </div>
          </div>
          <div className="stat-row">
            <div>
              <div className="stat-row-label">Certificates Issued</div>
            </div>
            <div className="stat-row-value">—</div>
          </div>
          <div className="stat-row">
            <div>
              <div className="stat-row-label">Verifications Today</div>
            </div>
            <div className="stat-row-value">—</div>
          </div>
          <div className="stat-row">
            <div>
              <div className="stat-row-label">Network</div>
            </div>
            <div className="stat-row-value" style={{fontSize:"1.1rem",color:"var(--indigo)"}}>Sepolia</div>
          </div>

          {/* decorative chain diagram */}
          <div style={{
            marginTop:"1.5rem",padding:"1.5rem",
            background:"white",border:"1px solid var(--rule)",
            fontFamily:"var(--f-mono)",fontSize:"0.7rem",color:"var(--ink-light)",
            lineHeight:"2"
          }}>
            <div style={{color:"var(--navy)",fontWeight:500,marginBottom:"0.5rem",fontSize:"0.65rem",letterSpacing:"2px",textTransform:"uppercase",fontFamily:"var(--f-label)"}}>How it works</div>
            <div>① Institution issues certificate</div>
            <div style={{paddingLeft:"1rem",color:"var(--gold)"}}>↓ hashed + signed</div>
            <div>② Stored on Ethereum blockchain</div>
            <div style={{paddingLeft:"1rem",color:"var(--gold)"}}>↓ immutable record</div>
            <div>③ Anyone can verify instantly</div>
            <div style={{paddingLeft:"1rem",color:"var(--sage)"}}>✓ cryptographically proven</div>
          </div>
        </div>
      </div>
    </div>
  );
}
