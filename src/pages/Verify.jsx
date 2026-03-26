import { useState } from "react";
import { ethers } from "ethers";

export default function Verify({ wallet, contract, certificates }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null); // null | {found, cert}
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);

    await new Promise(r => setTimeout(r, 800));

    // Search local state first
    const q = query.trim().toLowerCase();
    let found = certificates.find(c =>
      c.id?.toLowerCase().includes(q) ||
      c.studentName?.toLowerCase().includes(q) ||
      c.studentWallet?.toLowerCase() === q.toLowerCase() ||
      c.studentId?.toLowerCase().includes(q)
    );

    // If contract available and no local match, try on-chain
    if (!found && contract && ethers.isAddress(query.trim())) {
      try {
        const onChain = await contract.getCertificatesByStudent(query.trim());
        if (onChain && onChain.length > 0) {
          const c = onChain[0];
          found = {
            studentName: c.studentName,
            degree: c.degree,
            field: c.fieldOfStudy,
            university: c.university,
            year: Number(c.year).toString(),
            id: c.certHash,
            issuer: c.issuer,
            issuedDate: new Date(Number(c.timestamp) * 1000).toLocaleDateString(),
            verified: true,
            studentWallet: query.trim(),
          };
        }
      } catch (err) { console.error(err); }
    }

    setResult({ found: !!found, cert: found || null });
    setLoading(false);
  }

  return (
    <div>
      <div className="page-masthead">
        <div className="masthead-eyebrow">Public Verification — No Wallet Required</div>
        <h1 className="masthead-title">Verify a <em>Degree</em></h1>
        <div className="masthead-rule" />
        <p className="masthead-sub">
          Search by student name, wallet address, certificate hash, or enrollment ID
          to instantly verify any credential recorded on the blockchain.
        </p>
      </div>

      <div className="verify-body">

        {/* Search */}
        <div className="verify-search-wrap">
          <div style={{fontFamily:"var(--f-display)",fontSize:"1rem",fontWeight:600,color:"var(--navy)"}}>
            Enter Verification Query
          </div>
          <div style={{fontSize:"0.82rem",color:"var(--ink-mid)",marginTop:"0.4rem",lineHeight:1.6}}>
            You may search by: <strong>certificate hash</strong>, <strong>student wallet address (0x…)</strong>,
            <strong> student name</strong>, or <strong>enrollment ID</strong>.
          </div>
          <div className="search-field-wrap">
            <input
              className="search-input"
              placeholder="0x…  or  Student Name  or  Cert Hash"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
            />
            <button className="btn-primary" onClick={handleVerify} disabled={loading}>
              {loading ? <span className="spinner" /> : "🔍 Verify"}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="verify-result">
            <div className={`result-header ${result.found ? "valid" : "invalid"}`}>
              <span className="result-status-icon">{result.found ? "✅" : "❌"}</span>
              <div>
                <div className={`result-status-text ${result.found ? "valid" : "invalid"}`}>
                  {result.found ? "Certificate Verified" : "Certificate Not Found"}
                </div>
                <div className="result-status-sub">
                  {result.found
                    ? "This credential is authentic and recorded on the Ethereum blockchain."
                    : "No matching record found. The certificate may be fraudulent or not yet issued."
                  }
                </div>
              </div>
            </div>

            {result.found && result.cert && (
              <div className="result-body">
                <div className="result-grid">
                  <div className="result-field">
                    <div className="result-field-label">Student Name</div>
                    <div className="result-field-value" style={{fontFamily:"var(--f-display)",fontSize:"1.1rem"}}>{result.cert.studentName}</div>
                  </div>
                  <div className="result-field">
                    <div className="result-field-label">Enrollment ID</div>
                    <div className="result-field-value">{result.cert.studentId || "—"}</div>
                  </div>
                  <div className="result-field">
                    <div className="result-field-label">Degree Awarded</div>
                    <div className="result-field-value" style={{fontStyle:"italic"}}>{result.cert.degree}</div>
                  </div>
                  <div className="result-field">
                    <div className="result-field-label">Field of Study</div>
                    <div className="result-field-value">{result.cert.field}</div>
                  </div>
                  <div className="result-field">
                    <div className="result-field-label">Issuing Institution</div>
                    <div className="result-field-value">{result.cert.university}</div>
                  </div>
                  <div className="result-field">
                    <div className="result-field-label">Graduation Year</div>
                    <div className="result-field-value">{result.cert.year}</div>
                  </div>
                  {result.cert.grade && (
                    <div className="result-field">
                      <div className="result-field-label">Grade / CGPA</div>
                      <div className="result-field-value">{result.cert.grade}</div>
                    </div>
                  )}
                  <div className="result-field">
                    <div className="result-field-label">Issue Date</div>
                    <div className="result-field-value">{result.cert.issuedDate}</div>
                  </div>
                </div>

                <div style={{marginTop:"1.5rem",paddingTop:"1.5rem",borderTop:"1px solid var(--rule)"}}>
                  <div className="result-field-label" style={{marginBottom:"0.5rem"}}>Certificate Hash (Blockchain)</div>
                  <div className="hash-display">{result.cert.id}</div>
                </div>

                <div style={{marginTop:"1rem"}}>
                  <div className="result-field-label" style={{marginBottom:"0.5rem"}}>Issuer Wallet</div>
                  <div className="hash-display">{result.cert.issuer}</div>
                </div>

                {result.cert.txHash && result.cert.txHash !== "simulated" && (
                  <div style={{marginTop:"1rem"}}>
                    <div className="result-field-label" style={{marginBottom:"0.5rem"}}>Transaction Hash</div>
                    <div className="hash-display">{result.cert.txHash}</div>
                  </div>
                )}

                {/* Mini certificate */}
                <div style={{marginTop:"2rem",padding:"1.5rem",background:"var(--ivory2)",border:"1px solid var(--ivory3)",textAlign:"center",position:"relative"}}>
                  <div style={{
                    position:"absolute",inset:"8px",
                    border:"1px solid var(--rule-gold)",
                    pointerEvents:"none"
                  }} />
                  <div style={{fontSize:"0.6rem",letterSpacing:"3px",textTransform:"uppercase",color:"var(--ink-light)",marginBottom:"0.5rem",fontFamily:"var(--f-label)"}}>
                    {result.cert.university}
                  </div>
                  <div style={{fontFamily:"var(--f-display)",fontSize:"1.2rem",fontWeight:700,color:"var(--navy)"}}>
                    {result.cert.studentName}
                  </div>
                  <div style={{fontFamily:"var(--f-display)",fontSize:"0.8rem",fontStyle:"italic",color:"var(--gold)",margin:"0.3rem 0"}}>
                    {result.cert.degree} in {result.cert.field}
                  </div>
                  <div style={{fontSize:"1.5rem",marginTop:"0.5rem"}}>✅</div>
                  <div style={{fontFamily:"var(--f-mono)",fontSize:"0.55rem",color:"var(--sage)",marginTop:"0.3rem",letterSpacing:"1px"}}>
                    BLOCKCHAIN VERIFIED · AUTHENTIC
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Helper guide */}
        {!result && !loading && (
          <div style={{
            marginTop:"1rem",padding:"1.5rem 2rem",
            background:"white",border:"1px solid var(--rule)",
            display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem"
          }}>
            {[
              ["By Wallet Address","Enter the student's Ethereum address (0x…) to retrieve all their degrees."],
              ["By Certificate Hash","Paste the full certificate hash (0x…) for exact match verification."],
              ["By Student Name","Type the student's name to search by name (partial matches allowed)."],
              ["By Enrollment ID","Enter the institution's enrollment ID assigned to the student."],
            ].map(([t,d]) => (
              <div key={t}>
                <div style={{fontFamily:"var(--f-label)",fontSize:"0.65rem",fontWeight:700,letterSpacing:"1.5px",color:"var(--navy)",textTransform:"uppercase",marginBottom:"0.3rem"}}>{t}</div>
                <div style={{fontSize:"0.8rem",color:"var(--ink-mid)",lineHeight:1.5}}>{d}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
