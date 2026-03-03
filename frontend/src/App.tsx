import React from "react";
import { ApolloProvider } from "@apollo/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { client } from "./graphql/queries";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import PoolsPage from "./pages/PoolsPage";
import PoolDetailPage from "./pages/PoolDetailPage";
import TokenDetailPage from "./pages/TokenDetailPage";
import TokensPage from "./pages/TokensPage";
import "./styles/global.css";

function App() {
  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pools" element={<PoolsPage />} />
            <Route path="/pools/:poolId" element={<PoolDetailPage />} />
            <Route path="/tokens/:tokenId" element={<TokenDetailPage />} />
            <Route path="/tokens" element={<TokensPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ApolloProvider>
  );
}
export default App;
