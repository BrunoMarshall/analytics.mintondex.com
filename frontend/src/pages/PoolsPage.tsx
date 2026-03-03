import React from "react";
import { useQuery } from "@apollo/client";
import { POOLS_QUERY } from "../graphql/queries";
import PoolsTable from "../components/PoolsTable";
const PoolsPage: React.FC = () => {
  const { data, loading, error } = useQuery(POOLS_QUERY, { variables: { first: 100, skip: 0 } });
  return <div>
    <div className="page-header"><h1 className="page-title">Pools</h1><p className="page-subtitle">All liquidity pools on Mintondex, sorted by TVL</p></div>
    {error && <div className="error-state" style={{marginBottom:24}}><strong>Error loading pools</strong><p style={{marginTop:8,fontSize:12}}>{error.message}</p><p style={{marginTop:8,fontSize:11,color:"var(--text-muted)"}}>Check your subgraph URL in frontend/src/graphql/queries.ts</p></div>}
    <PoolsTable pools={data?.pairs??[]} loading={loading}/>
  </div>;
};
export default PoolsPage;
