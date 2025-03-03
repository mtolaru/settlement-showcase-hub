
import SubmitSettlementPage from "./settlement/SubmitSettlementPage";
import { useEffect } from "react";

const SubmitSettlement = () => {
  useEffect(() => {
    console.log("SubmitSettlement page mounted");
  }, []);
  
  return <SubmitSettlementPage />;
};

export default SubmitSettlement;
