import { useState, useEffect } from "react";

export default function Registry({ wallet, contract, certificates, setCertificates }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract && certificates.length === 0) loadFromChain();
  }, [contract]);

  async function loadFromChain() {
    setLoading(true);
    try {
      const all = await contract.getAllCertificates();
      const parsed = all.map(c => ({
        id: c.certHash,
        studentName: c.studentName,
        degree: c.degree,
        field: c.fieldOfStudy,
        university: c.university,
        year: Number(c.year).toString(),
        issuer: c.issuer,
        studentWallet: c.student,
        issuedDate: new Date(Number(c.timestamp) * 1000).toLocaleDateString(),
        verified: true,
      }));
      setCertificates(parsed);
    } catch (err) {
      console.error("Could not fetch from chain:", err);
    }
    setLoading(false);
  }

  const filtered = certificates.filter(c => {
    const q = search.toLowerCase();
    return !q ||
      c.studentName?.toLowerCase().includes(q) ||
      c.degree?.toLowerCase().includes(q) ||
      c.university?.toLowerCase().includes(q) ||
      c.year?.includes(q) ||
      c.studentId?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-masthead">
        <div className="masthead-eyebrow">Immutable — Public Ledger</div>
        <h1 className="masthead-title">Certificate <em>Registry</em></h1>
        <div className="masthead-rule" />
        <p className="masthead-sub">
          A complete, immutable ledger of every academic credential issued through
          this system. All records are permanently stored on the Ethereum blockchain.
        </p>
      </div>

      <div className="registry-body">
        {/* Controls */}
        <div className="registry-controls">
          <input
            className="registry-search"
            placeholder="Search by name, degree, university…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{marginLeft:"auto",display:"flex",gap:"0.75rem",alignItems:"center"}}>
            <span style={{fontFamily:"var(--f-mono)",fontSize:"0.75rem",color:"var(--ink-light)"}}>
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
            {contract && (
              <button className="btn-secondary" style={{padding:"0.5rem 1.2rem",fontSize:"0.72rem"}} onClick={loadFromChain}>
                ↻ Refresh
              </button>
            )}
            {wallet && (
              <button className="btn-gold" style={{padding:"0.5rem 1.2rem",fontSize:"0.72rem"}} onClick={() => {}}>
                + Issue New
              </button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        {certificates.length > 0 && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1rem",marginBottom:"1.5rem"}}>
            {[
              ["Total Certificates", certificates.length, "var(--navy)"],
              ["Institutions", [...new Set(certificates.map(c=>c.university))].length, "var(--indigo)"],
              ["Years Covered", [...new Set(certificates.map(c=>c.year))].sort().join(", ") || "—", "var(--gold)"],
            ].map(([label, val, color]) => (
              <div key={label} style={{
                background:"white",border:"1px solid var(--rule)",
                borderTop:"3px solid " + color,
                padding:"1.2rem 1.5rem",boxShadow:"0 1px 6px var(--shadow)"
              }}>
                <div style={{fontSize:"0.6rem",letterSpacing:"2px",textTransform:"uppercase",color:"var(--ink-light)",fontFamily:"var(--f-label)",fontWeight:700,marginBottom:"0.4rem"}}>{label}</div>
                <div style={{fontFamily:"var(--f-display)",fontSize: typeof val === "number" ? "2rem" : "0.85rem",fontWeight:700,color}}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="ledger-table-wrap">
          <div className="ledger-header-row">
            <div className="ledger-header-cell">#</div>
            <div className="ledger-header-cell">Student</div>
            <div className="ledger-header-cell">Degree / Field</div>
            <div className="ledger-header-cell">Institution</div>
            <div className="ledger-header-cell">Year</div>
            <div className="ledger-header-cell">Status</div>
          </div>

          {loading && (
            <div style={{padding:"3rem",textAlign:"center",fontFamily:"var(--f-mono)",fontSize:"0.8rem",color:"var(--ink-light)"}}>
              Loading from blockchain…
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="ledger-empty">
              <div className="ledger-empty-icon">📭</div>
              <div className="ledger-empty-text">
                {certificates.length === 0
                  ? "No certificates have been issued yet."
                  : "No certificates match your search."}
              </div>
              {certificates.length === 0 && (
                <div style={{marginTop:"0.75rem",fontSize:"0.8rem",color:"var(--ink-light)"}}>
                  Issue the first certificate to populate the registry.
                </div>
              )}
            </div>
          )}

          {!loading && filtered.map((cert, i) => (
            <div className="ledger-row" key={cert.id || i} style={{animationDelay:`${i*0.04}s`}}>
              <div className="ledger-num">{String(i+1).padStart(2,"0")}</div>
              <div>
                <div className="ledger-name">{cert.studentName}</div>
                <div style={{fontFamily:"var(--f-mono)",fontSize:"0.62rem",color:"var(--ink-light)",marginTop:"0.15rem"}}>
                  {cert.id?.slice(0,14)}…
                </div>
              </div>
              <div>
                <div className="ledger-deg" style={{fontStyle:"italic"}}>{cert.degree}</div>
                <div style={{fontSize:"0.73rem",color:"var(--indigo)",marginTop:"0.15rem"}}>{cert.field}</div>
              </div>
              <div className="ledger-uni">{cert.university}</div>
              <div className="ledger-year">{cert.year}</div>
              <div>
                <span className={`status-badge ${cert.verified ? "verified" : "pending"}`}>
                  {cert.verified ? "✓ Verified" : "⏳ Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Blockchain note */}
        <div style={{
          marginTop:"1.5rem",padding:"1rem 1.5rem",
          background:"white",border:"1px solid var(--rule)",
          display:"flex",alignItems:"center",gap:"1rem",
          fontFamily:"var(--f-mono)",fontSize:"0.72rem",color:"var(--ink-light)"
        }}>
          <span style={{fontSize:"1rem"}}>⛓</span>
          <span>All records are stored immutably on <strong style={{color:"var(--indigo)"}}>Ethereum Sepolia Testnet</strong>. Once issued, a certificate cannot be altered or deleted.</span>
        </div>
      </div>
    </div>
  );
}
