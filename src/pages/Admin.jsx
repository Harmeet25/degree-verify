import { useState, useRef } from "react";
import { ethers } from "ethers";
import * as XLSX from "xlsx";
import { generateCertHash, generateCertId } from "../utils/certHash";

const UNIS = [
  "Gujarat University", "Saurashtra University", "GTU",
  "IIT Bombay", "IIT Delhi", "MIT", "Stanford University",
  "Oxford University", "Cambridge University", "Harvard University", "Other"
];

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

export default function Admin({ wallet, contract, certificates, setCertificates }) {
  const fileRef = useRef(null);
  const [university, setUniversity] = useState(UNIS[0]);
  const [rows, setRows]             = useState([]);
  const [preview, setPreview]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [txHash, setTxHash]         = useState("");

  // ── Excel parse ────────────────────────────────────────────────────────────
  function handleFile(e) {
    setError(""); setSuccess(""); setRows([]); setPreview(false);
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb   = XLSX.read(evt.target.result, { type: "binary" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!data.length) { setError("Excel file is empty."); return; }

        const normalised = data.map((row, idx) => {
          const r = {};
          Object.keys(row).forEach(k => {
            r[k.trim().toLowerCase().replace(/\s+/g, "_")] = String(row[k]).trim();
          });
          return {
            enrolmentNumber: r["enrolment_number"] || r["enrollment_number"] || r["enrolment"] || r["enrollment"] || r["roll_no"] || `ROW-${idx + 1}`,
            studentName    : r["student_name"]     || r["name"]             || "",
            degree         : r["course"]            || r["degree"]          || "Bachelor of Science",
            fieldOfStudy   : r["field"]             || r["field_of_study"]  || r["branch"]  || "Computer Science",
            year           : r["year"]              || new Date().getFullYear().toString(),
            grade          : r["grade"]             || r["cgpa"]            || "",
            studentWallet  : r["wallet_address"]    || r["wallet"]          || ZERO_ADDR,
          };
        }).filter(r => r.studentName);

        if (!normalised.length) {
          setError("No valid rows found. Make sure your Excel has a 'Student Name' column.");
          return;
        }
        setRows(normalised);
        setPreview(true);
      } catch (err) {
        setError("Could not parse Excel file: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  }

  // ── Batch issue ────────────────────────────────────────────────────────────
  async function handleBatchIssue() {
    if (!wallet) { setError("Connect MetaMask first."); return; }
    if (!rows.length) { setError("No data loaded."); return; }
    setError(""); setSuccess(""); setLoading(true); setProgress(0);

    try {
      // ✅ DETERMINISTIC HASH — no Date.now() / Math.random()
      //    Same input fields + same order = same hash every time.
      //    Employer panel uses the SAME function to re-derive and compare.
      const enriched = rows.map(r => {
        const certHash = generateCertHash({
          enrolmentNumber: r.enrolmentNumber,
          studentName    : r.studentName,
          degree         : r.degree,
          fieldOfStudy   : r.fieldOfStudy,
          university,
          year           : r.year,
        });
        return { ...r, university, certHash, certId: generateCertId(r.studentName, r.enrolmentNumber, r.year) };
      });

      let issuedTxHash = null;

      if (contract) {
        setProgress(20);
        const tx = await contract.batchIssueCertificates(
          enriched.map(r => ethers.isAddress(r.studentWallet) ? r.studentWallet : ZERO_ADDR),
          enriched.map(r => r.enrolmentNumber),
          enriched.map(r => r.studentName),
          enriched.map(r => r.degree),
          enriched.map(r => r.fieldOfStudy),
          enriched.map(r => r.university),
          enriched.map(r => parseInt(r.year) || new Date().getFullYear()),
          enriched.map(r => r.certHash),
          enriched.map(r => r.certId)
        );
        setProgress(60);
        await tx.wait();
        setProgress(100);
        issuedTxHash = tx.hash;
        setTxHash(tx.hash);
      } else {
        for (let i = 0; i < enriched.length; i++) {
          await new Promise(r => setTimeout(r, 120));
          setProgress(Math.round(((i + 1) / enriched.length) * 100));
        }
        issuedTxHash = "0xSIM_" + Math.random().toString(16).slice(2, 18).toUpperCase();
        setTxHash(issuedTxHash);
      }

      const newCerts = enriched.map(r => ({
        id             : r.certHash,   // ← stored hash — Employer re-derives this and compares
        certId         : r.certId,
        enrolmentNumber: r.enrolmentNumber,
        studentName    : r.studentName,
        degree         : r.degree,
        field          : r.fieldOfStudy,
        university     : r.university,
        year           : r.year,
        grade          : r.grade,
        issuer         : wallet,
        studentWallet  : r.studentWallet,
        issuedDate     : new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" }),
        timestamp      : Date.now(),
        txHash         : issuedTxHash,
        verified       : true,
      }));

      setCertificates(prev => [...prev, ...newCerts]);
      setSuccess(`✓ ${enriched.length} certificate${enriched.length !== 1 ? "s" : ""} issued and recorded on blockchain!`);
      setRows([]); setPreview(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || "Transaction failed.");
    }
    setLoading(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-masthead">
        <div className="masthead-eyebrow">Institution Portal — Authorised Admin</div>
        <h1 className="masthead-title">Admin <em>Panel</em></h1>
        <div className="masthead-rule" />
        <p className="masthead-sub">
          Upload an Excel file (.xlsx) containing student data. Certificates are
          generated automatically and stored permanently on the Ethereum blockchain.
        </p>
      </div>

      {!wallet && (
        <div style={{ padding:"1rem 4rem 0" }}>
          <div className="error-banner">⚠ Wallet not connected — connect MetaMask from Portal Home to issue certificates.</div>
        </div>
      )}

      <div style={{ padding:"2rem 4rem" }}>

        <div className="form-sheet" style={{ maxWidth:860 }}>
          <div className="form-sheet-header">
            <span>📂</span>
            <span className="form-sheet-header-title">Upload Student Data (Excel)</span>
          </div>
          <div className="form-sheet-body">

            {error   && <div className="error-banner">{error}</div>}
            {success && (
              <div className="success-banner">
                {success}
                {txHash && <span className="tx-pill">TX: {txHash}</span>}
              </div>
            )}

            <div className="field-group" style={{ maxWidth:380 }}>
              <label className="field-label">Issuing University / Institution</label>
              <select className="field-select" value={university} onChange={e => setUniversity(e.target.value)}>
                {UNIS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Excel File (.xlsx)</label>
              <div style={{
                border:"2px dashed var(--ivory3)", background:"var(--ivory)",
                padding:"2rem", textAlign:"center", cursor:"pointer",
              }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile({ target:{ files:[f] } }); }}
              >
                <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>📊</div>
                <div style={{ fontFamily:"var(--f-label)", fontSize:"0.85rem", color:"var(--ink-mid)" }}>
                  Click or drag &amp; drop your Excel file here
                </div>
                <div style={{ fontSize:"0.72rem", color:"var(--ink-light)", marginTop:"0.4rem" }}>
                  Required columns: <strong>Student Name</strong>, <strong>Enrolment Number</strong>, <strong>Course</strong>, <strong>Year</strong>
                </div>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display:"none" }} onChange={handleFile} />
              </div>
            </div>

            <div style={{
              background:"var(--ivory2)", border:"1px solid var(--ivory3)",
              padding:"0.9rem 1.2rem", fontSize:"0.75rem", color:"var(--ink-mid)",
              lineHeight:1.7, marginBottom:"1rem"
            }}>
              <strong style={{ color:"var(--navy)", fontFamily:"var(--f-label)", letterSpacing:"1px", fontSize:"0.65rem", textTransform:"uppercase" }}>
                Expected Excel Format:
              </strong><br />
              <span style={{ fontFamily:"var(--f-mono)" }}>
                | Enrolment Number | Student Name | Course | Year | Grade (opt) | Wallet Address (opt) |
              </span>
            </div>

            {loading && (
              <div style={{ marginBottom:"1rem" }}>
                <div style={{ fontFamily:"var(--f-mono)", fontSize:"0.72rem", color:"var(--ink-mid)", marginBottom:"0.4rem" }}>
                  Recording on blockchain… {progress}%
                </div>
                <div style={{ height:6, background:"var(--ivory3)" }}>
                  <div style={{
                    height:"100%", width:`${progress}%`,
                    background:"linear-gradient(90deg,var(--navy),var(--gold))",
                    transition:"width 0.3s ease"
                  }} />
                </div>
              </div>
            )}

            {preview && rows.length > 0 && (
              <button className="btn-gold"
                style={{ width:"100%", justifyContent:"center", padding:"1rem", marginBottom:"0.5rem" }}
                onClick={handleBatchIssue} disabled={loading || !wallet}>
                {loading
                  ? <><span className="spinner" style={{ borderColor:"rgba(0,0,0,0.2)", borderTopColor:"var(--navy)" }} /> &nbsp;Processing…</>
                  : `📜 Issue ${rows.length} Certificate${rows.length !== 1 ? "s" : ""} on Blockchain`
                }
              </button>
            )}
          </div>
        </div>

        {/* Preview table */}
        {preview && rows.length > 0 && (
          <div style={{ marginTop:"2rem" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.75rem" }}>
              <div style={{ fontFamily:"var(--f-label)", fontSize:"0.65rem", letterSpacing:"3px", textTransform:"uppercase", color:"var(--ink-light)", fontWeight:700 }}>
                Parsed Data Preview — {rows.length} record{rows.length !== 1 ? "s" : ""}
              </div>
              <button className="btn-secondary" style={{ padding:"0.4rem 1rem", fontSize:"0.7rem" }}
                onClick={() => { setRows([]); setPreview(false); }}>✕ Clear</button>
            </div>
            <div className="ledger-table-wrap" style={{ maxHeight:420, overflowY:"auto" }}>
              <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 1.2fr 1fr 80px 120px", background:"var(--navy)", padding:"0.7rem 1.2rem", gap:"1rem" }}>
                {["#","Enrolment","Student Name","Course","Year","Grade"].map(h => <div key={h} className="ledger-header-cell">{h}</div>)}
              </div>
              {rows.map((r, i) => (
                <div key={i} className="ledger-row" style={{ display:"grid", gridTemplateColumns:"40px 1fr 1.2fr 1fr 80px 120px", animationDelay:`${i*0.03}s` }}>
                  <div className="ledger-num">{String(i+1).padStart(2,"0")}</div>
                  <div className="ledger-num" style={{ color:"var(--indigo)", fontSize:"0.8rem" }}>{r.enrolmentNumber}</div>
                  <div className="ledger-name">{r.studentName}</div>
                  <div className="ledger-deg" style={{ fontStyle:"italic" }}>{r.degree}</div>
                  <div className="ledger-year">{r.year}</div>
                  <div className="ledger-deg">{r.grade || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issued registry */}
        {certificates.length > 0 && (
          <div style={{ marginTop:"3rem" }}>
            <div style={{ fontFamily:"var(--f-label)", fontSize:"0.65rem", letterSpacing:"3px", textTransform:"uppercase", color:"var(--ink-light)", fontWeight:700, marginBottom:"0.75rem" }}>
              Issued This Session — {certificates.length} record{certificates.length !== 1 ? "s" : ""}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
              {[
                ["Total Issued",  certificates.length, "var(--navy)"],
                ["Institutions",  [...new Set(certificates.map(c=>c.university))].length, "var(--indigo)"],
                ["Unique Years",  [...new Set(certificates.map(c=>c.year))].sort().join(", ") || "—", "var(--gold)"],
              ].map(([label, val, color]) => (
                <div key={label} style={{ background:"white", border:"1px solid var(--rule)", borderTop:"3px solid "+color, padding:"1.1rem 1.4rem", boxShadow:"0 1px 6px var(--shadow)" }}>
                  <div style={{ fontSize:"0.6rem", letterSpacing:"2px", textTransform:"uppercase", color:"var(--ink-light)", fontFamily:"var(--f-label)", fontWeight:700, marginBottom:"0.4rem" }}>{label}</div>
                  <div style={{ fontFamily:"var(--f-display)", fontSize:typeof val === "number" ? "1.8rem":"0.85rem", fontWeight:700, color }}>{val}</div>
                </div>
              ))}
            </div>
            <div className="ledger-table-wrap">
              <div className="ledger-header-row">
                {["#","Enrolment","Student","Degree","Year","Status"].map(h => <div key={h} className="ledger-header-cell">{h}</div>)}
              </div>
              {certificates.map((cert, i) => (
                <div className="ledger-row" key={cert.id || i} style={{ animationDelay:`${i*0.04}s` }}>
                  <div className="ledger-num">{String(i+1).padStart(2,"0")}</div>
                  <div className="ledger-num" style={{ color:"var(--indigo)", fontSize:"0.78rem" }}>{cert.enrolmentNumber}</div>
                  <div>
                    <div className="ledger-name">{cert.studentName}</div>
                    <div style={{ fontFamily:"var(--f-mono)", fontSize:"0.6rem", color:"var(--ink-light)", marginTop:"0.1rem" }}>{cert.certId}</div>
                  </div>
                  <div className="ledger-deg" style={{ fontStyle:"italic" }}>{cert.degree}</div>
                  <div className="ledger-year">{cert.year}</div>
                  <div><span className={`status-badge ${cert.verified ? "verified":"pending"}`}>{cert.verified ? "✓ Verified" : "⏳ Pending"}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop:"1.5rem", padding:"1rem 1.5rem", background:"white", border:"1px solid var(--rule)", display:"flex", alignItems:"center", gap:"1rem", fontFamily:"var(--f-mono)", fontSize:"0.72rem", color:"var(--ink-light)" }}>
          <span style={{ fontSize:"1rem" }}>⛓</span>
          <span>All records are stored immutably on <strong style={{ color:"var(--indigo)" }}>Ethereum Sepolia Testnet</strong>. Once issued, a certificate cannot be altered or deleted.</span>
        </div>
      </div>
    </div>
  );
}
