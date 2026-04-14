import { useState } from "react";
import jsPDF from "jspdf";

function downloadPDF(cert) {
  const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.setFillColor(248,246,240); doc.rect(0,0,W,H,"F");
  doc.setDrawColor(184,146,42); doc.setLineWidth(1.5); doc.rect(8,8,W-16,H-16);
  doc.setLineWidth(0.4); doc.rect(11,11,W-22,H-22);
  doc.setFillColor(15,31,61); doc.rect(0,0,W,28,"F");

  doc.setTextColor(248,246,240); doc.setFontSize(9); doc.setFont("helvetica","bold");
  doc.text((cert.university||"INSTITUTION").toUpperCase(), W/2, 11, {align:"center"});
  doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(212,168,67);
  doc.text("BLOCKCHAIN-VERIFIED ACADEMIC CREDENTIAL", W/2, 18, {align:"center"});

  doc.setTextColor(26,20,16); doc.setFontSize(10); doc.setFont("helvetica","italic");
  doc.text("This is to certify that", W/2, 45, {align:"center"});
  doc.setFontSize(26); doc.setFont("helvetica","bold"); doc.setTextColor(15,31,61);
  doc.text(cert.studentName||"—", W/2, 60, {align:"center"});
  doc.setDrawColor(184,146,42); doc.setLineWidth(0.6); doc.line(W*0.25,64,W*0.75,64);
  doc.setFontSize(10); doc.setFont("helvetica","italic"); doc.setTextColor(90,78,64);
  doc.text("has successfully completed the requirements for the degree of", W/2, 72, {align:"center"});
  doc.setFontSize(18); doc.setFont("helvetica","bold"); doc.setTextColor(184,146,42);
  doc.text(cert.degree||"—", W/2, 83, {align:"center"});
  doc.setFontSize(11); doc.setFont("helvetica","normal"); doc.setTextColor(90,78,64);
  doc.text(`in ${cert.field||"—"}`, W/2, 91, {align:"center"});

  const cols=[["Enrolment No.",cert.enrolmentNumber||"—"],["Cert ID",cert.certId||"—"],["Year",cert.year||"—"],["Grade",cert.grade||"—"]];
  const cw=W/cols.length;
  cols.forEach(([l,v],i)=>{
    const x=cw*i+cw/2;
    doc.setFontSize(7);doc.setFont("helvetica","normal");doc.setTextColor(138,126,110);doc.text(l.toUpperCase(),x,106,{align:"center"});
    doc.setFontSize(10);doc.setFont("helvetica","bold");doc.setTextColor(15,31,61);doc.text(String(v),x,113,{align:"center"});
  });

  doc.setFontSize(6);doc.setFont("courier","normal");doc.setTextColor(138,126,110);
  doc.text(`Hash: ${cert.id||"—"}`, W/2, H-18, {align:"center"});
  doc.setFillColor(15,31,61);doc.rect(0,H-12,W,12,"F");
  doc.setTextColor(212,168,67);doc.setFontSize(6.5);doc.setFont("helvetica","normal");
  doc.text("ETHEREUM BLOCKCHAIN VERIFIED · SEPOLIA TESTNET · TAMPER-PROOF", W/2, H-5, {align:"center"});

  doc.save(`Certificate_${(cert.studentName||"student").replace(/\s+/g,"_")}.pdf`);
}

