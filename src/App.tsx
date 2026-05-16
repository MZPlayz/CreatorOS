import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "@/features/dashboard/layouts/DashboardLayout";
import OverviewPage from "@/features/dashboard/pages/OverviewPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="clients" element={<div>Clients Feature coming soon...</div>} />
          <Route path="invoices" element={<div>Invoices Feature coming soon...</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
