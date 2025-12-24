import CommissionerLogin from "./pages/CommissionerLogin";
import Quiz from "./pages/Quiz";
import AdminDashboard from "./pages/AdminDashboard";
import { useState } from "react";

function App() {
  const [commissionerId, setCommissionerId] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  if (showAdmin) {
    return <AdminDashboard onHome={() => setShowAdmin(false)} />;
  }

  return commissionerId ? (
    <Quiz commissionerId={commissionerId} />
  ) : (
    <CommissionerLogin onLogin={setCommissionerId} onAdminClick={() => setShowAdmin(true)} />
  );
}

export default App;
