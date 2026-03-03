import io

content = """import React from "react";
import { NavLink } from "react-router-dom";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="layout">
    <div className="announcement-bar">
      <strong>MintonDex Analytics</strong> |
      Real-time on-chain data for
      <a href="https://mintondex.com" target="_blank" rel="noopener noreferrer"> mintondex.com</a>
      |
      <a href="https://explorer.shardeum.org/address/0x13B94479b80bcC600B46A14BEbCE378DA16210d6" target="_blank" rel="noopener noreferrer"> Verified Contracts</a>
    </div>
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        <span className="dot" />
        MintonDex <span style={{ fontWeight: 400, opacity: 0.7 }}>Analytics</span>
      </NavLink>
      <ul className="navbar-nav">
        <li><NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>Overview</NavLink></li>
        <li><NavLink to="/pools" className={({ isActive }) => isActive ? "active" : ""}>Pools</NavLink></li>
        <li><NavLink to="/tokens" className={({ isActive }) => isActive ? "active" : ""}>Tokens</NavLink></li>
        <li><a href="https://mintondex.com" target="_blank" rel="noopener noreferrer">Trade</a></li>
      </ul>
      <span className="navbar-badge">Shardeum</span>
    </nav>
    <main className="main-content">{children}</main>
    <footer className="analytics-footer">
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 14, background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        MintonDex Analytics
      </div>
      <div className="footer-links">
        <a href="https://mintondex.com" target="_blank" rel="noopener noreferrer">Trade</a>
        <a href="https://github.com/BrunoMarshall/MintonDex" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="https://explorer.shardeum.org" target="_blank" rel="noopener noreferrer">Explorer</a>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
        2025 MintonDex - analytics.mintondex.com
      </div>
    </footer>
  </div>
);
export default Layout;
"""

with io.open("C:/mintondex/frontend/src/components/Layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("saved Layout.tsx, length:", len(content))
