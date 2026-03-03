import React from "react";
import { NavLink } from "react-router-dom";
const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <div className="layout">
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand"><span className="dot" />MINTONDEX <span style={{color:"var(--text-muted)",fontWeight:400}}>Analytics</span></NavLink>
      <ul className="navbar-nav">
        <li><NavLink to="/" end className={({isActive})=>isActive?"active":""}>Overview</NavLink></li>
        <li><NavLink to="/pools" className={({isActive})=>isActive?"active":""}>Pools</NavLink></li>
        <li><NavLink to="/tokens" className={({isActive})=>isActive?"active":""}>Tokens</NavLink></li>
        <li><a href="https://mintondex.com" target="_blank" rel="noopener noreferrer">Trade</a></li>
      </ul>
      <span className="navbar-badge">Shardeum</span>
    </nav>
    <main className="main-content">{children}</main>
    <footer style={{borderTop:"1px solid var(--border)",padding:"20px 24px",textAlign:"center",color:"var(--text-muted)",fontSize:12}}>
      {new Date().getFullYear()} Mintondex Analytics
    </footer>
  </div>
);
export default Layout;
