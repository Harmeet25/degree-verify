import { useState } from "react";
import jsPDF from "jspdf";

// ── PDF generator ─────────────────────────────────────────────────────────────
function downloadCertPDF(cert) {
  const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(248, 246, 240);
  doc.rect(0, 0, W, H, "F");

  // Outer border
  doc.setDrawColor(184, 146, 42);
  doc.setLineWidth(1.5);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setLineWidth(0.4);
  doc.rect(11, 11, W - 22, H - 22);

  // Header band
  doc.setFillColor(15, 31, 61);
  doc.rect(0, 0, W, 28, "F");

  // University name
  doc.setTextColor(248, 246, 240);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text((cert.university || "INSTITUTION").toUpperCase(), W / 2, 11, { align:"center" });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(212, 168, 67);
  doc.text("BLOCKCHAIN-VERIFIED ACADEMIC CREDENTIAL", W / 2, 18, { align:"center" });

  // Body
  doc.setTextColor(26, 20, 16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("This is to certify that", W / 2, 45, { align:"center" });

  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 31, 61);
  doc.text(cert.studentName || "—", W / 2, 60, { align:"center" });

  doc.setDrawColor(184, 146, 42);
  doc.setLineWidth(0.6);
  doc.line(W * 0.25, 64, W * 0.75, 64);

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(90, 78, 64);
  doc.text("has successfully completed the requirements for the degree of", W / 2, 72, { align:"center" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(184, 146, 42);
  doc.text(cert.degree || "—", W / 2, 83, { align:"center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 78, 64);
  doc.text(`in ${cert.field || cert.fieldOfStudy || "—"}`, W / 2, 91, { align:"center" });

  // Details row
  const detailY = 106;
  const cols = [
    ["Enrolment No.", cert.enrolmentNumber || "—"],
    ["Certificate ID", cert.certId || "—"],
    ["Graduation Year", cert.year || "—"],
    ["Grade / CGPA", cert.grade || "—"],
  ];
  const colW = W / cols.length;
  cols.forEach(([label, val], idx) => {
    const x = colW * idx + colW / 2;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(138, 126, 110);
    doc.text(label.toUpperCase(), x, detailY, { align:"center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 31, 61);
    doc.text(String(val), x, detailY + 7, { align:"center" });
  });

  // Hash
  doc.setFontSize(6);
  doc.setFont("courier", "normal");
  doc.setTextColor(138, 126, 110);
  const hashLine = `Cert Hash: ${cert.id || cert.certHash || "—"}`;
  doc.text(hashLine, W / 2, H - 18, { align:"center" });

  // Footer
  doc.setFillColor(15, 31, 61);
  doc.rect(0, H - 12, W, 12, "F");
  doc.setTextColor(212, 168, 67);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.text("ETHEREUM BLOCKCHAIN VERIFIED · SEPOLIA TESTNET · TAMPER-PROOF RECORD", W / 2, H - 5, { align:"center" });

  doc.save(`Certificate_${cert.studentName?.replace(/\s+/g,"_") || "student"}_${cert.enrolmentNumber || "cert"}.pdf`);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Student({ wallet, contract, certificates }) {
  const [query, setQuery]   = useState("");
  const [result, setResult] = useState(null);   // null | {found, cert}
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 600));

    // 1. Search local state
    let cert = certificates.find(c =>
      c.enrolmentNumber?.toLowerCase() === q.toLowerCase() ||
      c.enrolmentNumber?.toLowerCase().includes(q.toLowerCase())
    );

    // 2. Try blockchain
    if (!cert && contract) {
      try {
        const onChain = await contract.getCertificateByEnrolment(q);
        if (onChain && onChain.studentName) {
          cert = {
            id             : onChain.certHash,
            certId         : onChain.certId,
            enrolmentNumber: onChain.enrolmentNumber,
            studentName    : onChain.studentName,
            degree         : onChain.degree,
            field          : onChain.fieldOfStudy,
            university     : onChain.university,
            year           : Number(onChain.year).toString(),
            issuer         : onChain.issuer,
            studentWallet  : onChain.student,
            issuedDate     : new Date(Number(onChain.timestamp) * 1000).toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" }),
            txHash         : null,
            verified       : onChain.isValid,
          };
        }
      } catch (err) { /* not found on chain */ }
    }

    setResult({ found: !!cert, cert: cert || null });
    setLoading(false);
  }

  return (
    <div>
      <div className="page-masthead">
        <div className="masthead-eyebrow">Student Portal — Certificate Access</div>
        <h1 className="masthead-title">Student <em>Panel</em></h1>
        <div className="masthead-rule" />
        <p className="masthead-sub">
          Enter your Enrolment Number to fetch your blockchain-verified degree certificate
          and download it as a PDF.
        </p>
      </div>

      <div className="verify-body">

        {/* Search */}
        <div className="verify-search-wrap">
          <div style={{ fontFamily:"var(--f-display)", fontSize:"1rem", fontWeight:600, color:"var(--navy)" }}>
            Enter Your Enrolment Number
          </div>
          <div style={{ fontSize:"0.82rem", color:"var(--ink-mid)", marginTop:"0.4rem", lineHeight:1.6 }}>
            e.g. <strong>GU2021CS042</strong> — the unique ID assigned by your institution at the time of admission.
          </div>
          <div className="search-field-wrap">
            <input
              className="search-input"
              placeholder="Enrolment Number…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
            <button className="btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? <span className="spinner" /> : "🔍 Fetch Certificate"}
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
                  {result.found ? "Certificate Found" : "Certificate Not Found"}
                </div>
                <div className="result-status-sub">
                  {result.found
                    ? "Your credential is authentic and recorded on the Ethereum blockchain."
                    : "No record found for this enrolment number. Please contact your institution."
                  }
                </div>
              </div>
            </div>

            {result.found && result.cert && (
              <div className="result-body">
                {/* Certificate Card */}
                <div style={{
                  background:"white", border:"1px solid var(--rule)",
                  padding:"2rem", marginBottom:"2rem",
                  boxShadow:"0 4px 24px var(--shadow)", position:"relative", overflow:"hidden",
                  textAlign:"center"
                }}>
                  {/* Double border */}
                  <div style={{ position:"absolute", inset:10, border:"1.5px solid var(--gold)", pointerEvents:"none" }} />
                  <div style={{ position:"absolute", inset:14, border:"0.5px solid rgba(184,146,42,0.3)", pointerEvents:"none" }} />

                  {/* Corner ornaments */}
                  {[["top:6px;left:6px;border-top-width:3px;border-left-width:3px;border-right:none;border-bottom:none",],
                    ["top:6px;right:6px;border-top-width:3px;border-right-width:3px;border-left:none;border-bottom:none"],
                    ["bottom:6px;left:6px;border-bottom-width:3px;border-left-width:3px;border-right:none;border-top:none"],
                    ["bottom:6px;right:6px;border-bottom-width:3px;border-right-width:3px;border-left:none;border-top:none"],
                  ].map((s, i) => (
                    <div key={i} style={{ position:"absolute", width:24, height:24, borderColor:"var(--gold)", borderStyle:"solid", ...Object.fromEntries(s[0].split(";").map(x => { const [k,v] = x.split(":"); return [k.trim().replace(/-([a-z])/g,(_,l)=>l.toUpperCase()), v?.trim()]; }).filter(([k])=>k)) }} />
                  ))}

                  {/* Seal */}
                  <div style={{ position:"absolute", bottom:22, right:22, width:54, height:54 }}>
                    <div style={{ width:"100%", height:"100%", borderRadius:"50%", border:"2px solid var(--gold)", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(184,146,42,0.05)", position:"relative" }}>
                      <div style={{ position:"absolute", inset:5, border:"1px dashed rgba(184,146,42,0.4)", borderRadius:"50%" }} />
                      <span style={{ fontSize:"1.4rem" }}>🎓</span>
                    </div>
                  </div>

                  <div style={{ fontFamily:"var(--f-label)", fontSize:"0.55rem", letterSpacing:"4px", textTransform:"uppercase", color:"var(--ink-light)", marginBottom:"0.75rem" }}>
                    {result.cert.university}
                  </div>
                  <div style={{ fontFamily:"var(--f-display)", fontSize:"0.6rem", fontStyle:"italic", color:"var(--ink-mid)", marginBottom:"0.4rem" }}>This is to certify that</div>
                  <div style={{ fontFamily:"var(--f-display)", fontSize:"1.6rem", fontWeight:700, color:"var(--navy)", marginBottom:"0.4rem" }}>{result.cert.studentName}</div>
                  <div style={{ fontFamily:"var(--f-display)", fontSize:"0.85rem", fontStyle:"italic", color:"var(--gold)", marginBottom:"0.25rem" }}>{result.cert.degree}</div>
                  <div style={{ fontSize:"0.65rem", letterSpacing:"1px", color:"var(--ink-mid)", marginBottom:"0.75rem" }}>in {result.cert.field}</div>
                  <div style={{ width:"60%", height:1, background:"linear-gradient(90deg,transparent,var(--gold),transparent)", margin:"0 auto 0.75rem" }} />
                  <div style={{ fontFamily:"var(--f-mono)", fontSize:"0.6rem", color:"var(--ink-light)" }}>
                    {result.cert.certId} &nbsp;·&nbsp; Year: {result.cert.year}
                  </div>
                  {result.cert.grade && (
                    <div style={{ fontFamily:"var(--f-mono)", fontSize:"0.6rem", color:"var(--indigo)", marginTop:"0.3rem" }}>
                      Grade: {result.cert.grade}
                    </div>
                  )}
                </div>

                {/* Details grid */}
                <div className="result-grid">
                  {[
                    ["Enrolment Number", result.cert.enrolmentNumber],
                    ["Certificate ID",   result.cert.certId],
                    ["Degree",           result.cert.degree],
                    ["Field of Study",   result.cert.field],
                    ["University",       result.cert.university],
                    ["Graduation Year",  result.cert.year],
                    result.cert.grade ? ["Grade / CGPA", result.cert.grade] : null,
                    ["Issue Date",       result.cert.issuedDate],
                  ].filter(Boolean).map(([label, val]) => (
                    <div className="result-field" key={label}>
                      <div className="result-field-label">{label}</div>
                      <div className="result-field-value">{val || "—"}</div>
                    </div>
                  ))}
                </div>

                {/* Hash */}
                <div style={{ marginTop:"1.5rem", paddingTop:"1.5rem", borderTop:"1px solid var(--rule)" }}>
                  <div className="result-field-label" style={{ marginBottom:"0.5rem" }}>Certificate Hash (Blockchain)</div>
                  <div className="hash-display">{result.cert.id}</div>
                </div>

                {result.cert.txHash && result.cert.txHash !== "simulated" && (
                  <div style={{ marginTop:"1rem" }}>
                    <div className="result-field-label" style={{ marginBottom:"0.5rem" }}>Transaction Hash</div>
                    <div className="hash-display">{result.cert.txHash}</div>
                  </div>
                )}

                {/* Download button */}
                <div style={{ marginTop:"1.5rem" }}>
                  <button
                    className="btn-gold"
                    style={{ padding:"0.9rem 2rem", fontSize:"0.85rem" }}
                    onClick={() => downloadCertPDF(result.cert)}
                  >
                    ⬇ Download Certificate as PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Guide */}
        {!result && !loading && (
          <div style={{
            marginTop:"1rem", padding:"1.5rem 2rem",
            background:"white", border:"1px solid var(--rule)",
            display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem"
          }}>
            {[
              ["Your Enrolment Number", "This is the unique ID your institution assigned to you — typically found on your admission letter or student ID card."],
              ["Blockchain Verification", "Your certificate hash is permanently recorded on the Ethereum blockchain, making it impossible to forge or alter."],
              ["PDF Download", "Once found, you can download a professionally formatted certificate PDF suitable for sharing with employers."],
              ["Privacy", "Only you and authorised institutions can issue or access certificates. Verification is public and trustless."],
            ].map(([t, d]) => (
              <div key={t}>
                <div style={{ fontFamily:"var(--f-label)", fontSize:"0.65rem", fontWeight:700, letterSpacing:"1.5px", color:"var(--navy)", textTransform:"uppercase", marginBottom:"0.3rem" }}>{t}</div>
                <div style={{ fontSize:"0.8rem", color:"var(--ink-mid)", lineHeight:1.5 }}>{d}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
