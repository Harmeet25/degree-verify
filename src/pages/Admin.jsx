import { useState, useRef } from "react";
import { ethers } from "ethers";
import * as XLSX from "xlsx";
import { generateCertHash, generateCertId } from "../utils/certHash";

const UNIS = [
  "Gujarat University","Saurashtra University","GTU",
  "IIT Bombay","IIT Delhi","MIT","Stanford University",
  "Oxford University","Cambridge University","Harvard University","Other"
];

export default function Admin({ wallet, contract, onIssued }) {
  const fileRef = useRef(null);
  const [university, setUniversity] = useState(UNIS[0]);
  const [rows, setRows]     = useState([]);
  const [preview, setPreview] = useState(false);
  const [status, setStatus]   = useState("idle"); // idle | uploading | waiting | confirmed | error
  const [error, setError]     = useState("");
  const [txHash, setTxHash]   = useState("");
  const [progress, setProgress] = useState(0);

  // ── Parse Excel ───────────────────────────────────────────
  function handleFile(e) {
    setError(""); setStatus("idle"); setRows([]); setPreview(false);
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const wb   = XLSX.read(evt.target.result, { type:"binary" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval:"" });
        if (!data.length) { setError("Excel file is empty."); return; }

        const parsed = data.map((row, idx) => {
          const r = {};
          Object.keys(row).forEach(k => { r[k.trim().toLowerCase().replace(/\s+/g,"_")] = String(row[k]).trim(); });
          return {
            enrolmentNumber: r.enrolment_number || r.enrollment_number || r.enrolment || r.enrollment || r.roll_no || `ROW-${idx+1}`,
            studentName    : r.student_name || r.name || "",
            degree         : r.course || r.degree || "Bachelor of Science",
            fieldOfStudy   : r.field  || r.field_of_study || r.branch || "Computer Science",
            year           : r.year   || new Date().getFullYear().toString(),
            grade          : r.grade  || r.cgpa || "",
            studentWallet  : r.wallet_address || r.wallet || "",
          };
        }).filter(r => r.studentName.trim());

        if (!parsed.length) { setError("No valid rows found. Ensure 'Student Name' column exists."); return; }
        setRows(parsed);
        setPreview(true);
      } catch (err) {
        setError("Could not parse Excel: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  }

  // ── Issue to Blockchain ───────────────────────────────────
  async function handleIssue() {
    if (!wallet)    { setError("Connect MetaMask first (Portal Home)."); return; }
    if (!contract)  { setError("Contract not loaded. Reload the page."); return; }
    if (!rows.length) { setError("No data loaded."); return; }

    setError(""); setTxHash(""); setStatus("uploading"); setProgress(0);

    try {
      // Build enriched rows with deterministic hash
      const enriched = rows.map(r => {
        const certHash = generateCertHash({
          enrolmentNumber: r.enrolmentNumber,
          studentName    : r.studentName,
          degree         : r.degree,
          fieldOfStudy   : r.fieldOfStudy,
          university,
          year           : r.year,
        });
        // Never pass address(0) — use admin wallet as fallback
        const studentAddr = (r.studentWallet && ethers.isAddress(r.studentWallet))
          ? r.studentWallet : wallet;

        return { ...r, university, certHash, certId: generateCertId(r.studentName, r.enrolmentNumber, r.year), studentAddr };
      });

      setProgress(10);
      setStatus("waiting"); // MetaMask popup about to appear

      // ── Call blockchain ────────────────────────────────────
      const tx = await contract.batchIssueCertificates(
        enriched.map(r => r.studentAddr),
        enriched.map(r => r.enrolmentNumber),
        enriched.map(r => r.studentName),
        enriched.map(r => r.degree),
        enriched.map(r => r.fieldOfStudy),
        enriched.map(r => r.university),
        enriched.map(r => parseInt(r.year) || new Date().getFullYear()),
        enriched.map(r => r.certHash),
        enriched.map(r => r.certId)
      );

      setTxHash(tx.hash);
      setProgress(50);

      // ── Wait for confirmation ──────────────────────────────
      const receipt = await tx.wait();
      setProgress(100);

      if (receipt.status === 1) {
        setStatus("confirmed");
        setRows([]); setPreview(false);
        if (fileRef.current) fileRef.current.value = "";
        // Refresh the Employer table from blockchain
        if (onIssued) await onIssued();
      } else {
        setStatus("error");
        setError("Transaction reverted. Check MetaMask for details.");
      }
    } catch (err) {
      console.error("[Admin issue]", err);
      setStatus("error");
      setError(err.reason || err.data?.message || err.message || "Transaction failed.");
    }
  }

  // ── UI ─────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-masthead">
        <div className="masthead-eyebrow">Institution Portal — Authorised Admin</div>
        <h1 className="masthead-title">Admin <em>Panel</em></h1>
        <div className="masthead-rule" />
        <p className="masthead-sub">
          Upload an Excel file with student data. MetaMask will sign and store every
          certificate permanently on the Ethereum blockchain.
        </p>
      </div>

      {!wallet && (
        <div style={{ padding:"1rem 4rem 0" }}>
          <div className="error-banner">⚠ Connect MetaMask from Portal Home before issuing certificates.</div>
        </div>
      )}

      <div style={{ padding:"2rem 4rem" }}>

        {/* Upload card */}
        <div className="form-sheet" style={{ maxWidth:860 }}>
          <div className="form-sheet-header">
            <span>📂</span>
            <span className="form-sheet-header-title">Upload Student Data (Excel)</span>
          </div>
          <div className="form-sheet-body">

            {/* Error */}
            {error && <div className="error-banner">{error}</div>}

            {/* Status banners */}
            {status === "waiting" && (
              <div className="success-banner" style={{ background:"rgba(42,63,126,0.07)", borderColor:"var(--indigo)", color:"var(--indigo)" }}>
                ⏳ MetaMask popup is open — please <strong>confirm the transaction</strong> in MetaMask…
              </div>
            )}
            {status === "confirmed" && (
              <div className="success-banner">
                ✅ All certificates stored on blockchain!
                {txHash && <span className="tx-pill">TX: {txHash}</span>}
                <div style={{ marginTop:"0.4rem", fontSize:"0.78rem" }}>
                  Go to <strong>Employer Panel</strong> to see and verify them.
                </div>
              </div>
            )}

            {/* University */}
            <div className="field-group" style={{ maxWidth:380 }}>
              <label className="field-label">Issuing University / Institution</label>
              <select className="field-select" value={university} onChange={e => setUniversity(e.target.value)}>
                {UNIS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>

            {/* Drop zone */}
            <div className="field-group">
              <label className="field-label">Excel File (.xlsx)</label>
              <div style={{ border:"2px dashed var(--ivory3)", background:"var(--ivory)", padding:"2rem", textAlign:"center", cursor:"pointer" }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) handleFile({ target:{ files:[f] } }); }}>
                <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>📊</div>
                <div style={{ fontFamily:"var(--f-label)", fontSize:"0.85rem", color:"var(--ink-mid)" }}>Click or drag &amp; drop Excel here</div>
                <div style={{ fontSize:"0.72rem", color:"var(--ink-light)", marginTop:"0.4rem" }}>
                  Required columns: <strong>Enrolment Number</strong>, <strong>Student Name</strong>, <strong>Course</strong>, <strong>Year</strong>
                </div>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display:"none" }} onChange={handleFile} />
              </div>
            </div>

            <div style={{ background:"var(--ivory2)", border:"1px solid var(--ivory3)", padding:"0.9rem 1.2rem", fontSize:"0.75rem", color:"var(--ink-mid)", lineHeight:1.7, marginBottom:"1rem" }}>
              <strong style={{ color:"var(--navy)", fontFamily:"var(--f-label)", letterSpacing:"1px", fontSize:"0.65rem", textTransform:"uppercase" }}>Excel column names (case-insensitive):</strong><br />
              <span style={{ fontFamily:"var(--f-mono)" }}>Enrolment Number | Student Name | Course | Year | Grade | Wallet Address</span>
            </div>

            {/* Progress */}
            {(status === "uploading" || status === "waiting") && (
              <div style={{ marginBottom:"1rem" }}>
                <div style={{ fontFamily:"var(--f-mono)", fontSize:"0.72rem", color:"var(--ink-mid)", marginBottom:"0.4rem" }}>
                  {status === "waiting" ? "Waiting for MetaMask confirmation…" : `Preparing… ${progress}%`}
                </div>
                <div style={{ height:6, background:"var(--ivory3)" }}>
                  <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,var(--navy),var(--gold))", transition:"width 0.4s ease" }} />
                </div>
              </div>
            )}

            {/* Issue button */}
            {preview && rows.length > 0 && status !== "confirmed" && (
              <button className="btn-gold"
                style={{ width:"100%", justifyContent:"center", padding:"1rem" }}
                onClick={handleIssue}
                disabled={!wallet || status === "uploading" || status === "waiting"}>
                {(status === "uploading" || status === "waiting")
                  ? <><span className="spinner" style={{ borderColor:"rgba(0,0,0,0.2)", borderTopColor:"var(--navy)" }} /> &nbsp;{status === "waiting" ? "Confirm in MetaMask…" : "Processing…"}</>
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
                Preview — {rows.length} record{rows.length !== 1 ? "s" : ""}
              </div>
              <button className="btn-secondary" style={{ padding:"0.4rem 1rem", fontSize:"0.7rem" }}
                onClick={() => { setRows([]); setPreview(false); setStatus("idle"); }}>✕ Clear</button>
            </div>
            <div className="ledger-table-wrap" style={{ maxHeight:380, overflowY:"auto" }}>
              <div style={{ display:"grid", gridTemplateColumns:"40px 1.2fr 1.5fr 1.2fr 70px 100px", background:"var(--navy)", padding:"0.7rem 1.2rem", gap:"1rem" }}>
                {["#","Enrolment","Name","Course","Year","Grade"].map(h => <div key={h} className="ledger-header-cell">{h}</div>)}
              </div>
              {rows.map((r, i) => (
                <div key={i} className="ledger-row" style={{ display:"grid", gridTemplateColumns:"40px 1.2fr 1.5fr 1.2fr 70px 100px", animationDelay:`${i*0.03}s` }}>
                  <div className="ledger-num">{String(i+1).padStart(2,"0")}</div>
                  <div className="ledger-num" style={{ color:"var(--indigo)", fontSize:"0.78rem" }}>{r.enrolmentNumber}</div>
                  <div className="ledger-name" style={{ fontSize:"0.85rem" }}>{r.studentName}</div>
                  <div className="ledger-deg" style={{ fontStyle:"italic" }}>{r.degree}</div>
                  <div className="ledger-year">{r.year}</div>
                  <div className="ledger-deg">{r.grade || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works note */}
        <div style={{ marginTop:"1.5rem", padding:"1rem 1.5rem", background:"white", border:"1px solid var(--rule)", fontFamily:"var(--f-mono)", fontSize:"0.72rem", color:"var(--ink-light)", display:"flex", alignItems:"center", gap:"1rem" }}>
          <span style={{ fontSize:"1rem" }}>⛓</span>
          <span>
            Certificates are stored <strong>directly on Ethereum Sepolia</strong> via MetaMask.
            No local storage used. Any device can verify them from the Employer Panel.
          </span>
        </div>
      </div>
    </div>
  );
}
