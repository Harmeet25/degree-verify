const NAV = [
  { id: "home",     icon: "🏛",  label: "Portal Home"    },
  { id: "admin",    icon: "⚙️",  label: "Admin Panel"    },
  { id: "student",  icon: "🎓",  label: "Student Panel"  },
  { id: "employer", icon: "🔍",  label: "Employer Verify" },
];

export default function Sidebar({ page, setPage, wallet }) {
  const fmt = a => a ? `${a.slice(0,6)}···${a.slice(-4)}` : null;

  return (
    <aside className="sidebar">
      <div className="sidebar-crest">
        <div className="crest-seal">🎓</div>
        <div className="crest-title">Academic<br/>Credential Chain</div>
        <div className="crest-sub">Blockchain Registry</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV.map(n => (
          <button
            key={n.id}
            className={`nav-item ${page === n.id ? "active" : ""}`}
            onClick={() => setPage(n.id)}
          >
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{n.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-wallet">
        {wallet ? (
          <>
            <div className="wallet-status">Connected Wallet</div>
            <div className="wallet-addr">
              <span className="wallet-dot" />
              {wallet}
            </div>
          </>
        ) : (
          <>
            <div className="wallet-status">Wallet Status</div>
            <div className="wallet-addr" style={{color:"rgba(184,146,42,0.4)",fontStyle:"italic"}}>
              Not connected
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
