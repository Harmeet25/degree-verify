import { useState, useEffect } from "react";
import { generateCertHash } from "../utils/certHash";

export default function Employer({ wallet, contract, certificates, setCertificates, mergeCertificates, clearCertificates }) {
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState(null);
  const [checking, setChecking]     = useState(false);
  const [authResult, setAuthResult] = useState(null);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (contract && certificates.length === 0) loadFromChain();
  }, [contract]);

  async function loadFromChain() {
    setLoading(true);
    try {
      const all = await contract.getAllCertificates();
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
      mergeCertificates(parsed);
    } catch (err) { console.error("Could not fetch from chain:", err); }
    setLoading(false);
  }

  // ══════════════════════════════════════════════════════════
  // VERIFICATION — 3 steps, most reliable first
  // ══════════════════════════════════════════════════════════
  async function handleVerifyOnChain(cert) {
    setChecking(true);
    setAuthResult(null);
    await new Promise(r => setTimeout(r, 600));

    if (!contract) {
      // Offline: re-derive hash and compare with stored cert.id
      const recomputed = generateCertHash({
        enrolmentNumber: cert.enrolmentNumber,
        studentName    : cert.studentName,
        degree         : cert.degree,
        fieldOfStudy   : cert.field,
        university     : cert.university,
        year           : cert.year,
      });
      console.log("[Employer offline] recomputed:", recomputed, "stored:", cert.id);
      setAuthResult({ authentic: recomputed === cert.id, exists: true, method:"offline" });
      setChecking(false);
      return;
    }

    // ── STEP 1 (PRIMARY): verifyCertificate(storedHash) ──────────────────────
    // cert.id IS the hash that was passed to batchIssueCertificates.
    // The contract stores it in hashToIndex. This lookup cannot fail if the
    // cert was actually written to chain.
    try {
      console.log("[Employer] Step1: verifyCertificate with stored hash:", cert.id);
      const ok = await contract.verifyCertificate(cert.id);
      console.log("[Employer] Step1 result:", ok);
      if (ok) {
        setAuthResult({ authentic: true, exists: true, method:"stored-hash" });
        setChecking(false);
        return;
      }
      // ok=false means isValid=false (revoked) OR hash not in mapping
      // Try re-deriving the hash to check if there's a mismatch
    } catch (err) {
      console.error("[Employer] Step1 error:", err);
    }

    // ── STEP 2: Re-derive hash and try verifyCertificate ─────────────────────
    // If the cert was loaded from chain via getAllCertificates, cert.id already
    // IS the certHash. But if it came from localStorage it might be stale.
    // Re-derive and try.
    try {
      const recomputed = generateCertHash({
        enrolmentNumber: cert.enrolmentNumber,
        studentName    : cert.studentName,
        degree         : cert.degree,
        fieldOfStudy   : cert.field,
        university     : cert.university,
        year           : cert.year,
      });
      console.log("[Employer] Step2: recomputed hash:", recomputed);
      console.log("[Employer] Step2: stored cert.id:", cert.id);

      if (recomputed !== cert.id) {
        // Hashes differ — localStorage is stale, try the recomputed one
        const ok2 = await contract.verifyCertificate(recomputed);
        console.log("[Employer] Step2 verifyCertificate(recomputed):", ok2);
        if (ok2) {
          setAuthResult({ authentic: true, exists: true, method:"recomputed-hash" });
          setChecking(false);
          return;
        }
      }

      // ── STEP 3: verifyCertificateHash (enrolment mapping) ──────────────────
      if (cert.enrolmentNumber) {
        try {
          const [authentic, exists] = await contract.verifyCertificateHash(
            cert.enrolmentNumber,
            recomputed
          );
          console.log("[Employer] Step3 verifyCertificateHash:", { authentic, exists });
          if (exists) {
            setAuthResult({ authentic, exists, method:"enrol-hash" });
            setChecking(false);
            return;
          }
        } catch (err) {
          console.error("[Employer] Step3 error:", err);
        }
      }
    } catch (err) {
      console.error("[Employer] Step2 error:", err);
    }

    // Nothing worked → not on chain
    setAuthResult({ authentic: false, exists: false, method:"not-found" });
    setChecking(false);
  }

  const filtered = certificates.filter(c => {
    const q = search.toLowerCase();
    return !q ||
      c.studentName?.toLowerCase().includes(q) ||
      c.degree?.toLowerCase().includes(q) ||
      c.university?.toLowerCase().includes(q) ||
      c.year?.includes(q) ||
      c.enrolmentNumber?.toLowerCase().includes(q);
  });

  // ── Detail Modal ──────────────────────────────────────────
  function CertDetailModal({ cert, onClose }) {
    return (
      <div style={{
        position:"fixed", inset:0, background:"rgba(15,31,61,0.55)", zIndex:200,
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"2rem", backdropFilter:"blur(2px)"
      }} onClick={onClose}>
        <div style={{
          background:"var(--ivory)", maxWidth:640, width:"100%",
          maxHeight:"90vh", overflowY:"auto",
          border:"1px solid var(--rule)", boxShadow:"0 8px 48px rgba(15,31,61,0.3)",
        }} onClick={e => e.stopPropagation()}>

          <div style={{ background:"var(--navy)", padding:"1.5rem 2rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontFamily:"var(--f-display)", fontSize:"1rem", color:"var(--ivory)", fontWeight:600 }}>Certificate Details</div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--gold)", fontSize:"1.2rem", cursor:"pointer" }}>✕</button>
          </div>

          <div style={{ padding:"2rem" }}>
            {/* Mini cert */}
            <div style={{
              background:"white", border:"1px solid var(--rule)", padding:"1.5rem",
              textAlign:"center", position:"relative", overflow:"hidden",
              marginBottom:"1.5rem", boxShadow:"0 2px 12px var(--shadow)"
            }}>
              <div style={{ position:"absolute", inset:8, border:"1px solid var(--rule-gold)", pointerEvents:"none" }} />
              <div style={{ fontFamily:"var(--f-label)", fontSize:"0.55rem", letterSpacing:"3px", textTransform:"uppercase", color:"var(--ink-light)", marginBottom:"0.5rem" }}>{cert.university}</div>
              <div style={{ fontFamily:"var(--f-display)", fontSize:"1.4rem", fontWeight:700, color:"var(--navy)" }}>{cert.studentName}</div>
              <div style={{ fontFamily:"var(--f-display)", fontSize:"0.8rem", fontStyle:"italic", color:"var(--gold)", margin:"0.3rem 0" }}>{cert.degree}</div>
              <div style={{ fontSize:"0.65rem", color:"var(--ink-mid)" }}>in {cert.field} · {cert.year}</div>
              <div style={{ width:"60%", height:1, background:"linear-gradient(90deg,transparent,var(--gold),transparent)", margin:"0.75rem auto" }} />
              <div style={{ fontFamily:"var(--f-mono)", fontSize:"0.6rem", color:"var(--indigo)" }}>{cert.certId || cert.id?.slice(0,24)+"…"}</div>
            </div>

            {/* Fields */}
            <div className="result-grid" style={{ marginBottom:"1.5rem" }}>
              {[
                ["Enrolment Number",   cert.enrolmentNumber || "—"],
                ["Certificate ID",     cert.certId          || "—"],
                ["Student Name",       cert.studentName],
                ["Degree",             cert.degree],
                ["Field of Study",     cert.field],
                ["Graduation Year",    cert.year],
                cert.grade ? ["Grade / CGPA", cert.grade] : null,
                ["Issuing University", cert.university],
                ["Issue Date",         cert.issuedDate || "—"],
              ].filter(Boolean).map(([label, val]) => (
                <div className="result-field" key={label}>
                  <div className="result-field-label">{label}</div>
                  <div className="result-field-value">{val || "—"}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom:"1rem" }}>
              <div className="result-field-label" style={{ marginBottom:"0.4rem" }}>Certificate Hash (Blockchain)</div>
              <div className="hash-display">{cert.id}</div>
            </div>
            <div style={{ marginBottom:"1.5rem" }}>
              <div className="result-field-label" style={{ marginBottom:"0.4rem" }}>Issuer Wallet</div>
              <div className="hash-display">{cert.issuer || "—"}</div>
            </div>

            {/* Auth result */}
            {authResult && (
              <div className={authResult.authentic ? "success-banner" : "error-banner"} style={{ marginBottom:"1rem", fontSize:"0.88rem" }}>
                {authResult.authentic
                  ? "✅ Authentic Certificate — verified on the Ethereum blockchain."
                  : authResult.exists
                    ? "⚠️ Tampered — hash mismatch detected on blockchain!"
                    : "❌ Not Found — certificate not on blockchain. Re-issue from Admin Panel."
                }
                {authResult.method && (
                  <div style={{ fontSize:"0.72rem", marginTop:"0.3rem", opacity:0.65 }}>
                    Verification method: {authResult.method}
                  </div>
                )}
              </div>
            )}

            <button
              className={authResult?.authentic ? "btn-secondary" : "btn-gold"}
              style={{ width:"100%", justifyContent:"center", padding:"0.85rem" }}
              onClick={() => handleVerifyOnChain(cert)}
              disabled={checking}
            >
              {checking
                ? <><span className="spinner" style={{ borderColor:"rgba(0,0,0,0.2)", borderTopColor:"var(--navy)" }} /> &nbsp;Verifying on Blockchain…</>
                : authResult?.authentic ? "✅ Re-verify on Blockchain" : "⛓ Verify Authenticity on Blockchain"
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-masthead">
        <div className="masthead-eyebrow">Employer Portal — Credential Verification</div>
        <h1 className="masthead-title">Employer <em>Panel</em></h1>
        <div className="masthead-rule" />
        <p className="masthead-sub">
          Search and verify any academic credential. Click a record to run a blockchain authenticity check.
        </p>
      </div>

      <div className="registry-body">
        <div className="registry-controls">
          <input
            className="registry-search"
            placeholder="Search by name, degree, university, enrolment…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ marginLeft:"auto", display:"flex", gap:"0.75rem", alignItems:"center" }}>
            <span style={{ fontFamily:"var(--f-mono)", fontSize:"0.75rem", color:"var(--ink-light)" }}>
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
            {contract && (
              <button className="btn-secondary" style={{ padding:"0.5rem 1.2rem", fontSize:"0.72rem" }} onClick={loadFromChain}>
                ↻ Refresh from Chain
              </button>
            )}
            {certificates.length > 0 && (
              <button
                className="btn-secondary"
                style={{ padding:"0.5rem 1.2rem", fontSize:"0.72rem", borderColor:"var(--crimson)", color:"var(--crimson)" }}
                onClick={() => { if (window.confirm("Clear all local certificate data?")) clearCertificates(); }}
              >
                🗑 Clear Cache
              </button>
            )}
          </div>
        </div>

        {certificates.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
            {[
              ["Total Certificates", certificates.length, "var(--navy)"],
              ["Institutions",       [...new Set(certificates.map(c=>c.university))].length, "var(--indigo)"],
              ["Years Covered",      [...new Set(certificates.map(c=>c.year))].sort().join(", ") || "—", "var(--gold)"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background:"white", border:"1px solid var(--rule)", borderTop:"3px solid "+color, padding:"1.2rem 1.5rem", boxShadow:"0 1px 6px var(--shadow)" }}>
                <div style={{ fontSize:"0.6rem", letterSpacing:"2px", textTransform:"uppercase", color:"var(--ink-light)", fontFamily:"var(--f-label)", fontWeight:700, marginBottom:"0.4rem" }}>{label}</div>
                <div style={{ fontFamily:"var(--f-display)", fontSize:typeof val === "number" ? "2rem":"0.85rem", fontWeight:700, color }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        <div className="ledger-table-wrap">
          <div className="ledger-header-row" style={{ gridTemplateColumns:"40px 120px 1fr 1.2fr 80px 90px 80px" }}>
            {["#","Enrolment","Student","Degree","Year","Status","Action"].map(h => (
              <div key={h} className="ledger-header-cell">{h}</div>
            ))}
          </div>

          {loading && (
            <div style={{ padding:"3rem", textAlign:"center", fontFamily:"var(--f-mono)", fontSize:"0.8rem", color:"var(--ink-light)" }}>
              Loading from blockchain…
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="ledger-empty">
              <div className="ledger-empty-icon">📭</div>
              <div className="ledger-empty-text">
                {certificates.length === 0 ? "No certificates yet. Issue from Admin Panel." : "No certificates match your search."}
              </div>
            </div>
          )}

          {!loading && filtered.map((cert, i) => (
            <div className="ledger-row" key={cert.id || i}
              style={{ gridTemplateColumns:"40px 120px 1fr 1.2fr 80px 90px 80px", animationDelay:`${i*0.04}s`, cursor:"pointer" }}
              onClick={() => { setSelected(cert); setAuthResult(null); }}
            >
              <div className="ledger-num">{String(i+1).padStart(2,"0")}</div>
              <div className="ledger-num" style={{ color:"var(--indigo)", fontSize:"0.75rem" }}>{cert.enrolmentNumber || "—"}</div>
              <div>
                <div className="ledger-name">{cert.studentName}</div>
                <div style={{ fontFamily:"var(--f-mono)", fontSize:"0.6rem", color:"var(--ink-light)", marginTop:"0.1rem" }}>{cert.id?.slice(0,14)}…</div>
              </div>
              <div>
                <div className="ledger-deg" style={{ fontStyle:"italic" }}>{cert.degree}</div>
                <div style={{ fontSize:"0.73rem", color:"var(--indigo)", marginTop:"0.15rem" }}>{cert.field}</div>
              </div>
              <div className="ledger-year">{cert.year}</div>
              <div>
                <span className={`status-badge ${cert.verified ? "verified":"pending"}`}>
                  {cert.verified ? "✓ Verified" : "⏳ Pending"}
                </span>
              </div>
              <div>
                <button className="btn-secondary"
                  style={{ padding:"0.3rem 0.7rem", fontSize:"0.65rem" }}
                  onClick={e => { e.stopPropagation(); setSelected(cert); setAuthResult(null); }}>
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:"1.5rem", padding:"1rem 1.5rem", background:"white", border:"1px solid var(--rule)", display:"flex", alignItems:"center", gap:"1rem", fontFamily:"var(--f-mono)", fontSize:"0.72rem", color:"var(--ink-light)" }}>
          <span style={{ fontSize:"1rem" }}>⛓</span>
          <span>Click any row → <strong style={{ color:"var(--indigo)" }}>Verify Authenticity</strong> to check against blockchain. Data persists across refreshes.</span>
        </div>
      </div>

      {selected && (
        <CertDetailModal cert={selected} onClose={() => { setSelected(null); setAuthResult(null); }} />
      )}
    </div>
  );
}
