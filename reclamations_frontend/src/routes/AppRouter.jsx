import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../features/auth/Login.jsx";
import Inscription from "../features/auth/Inscription.jsx";
import ProtectedRoute from "../auth/ProtectedRoute.jsx";
import AppLayout from "../components/layout/AppLayout.jsx";
import CitoyenHome from "../features/citoyen/CitoyenHome.jsx";
import NouvelleReclamation from "../features/citoyen/NouvelleReclamation.jsx";
import ReclamationDetail from "../features/citoyen/ReclamationDetail.jsx";
import AgentHome from "../features/agent/AgentHome.jsx";
import SuperviseurHome from "../features/superviseur/SuperviseurHome.jsx";
import AdministrateurHome from "../features/administrateur/AdministrateurHome.jsx";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/inscription" element={<Inscription />} />

        <Route element={<AppLayout />}>
          <Route
            path="/citoyen"
            element={
              <ProtectedRoute allowedRoles={["CITOYEN"]}>
                <CitoyenHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citoyen/nouvelle-reclamation"
            element={
              <ProtectedRoute allowedRoles={["CITOYEN"]}>
                <NouvelleReclamation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citoyen/reclamations/:id"
            element={
              <ProtectedRoute allowedRoles={["CITOYEN"]}>
                <ReclamationDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent"
            element={
              <ProtectedRoute allowedRoles={["AGENT"]}>
                <AgentHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superviseur"
            element={
              <ProtectedRoute allowedRoles={["SUPERVISEUR", "DECIDEUR"]}>
                <SuperviseurHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/administrateur"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATEUR"]}>
                <AdministrateurHome />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;