import React from "react";

const WSHM = "0x73653a3fb19e2b8ac5f88f1603eeb7ba164cfbeb";
const SHM_LOGO = "/logos/shm.png";

const ADDRESS_TO_LOGO: Record<string, string> = {
  "0x73653a3fb19e2b8ac5f88f1603eeb7ba164cfbeb": "/logos/wshm.png",
  "0x171e6e0ede6068d7c01bb8ec55f0dc6c6ba97f36": "/logos/0x171E6e0EdE6068d7c01bB8ec55f0dC6C6Ba97F36.png",
  "0x51a1d48cb931618ae4b4a8fb6f52894528b38823": "/logos/0x51a1d48cB931618aE4B4a8Fb6F52894528b38823.png",
  "0x5e83f20a01b1cee8dfd97bb1806b22386e674f23": "/logos/0x5e83f20a01b1cEE8DFD97Bb1806B22386e674F23.png",
  "0xb0691b025e285f0cd2e6d4e86935f4fd72224c86": "/logos/0xb0691B025e285f0cD2e6D4E86935f4FD72224c86.png",
  "0xd721e0c5b48b25878ba9dc9c12f0239063480be1": "/logos/0xd721E0C5b48B25878bA9DC9C12F0239063480be1.png",
  "0xe2234da68012adfd0f788fcbe2563bf0c49b31f1": "/logos/0xe2234da68012aDFD0F788FcBE2563BF0C49B31f1.png",
};

interface TokenIconProps {
  address?: string;
  symbol?: string;
  size?: number;
  isSHM?: boolean;
}

const TokenIcon: React.FC<TokenIconProps> = ({ address, symbol, size = 30, isSHM = false }) => {
  const logoUrl = isSHM
    ? SHM_LOGO
    : address
    ? ADDRESS_TO_LOGO[address.toLowerCase()]
    : undefined;

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={symbol ?? "token"}
        style={{
          width: size, height: size, borderRadius: "50%",
          border: "2px solid white",
          boxShadow: "0 2px 8px rgba(102,126,234,0.3)",
          objectFit: "cover", background: "white",
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      border: "2px solid white",
      boxShadow: "0 2px 8px rgba(102,126,234,0.3)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 800, color: "white",
      fontFamily: "var(--font-heading)", flexShrink: 0,
    }}>
      {symbol?.slice(0, 2) ?? "?"}
    </div>
  );
};

export default TokenIcon;