export default function Student({ contract }) {
  const [query, setQuery]     = useState("");
  const [cert, setCert]       = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    if (!contract) { setError("Contract not loaded. Reload the page."); return; }

    setLoading(true); setCert(null); setNotFound(false); setError("");

    try {
      // Primary: getCertificateByEnrolment (v4 contract)
      const c = await contract.getCertificateByEnrolment(q);
      setCert({
        id             : c.certHash,
        certId         : c.certId || "",
        enrolmentNumber: c.enrolmentNumber || q,
        studentName    : c.studentName,
        degree         : c.degree,
        field          : c.fieldOfStudy,
        university     : c.university,
        year           : Number(c.year).toString(),
        issuer         : c.issuer,
        issuedDate     : new Date(Number(c.timestamp)*1000).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}),
        verified       : c.isValid,
      });
    } catch {
      // Fallback: scan getAllCertificates (works even if enrolToIndex failed)
      try {
        const all = await contract.getAllCertificates();
        const match = all.find(c =>
          c.enrolmentNumber?.toLowerCase() === q.toLowerCase() ||
          c.studentName?.toLowerCase().includes(q.toLowerCase())
        );
        if (match) {
          setCert({
            id             : match.certHash,
            certId         : match.certId || "",
            enrolmentNumber: match.enrolmentNumber || q,
            studentName    : match.studentName,
            degree         : match.degree,
            field          : match.fieldOfStudy,
            university     : match.university,
            year           : Number(match.year).toString(),
            issuer         : match.issuer,
            issuedDate     : new Date(Number(match.timestamp)*1000).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}),
            verified       : match.isValid,
          });
        } else {
          setNotFound(true);
        }
      } catch (err2) {
        setError("Blockchain error: " + (err2.reason || err2.message));
      }
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="page-masthead">
        <div className="masthead-eyebrow">Student Portal — Certificate Access</div>
        <h1 className="masthead-title">Student <em>Panel</em></h1>
        <div className="masthead-rule" />
        <p className="masthead-sub">
          Enter your Enrolment Number to fetch your blockchain-verified certificate and download it as PDF.
        </p>
      </div>

      <div className="verify-body">

        <div className="verify-search-wrap">
          <div style={{ fontFamily:"var(--f-display)", fontSize:"1rem", fontWeight:600, color:"var(--navy)" }}>
            Enter Your Enrolment Number
          </div>
          <div style={{ fontSize:"0.82rem", color:"var(--ink-mid)", marginTop:"0.4rem", lineHeight:1.6 }}>
            e.g. <strong>GU2021CS042</strong> — assigned by your institution at admission.
          </div>
          {error && <div className="error-banner" style={{ marginTop:"1rem" }}>{error}</div>}
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

        {/* Not found */}
        {notFound && (
          <div className="verify-result">
            <div className="result-header invalid">
              <span className="result-status-icon">❌</span>
              <div>
                <div className="result-status-text invalid">Certificate Not Found</div>
                <div className="result-status-sub">No record for this enrolment on the blockchain. Contact your institution.</div>
              </div>
            </div>
          </div>
        )}

        {/* Found */}
        {cert && (
          <div className="verify-result">
            <div className="result-header valid">
              <span className="result-status-icon">✅</span>
              <div>
                <div className="result-status-text valid">Certificate Found</div>
                <div className="result-status-sub">Your credential is recorded on the Ethereum blockchain.</div>
              </div>
            </div>

            <div className="result-body">
              {/* Card */}
              <div style={{ background:"white", border:"1px solid var(--rule)", padding:"2rem", marginBottom:"2rem", boxShadow:"0 4px 24px var(--shadow)", position:"relative", overflow:"hidden", textAlign:"center" }}>
                <div style={{ position:"absolute", inset:10, border:"1.5px solid var(--gold)", pointerEvents:"none" }} />
                <div style={{ position:"absolute", inset:14, border:"0.5px solid rgba(184,146,42,0.3)", pointerEvents:"none" }} />
                <div style={{ position:"absolute", bottom:22, right:22, width:52, height:52 }}>
                  <div style={{ width:"100%", height:"100%", borderRadius:"50%", border:"2px solid var(--gold)", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(184,146,42,0.05)", position:"relative" }}>
                    <div style={{ position:"absolute", inset:5, border:"1px dashed rgba(184,146,42,0.4)", borderRadius:"50%" }} />
                    <span style={{ fontSize:"1.3rem" }}>🎓</span>
                  </div>
                </div>
                <div style={{ fontFamily:"var(--f-label)", fontSize:"0.55rem", letterSpacing:"4px", textTransform:"uppercase", color:"var(--ink-light)", marginBottom:"0.75rem" }}>{cert.university}</div>
                <div style={{ fontFamily:"var(--f-display)", fontSize:"0.6rem", fontStyle:"italic", color:"var(--ink-mid)", marginBottom:"0.4rem" }}>This is to certify that</div>
                <div style={{ fontFamily:"var(--f-display)", fontSize:"1.6rem", fontWeight:700, color:"var(--navy)", marginBottom:"0.4rem" }}>{cert.studentName}</div>
                <div style={{ fontFamily:"var(--f-display)", fontSize:"0.85rem", fontStyle:"italic", color:"var(--gold)", marginBottom:"0.25rem" }}>{cert.degree}</div>
                <div style={{ fontSize:"0.65rem", letterSpacing:"1px", color:"var(--ink-mid)", marginBottom:"0.75rem" }}>in {cert.field}</div>
                <div style={{ width:"60%", height:1, background:"linear-gradient(90deg,transparent,var(--gold),transparent)", margin:"0 auto 0.75rem" }} />
                <div style={{ fontFamily:"var(--f-mono)", fontSize:"0.6rem", color:"var(--ink-light)" }}>
                  {cert.certId}&nbsp;·&nbsp;Year: {cert.year}
                </div>
              </div>

              {/* Details */}
              <div className="result-grid">
                {[
                  ["Enrolment Number", cert.enrolmentNumber],
                  ["Certificate ID",   cert.certId],
                  ["Degree",           cert.degree],
                  ["Field of Study",   cert.field],
                  ["University",       cert.university],
                  ["Graduation Year",  cert.year],
                  cert.grade ? ["Grade / CGPA", cert.grade] : null,
                  ["Issue Date",       cert.issuedDate],
                ].filter(Boolean).map(([label,val]) => (
                  <div className="result-field" key={label}>
                    <div className="result-field-label">{label}</div>
                    <div className="result-field-value">{val||"—"}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop:"1.5rem", paddingTop:"1.5rem", borderTop:"1px solid var(--rule)" }}>
                <div className="result-field-label" style={{ marginBottom:"0.4rem" }}>Certificate Hash (Blockchain)</div>
                <div className="hash-display">{cert.id}</div>
              </div>

              <div style={{ marginTop:"1.5rem" }}>
                <button className="btn-gold" style={{ padding:"0.9rem 2rem", fontSize:"0.85rem" }} onClick={() => downloadPDF(cert)}>
                  ⬇ Download Certificate as PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {!cert && !notFound && !loading && (
          <div style={{ marginTop:"1rem", padding:"1.5rem 2rem", background:"white", border:"1px solid var(--rule)", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
            {[
              ["Your Enrolment Number","The unique ID your institution gave you — on your admission letter or student ID card."],
              ["Blockchain Lookup","Your certificate is fetched live from Ethereum. No local cache used."],
              ["PDF Download","Download a professionally formatted certificate PDF once your record is found."],
              ["Universal Access","Anyone on any device can verify certificates from the Employer Panel."],
            ].map(([t,d]) => (
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
