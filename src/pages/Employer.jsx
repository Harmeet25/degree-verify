import { useState } from "react";
import { generateCertHash } from "../utils/certHash";

export default function Employer({ contract, certificates, loadingChain, onRefresh }) {
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null); // null | {ok, method, message}

  const filtered = certificates.filter(c => {
    const q = search.toLowerCase();
    return !q ||
      c.studentName?.toLowerCase().includes(q) ||
      c.degree?.toLowerCase().includes(q) ||
      c.university?.toLowerCase().includes(q) ||
      c.year?.toString().includes(q) ||
      c.enrolmentNumber?.toLowerCase().includes(q);
  });

  // ══════════════════════════════════════════════════════════════
  // VERIFICATION — uses stored certHash from chain directly.
  // cert.id  = the certHash string stored on chain (e.g. "0xabc...")
  // hashToIndex maps that exact string.
  // verifyCertificate(cert.id) WILL succeed if the cert is on chain.
  // ══════════════════════════════════════════════════════════════
  async function verify(cert) {
    if (!contract) {
      setVerifyResult({ ok:false, method:"no-contract", message:"Contract not connected. Reload page." });
      return;
    }

    setVerifying(true);
    setVerifyResult(null);

    try {
      // ── Method 1: use stored hash directly ──────────────────
      // cert.id came from getAllCertificates() → c.certHash
      // The same string was stored in hashToIndex during batchIssueCertificates
      // This is the most direct and reliable path
      console.log("[Verify] cert.id (stored hash):", cert.id);
      const ok1 = await contract.verifyCertificate(cert.id);
      console.log("[Verify] verifyCertificate(stored):", ok1);

      if (ok1) {
        setVerifyResult({ ok:true, method:"stored-hash", message:"✅ Authentic — hash found in blockchain registry." });
        setVerifying(false);
        return;
      }

      // ── Method 2: re-derive hash and try ────────────────────
      // Handles edge case where cert.id in local state is stale
      const recomputed = generateCertHash({
        enrolmentNumber: cert.enrolmentNumber,
        studentName    : cert.studentName,
        degree         : cert.degree,
        fieldOfStudy   : cert.field,
        university     : cert.university,
        year           : cert.year,
      });
      console.log("[Verify] recomputed hash:", recomputed);

      if (recomputed !== cert.id) {
        // Hashes differ — localStorage must be stale; try recomputed
        const ok2 = await contract.verifyCertificate(recomputed);
        console.log("[Verify] verifyCertificate(recomputed):", ok2);
        if (ok2) {
          setVerifyResult({ ok:true, method:"recomputed", message:"✅ Authentic — verified using recomputed hash." });
          setVerifying(false);
          return;
        }
      }

      // ── Method 3: enrolment mapping ─────────────────────────
      if (cert.enrolmentNumber) {
        try {
          const [authentic, exists] = await contract.verifyCertificateHash(cert.enrolmentNumber, recomputed);
          console.log("[Verify] verifyCertificateHash:", { authentic, exists });
          if (exists && authentic) {
            setVerifyResult({ ok:true, method:"enrol-map", message:"✅ Authentic — verified via enrolment mapping." });
            setVerifying(false);
            return;
          }
          if (exists && !authentic) {
            setVerifyResult({ ok:false, method:"tampered", message:"⚠️ Tampered — enrolment found but hash mismatch!" });
            setVerifying(false);
            return;
          }
        } catch { /* old contract without verifyCertificateHash */ }
      }

      // Nothing matched
      setVerifyResult({
        ok: false,
        method: "not-found",
        message: "❌ Not found on blockchain. The certificate may not have been issued yet, or was issued with the old contract. Re-issue from Admin Panel."
      });
    } catch (err) {
      console.error("[Verify] Error:", err);
      setVerifyResult({ ok:false, method:"error", message:"Error: " + (err.reason || err.message) });
    }
    setVerifying(false);
  }

  // ── Modal ─────────────────────────────────────────────────
  function Modal({ cert, onClose }) {
    return (
      <div style={{
        position:"fixed", inset:0, background:"rgba(15,31,61,0.6)", zIndex:300,
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"2rem", backdropFilter:"blur(3px)"
      }} onClick={onClose}>
        <div style={{
          background:"var(--ivory)", maxWidth:640, width:"100%", maxHeight:"90vh", overflowY:"auto",
          border:"1px solid var(--rule)", boxShadow:"0 12px 60px rgba(15,31,61,0.35)"
        }} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ background:"var(--navy)", padding:"1.5rem 2rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontFamily:"var(--f-display)", fontSize:"1rem", color:"var(--ivory)", fontWeight:600 }}>Certificate Details</div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--gold)", fontSize:"1.4rem", cursor:"pointer", lineHeight:1 }}>✕</button>
          </div>

          <div style={{ padding:"2rem" }}>
            {/* Mini cert display */}
            <div style={{ background:"white", border:"1px solid var(--rule)", padding:"1.75rem", textAlign:"center", position:"relative", marginBottom:"1.5rem", boxShadow:"0 2px 12px var(--shadow)" }}>
              <div style={{ position:"absolute", inset:8, border:"1px solid var(--rule-gold)", pointerEvents:"none" }} />
              <div style={{ fontFamily:"var(--f-label)", fontSize:"0.55rem", letterSpacing:"4px", textTransform:"uppercase", color:"var(--ink-light)", marginBottom:"0.6rem" }}>{cert.university}</div>
              <div style={{ fontFamily:"var(--f-display)", fontSize:"1.5rem", fontWeight:700, color:"var(--navy)", marginBottom:"0.3rem" }}>{cert.studentName}</div>
              <div style={{ fontFamily:"var(--f-display)", fontSize:"0.85rem", fontStyle:"italic", color:"var(--gold)", marginBottom:"0.25rem" }}>{cert.degree}</div>
              <div style={{ fontSize:"0.65rem", color:"var(--ink-mid)", marginBottom:"0.75rem" }}>in {cert.field} · {cert.year}</div>
              <div style={{ width:"55%", height:1, background:"linear-gradient(90deg,transparent,var(--gold),transparent)", margin:"0 auto 0.75rem" }} />
              <div style={{ fontFamily:"var(--f-mono)", fontSize:"0.6rem", color:"var(--indigo)" }}>{cert.certId || "—"}</div>
            </div>

            {/* Detail grid */}
            <div className="result-grid" style={{ marginBottom:"1.5rem" }}>
              {[
                ["Enrolment Number", cert.enrolmentNumber || "—"],
                ["Certificate ID",   cert.certId          || "—"],
                ["Student Name",     cert.studentName],
                ["Degree",           cert.degree],
                ["Field of Study",   cert.field],
                ["Graduation Year",  cert.year],
                cert.grade ? ["Grade / CGPA", cert.grade] : null,
                ["Issuing University", cert.university],
                ["Issue Date",       cert.issuedDate || "—"],
              ].filter(Boolean).map(([label, val]) => (
                <div className="result-field" key={label}>
                  <div className="result-field-label">{label}</div>
                  <div className="result-field-value">{val || "—"}</div>
                </div>
              ))}
            </div>

            {/* Hash */}
            <div style={{ marginBottom:"1rem" }}>
              <div className="result-field-label" style={{ marginBottom:"0.4rem" }}>Certificate Hash (on-chain)</div>
              <div className="hash-display">{cert.id}</div>
            </div>
            <div style={{ marginBottom:"1.5rem" }}>
              <div className="result-field-label" style={{ marginBottom:"0.4rem" }}>Issuer Wallet</div>
              <div className="hash-display">{cert.issuer || "—"}</div>
            </div>

            {/* Verify result */}
            {verifyResult && (
              <div className={verifyResult.ok ? "success-banner" : "error-banner"} style={{ marginBottom:"1rem", fontSize:"0.88rem" }}>
                {verifyResult.message}
                <div style={{ fontSize:"0.7rem", marginTop:"0.25rem", opacity:0.65 }}>Method: {verifyResult.method}</div>
              </div>
            )}

            {/* Verify button */}
            <button
              className={verifyResult?.ok ? "btn-secondary" : "btn-gold"}
              style={{ width:"100%", justifyContent:"center", padding:"0.9rem", fontSize:"0.85rem" }}
              onClick={() => verify(cert)}
              disabled={verifying}
            >
              {verifying
                ? <><span className="spinner" style={{ borderColor:"rgba(0,0,0,0.2)", borderTopColor:"var(--navy)" }} /> &nbsp;Verifying on Blockchain…</>
                : verifyResult?.ok ? "🔁 Re-verify on Blockchain" : "⛓ Verify Authenticity on Blockchain"
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────
  return (
    <div>
      <div className="page-masthead">
        <div className="masthead-eyebrow">Employer Portal — Blockchain Verification</div>
        <h1 className="masthead-title">Employer <em>Panel</em></h1>
        <div className="masthead-rule" />
        <p className="masthead-sub">
          All certificates are loaded directly from the blockchain.
          Click any row → open details → verify authenticity.
        </p>
      </div>

      <div className="registry-body">

        {/* Controls */}
        <div className="registry-controls">
          <input
            className="registry-search"
            placeholder="Search by name, enrolment, degree, university…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ marginLeft:"auto", display:"flex", gap:"0.75rem", alignItems:"center" }}>
            <span style={{ fontFamily:"var(--f-mono)", fontSize:"0.75rem", color:"var(--ink-light)" }}>
              {loadingChain ? "Loading…" : `${filtered.length} record${filtered.length !== 1 ? "s" : ""} from blockchain`}
            </span>
            <button className="btn-secondary" style={{ padding:"0.5rem 1.2rem", fontSize:"0.72rem" }} onClick={onRefresh} disabled={loadingChain}>
              {loadingChain ? "↻ Loading…" : "↻ Refresh from Chain"}
            </button>
          </div>
        </div>

        {/* Summary */}
        {certificates.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
            {[
              ["Total on Blockchain", certificates.length, "var(--navy)"],
              ["Institutions",        [...new Set(certificates.map(c=>c.university))].length, "var(--indigo)"],
              ["Years Covered",       [...new Set(certificates.map(c=>c.year))].sort().join(", ") || "—", "var(--gold)"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background:"white", border:"1px solid var(--rule)", borderTop:"3px solid "+color, padding:"1.2rem 1.5rem", boxShadow:"0 1px 6px var(--shadow)" }}>
                <div style={{ fontSize:"0.6rem", letterSpacing:"2px", textTransform:"uppercase", color:"var(--ink-light)", fontFamily:"var(--f-label)", fontWeight:700, marginBottom:"0.4rem" }}>{label}</div>
                <div style={{ fontFamily:"var(--f-display)", fontSize:typeof val === "number" ? "2rem":"0.85rem", fontWeight:700, color }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="ledger-table-wrap">
          <div className="ledger-header-row" style={{ gridTemplateColumns:"40px 130px 1fr 1.2fr 80px 90px 80px" }}>
            {["#","Enrolment","Student","Degree","Year","Status",""].map((h,i) => (
              <div key={i} className="ledger-header-cell">{h}</div>
            ))}
          </div>

          {loadingChain && (
            <div style={{ padding:"4rem", textAlign:"center", fontFamily:"var(--f-mono)", fontSize:"0.8rem", color:"var(--ink-light)" }}>
              <span className="spinner" style={{ borderColor:"rgba(15,31,61,0.15)", borderTopColor:"var(--navy)", width:24, height:24, borderWidth:3 }} />&nbsp;&nbsp;
              Fetching from Ethereum blockchain…
            </div>
          )}

          {!loadingChain && filtered.length === 0 && (
            <div className="ledger-empty">
              <div className="ledger-empty-icon">📭</div>
              <div className="ledger-empty-text">
                {certificates.length === 0
                  ? "No certificates on blockchain yet. Issue from Admin Panel."
                  : "No certificates match your search."
                }
              </div>
            </div>
          )}

          {!loadingChain && filtered.map((cert, i) => (
            <div className="ledger-row" key={cert.id || i}
              style={{ gridTemplateColumns:"40px 130px 1fr 1.2fr 80px 90px 80px", animationDelay:`${i*0.03}s`, cursor:"pointer" }}
              onClick={() => { setSelected(cert); setVerifyResult(null); }}>
              <div className="ledger-num">{String(i+1).padStart(2,"0")}</div>
              <div className="ledger-num" style={{ color:"var(--indigo)", fontSize:"0.73rem" }}>{cert.enrolmentNumber || "—"}</div>
              <div>
                <div className="ledger-name">{cert.studentName}</div>
                <div style={{ fontFamily:"var(--f-mono)", fontSize:"0.58rem", color:"var(--ink-light)", marginTop:"0.1rem" }}>{cert.id?.slice(0,16)}…</div>
              </div>
              <div>
                <div className="ledger-deg" style={{ fontStyle:"italic" }}>{cert.degree}</div>
                <div style={{ fontSize:"0.72rem", color:"var(--indigo)", marginTop:"0.1rem" }}>{cert.field}</div>
              </div>
              <div className="ledger-year">{cert.year}</div>
              <div>
                <span className={`status-badge ${cert.verified ? "verified":"pending"}`}>
                  {cert.verified ? "✓ On Chain" : "⏳ Pending"}
                </span>
              </div>
              <div>
                <button className="btn-secondary"
                  style={{ padding:"0.3rem 0.7rem", fontSize:"0.64rem" }}
                  onClick={e => { e.stopPropagation(); setSelected(cert); setVerifyResult(null); }}>
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:"1.5rem", padding:"1rem 1.5rem", background:"white", border:"1px solid var(--rule)", display:"flex", alignItems:"center", gap:"1rem", fontFamily:"var(--f-mono)", fontSize:"0.72rem", color:"var(--ink-light)" }}>
          <span style={{ fontSize:"1rem" }}>⛓</span>
          <span>All data loaded live from <strong style={{ color:"var(--indigo)" }}>Ethereum Sepolia</strong>. Click <strong>Verify Authenticity</strong> to check the hash directly against the on-chain registry.</span>
        </div>
      </div>

      {selected && (
        <Modal cert={selected} onClose={() => { setSelected(null); setVerifyResult(null); }} />
      )}
    </div>
  );
}
