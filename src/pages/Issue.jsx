import { useState } from "react";
import { ethers } from "ethers";

const DEGREES = ["Bachelor of Science","Bachelor of Arts","Bachelor of Engineering","Bachelor of Commerce","Master of Science","Master of Arts","Master of Business Administration","Master of Engineering","Doctor of Philosophy","Diploma","Honours Degree"];
const FIELDS  = ["Computer Science","Information Technology","Electrical Engineering","Mechanical Engineering","Business Administration","Economics","Mathematics","Physics","Chemistry","Medicine","Law","Architecture"];
const UNIS    = ["Gujarat University","Saurashtra University","GTU","IIT Bombay","IIT Delhi","MIT","Stanford University","Oxford University","Cambridge University","Harvard University","Other"];

// generate a simple hash from certificate data
function generateCertHash(data) {
  const str = JSON.stringify(data) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "0x" + Math.abs(hash).toString(16).padStart(64,"a").slice(0,64);
}

export default function Issue({ wallet, contract, certificates, setCertificates }) {
  const [form, setForm] = useState({
    studentName: "", studentId: "", degree: DEGREES[0],
    field: FIELDS[0], university: UNIS[0], year: "2024",
    grade: "", studentWallet: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [txHash, setTxHash] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const today = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" });

  async function handleIssue() {
    if (!wallet) { setError("Please connect your MetaMask wallet first."); return; }
    if (!form.studentName.trim() || !form.studentId.trim() || !form.studentWallet.trim()) {
      setError("Student Name, ID and Wallet Address are required."); return;
    }
    if (!ethers.isAddress(form.studentWallet)) {
      setError("Please enter a valid Ethereum wallet address for the student."); return;
    }
    setError(""); setSuccess(""); setLoading(true);

    try {
      const certHash = generateCertHash(form);
      let tx = null;

      if (contract) {
        tx = await contract.issueCertificate(
          form.studentWallet,
          form.studentName,
          form.degree,
          form.field,
          form.university,
          parseInt(form.year),
          certHash
        );
        await tx.wait();
        setTxHash(tx.hash);
      } else {
        await new Promise(r => setTimeout(r, 1500));
        setTxHash("0xSIM_" + Math.random().toString(16).slice(2,18).toUpperCase());
      }

      const newCert = {
        id: certHash,
        ...form,
        issuer: wallet,
        issuedDate: today,
        timestamp: Date.now(),
        txHash: tx?.hash || "simulated",
        verified: true,
      };
      setCertificates(prev => [...prev, newCert]);
      setSuccess(`Certificate issued successfully! Hash: ${certHash.slice(0,20)}...`);
      setForm(f => ({ ...f, studentName:"", studentId:"", studentWallet:"", grade:"" }));
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || "Transaction failed.");
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="page-masthead">
        <div className="masthead-eyebrow">Institution Portal — Authorised Issuer</div>
        <h1 className="masthead-title">Issue <em>Certificate</em></h1>
        <div className="masthead-rule" />
        <p className="masthead-sub">
          Complete the form below to issue a cryptographically-signed academic certificate
          recorded permanently on the Ethereum blockchain.
        </p>
      </div>

      {!wallet && (
        <div style={{padding:"1.5rem 4rem 0"}}>
          <div className="error-banner">⚠ Wallet not connected — connect MetaMask from the Portal Home to issue certificates.</div>
        </div>
      )}

      <div className="issue-body">
        {/* Form */}
        <div className="form-sheet">
          <div className="form-sheet-header">
            <span>📋</span>
            <span className="form-sheet-header-title">Certificate Details</span>
          </div>
          <div className="form-sheet-body">

            {error   && <div className="error-banner">{error}</div>}
            {success && (
              <div className="success-banner">
                ✓ {success}
                {txHash && <span className="tx-pill">TX: {txHash}</span>}
              </div>
            )}

            <div style={{fontFamily:"var(--f-label)",fontSize:"0.6rem",letterSpacing:"3px",color:"var(--ink-light)",textTransform:"uppercase",fontWeight:700,marginBottom:"1rem"}}>
              Student Information
            </div>

            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Student Full Name *</label>
                <input className="field-input" placeholder="e.g. Priya Mehta" value={form.studentName} onChange={e => set("studentName", e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Student / Enrollment ID *</label>
                <input className="field-input" placeholder="e.g. GU2021CS042" value={form.studentId} onChange={e => set("studentId", e.target.value)} />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Student Wallet Address (Ethereum) *</label>
              <input className="field-input" style={{fontFamily:"var(--f-mono)",fontSize:"0.8rem"}} placeholder="0x..." value={form.studentWallet} onChange={e => set("studentWallet", e.target.value)} />
            </div>

            <div className="form-divider" />

            <div style={{fontFamily:"var(--f-label)",fontSize:"0.6rem",letterSpacing:"3px",color:"var(--ink-light)",textTransform:"uppercase",fontWeight:700,marginBottom:"1rem"}}>
              Academic Details
            </div>

            <div className="field-group">
              <label className="field-label">Degree / Qualification</label>
              <select className="field-select" value={form.degree} onChange={e => set("degree", e.target.value)}>
                {DEGREES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Field of Study</label>
                <select className="field-select" value={form.field} onChange={e => set("field", e.target.value)}>
                  {FIELDS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Graduation Year</label>
                <select className="field-select" value={form.year} onChange={e => set("year", e.target.value)}>
                  {["2020","2021","2022","2023","2024","2025"].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Issuing University / Institution</label>
                <select className="field-select" value={form.university} onChange={e => set("university", e.target.value)}>
                  {UNIS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Final Grade / CGPA</label>
                <input className="field-input" placeholder="e.g. 8.7 / A+" value={form.grade} onChange={e => set("grade", e.target.value)} />
              </div>
            </div>

            <div style={{paddingTop:"0.5rem"}}>
              <button className="btn-gold" style={{width:"100%",justifyContent:"center",padding:"1rem"}} onClick={handleIssue} disabled={loading}>
                {loading ? <><span className="spinner" style={{borderColor:"rgba(0,0,0,0.2)",borderTopColor:"var(--navy)"}} /> &nbsp;Recording on Blockchain…</> : "📜 Issue & Record on Blockchain"}
              </button>
            </div>
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="cert-preview">
          <div className="cert-preview-label">Live Certificate Preview</div>
          <div className="certificate-card">
            <div className="cert-corner tl" /><div className="cert-corner tr" />
            <div className="cert-corner bl" /><div className="cert-corner br" />

            <div className="cert-seal">
              <div className={`seal-ring ${form.studentName ? "seal-verified" : ""}`}>
                <span className="seal-inner">🎓</span>
              </div>
            </div>

            <div className="cert-issuer">{form.university || "Institution Name"}</div>
            <div className="cert-this">This is to certify that</div>
            <div className="cert-name">{form.studentName || "Student Name"}</div>
            <div className="cert-degree">{form.degree}</div>
            <div className="cert-field">in {form.field}</div>
            <div className="cert-rule" />
            {form.grade && <div style={{fontSize:"0.65rem",color:"var(--ink-mid)",marginBottom:"0.4rem"}}>Grade: <strong>{form.grade}</strong></div>}
            <div className="cert-date">Issued: {today} · Year: {form.year}</div>
            <div style={{
              marginTop:"0.75rem",fontFamily:"var(--f-mono)",fontSize:"0.45rem",
              color:"var(--ink-light)",wordBreak:"break-all",padding:"0 1rem",lineHeight:1.4
            }}>
              BLOCKCHAIN VERIFIED · ETHEREUM SEPOLIA TESTNET
            </div>
          </div>

          <div style={{
            marginTop:"1rem",padding:"1rem",background:"white",
            border:"1px solid var(--rule)",fontSize:"0.75rem",color:"var(--ink-mid)",lineHeight:1.7
          }}>
            <strong style={{color:"var(--navy)",fontFamily:"var(--f-label)",letterSpacing:"1px",fontSize:"0.65rem",textTransform:"uppercase"}}>What gets stored on-chain:</strong><br/>
            · Student wallet address<br/>
            · Degree &amp; field of study<br/>
            · Issuing institution<br/>
            · Certificate hash (SHA-like)<br/>
            · Block timestamp
          </div>
        </div>
      </div>
    </div>
  );
}
