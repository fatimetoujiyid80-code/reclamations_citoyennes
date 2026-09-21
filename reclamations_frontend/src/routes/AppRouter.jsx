import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../features/auth/Login.jsx";
import Inscription from "../features/auth/Inscription.jsx";

import ProtectedRoute from "../auth/ProtectedRoute.jsx";
import AppLayout from "../components/layout/AppLayout.jsx";

// Citoyen
import CitoyenHome from "../features/citoyen/CitoyenHome.jsx";
import NouvelleReclamation from "../features/citoyen/NouvelleReclamation.jsx";
import ReclamationDetail from "../features/citoyen/ReclamationDetail.jsx";
import NotificationsList from "../features/citoyen/NotificationsList.jsx";

// Agent
import AgentHome from "../features/agent/AgentHome.jsx";
import AgentReclamationDetail from "../features/agent/AgentReclamationDetail.jsx";

// Superviseur / Décideur
import SuperviseurHome from "../features/superviseur/SuperviseurHome.jsx";
import SuperviseurReclamationDetail from "../features/superviseur/SuperviseurReclamationDetail.jsx";
import SuperviseurDashboard from "../features/superviseur/SuperviseurDashboard.jsx";

// Administrateur
import AdministrateurHome from "../features/administrateur/AdministrateurHome.jsx";
import CategoriesAdmin from "../features/administrateur/CategoriesAdmin.jsx";
import ServicesAdmin from "../features/administrateur/ServicesAdmin.jsx";
import ZonesAdmin from "../features/administrateur/ZonesAdmin.jsx";
import ReglesAffectationAdmin from "../features/administrateur/ReglesAffectationAdmin.jsx";
import UtilisateursAdmin from "../features/administrateur/UtilisateursAdmin.jsx";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==================== ROUTES PUBLIQUES ==================== */}

        <Route path="/login" element={<Login />} />

        <Route path="/inscription" element={<Inscription />} />


        {/* ==================== ROUTES PROTÉGÉES ==================== */}

        <Route element={<AppLayout />}>

          {/* ==================== CITOYEN ==================== */}

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
            path="/citoyen/notifications"
            element={
              <ProtectedRoute allowedRoles={["CITOYEN"]}>
                <NotificationsList />
              </ProtectedRoute>
            }
          />


          {/* ==================== AGENT ==================== */}

          <Route
            path="/agent"
            element={
              <ProtectedRoute allowedRoles={["AGENT"]}>
                <AgentHome />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent/reclamations/:id"
            element={
              <ProtectedRoute allowedRoles={["AGENT"]}>
                <AgentReclamationDetail />
              </ProtectedRoute>
            }
          />


          {/* ==================== SUPERVISEUR / DECIDEUR ==================== */}

          <Route
            path="/superviseur"
            element={
              <ProtectedRoute allowedRoles={["SUPERVISEUR", "DECIDEUR"]}>
                <SuperviseurHome />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superviseur/reclamations/:id"
            element={
              <ProtectedRoute allowedRoles={["SUPERVISEUR", "DECIDEUR"]}>
                <SuperviseurReclamationDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superviseur/dashboard"
            element={
              <ProtectedRoute allowedRoles={["SUPERVISEUR", "DECIDEUR"]}>
                <SuperviseurDashboard />
              </ProtectedRoute>
            }
          />


          {/* ==================== ADMINISTRATEUR ==================== */}

          <Route
            path="/administrateur"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATEUR"]}>
                <AdministrateurHome />
              </ProtectedRoute>
            }
          />

          <Route
            path="/administrateur/categories"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATEUR"]}>
                <CategoriesAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/administrateur/services"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATEUR"]}>
                <ServicesAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/administrateur/zones"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATEUR"]}>
                <ZonesAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/administrateur/regles-affectation"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATEUR"]}>
                <ReglesAffectationAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/administrateur/utilisateurs"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATEUR"]}>
                <UtilisateursAdmin />
              </ProtectedRoute>
            }
          />

        </Route>


        {/* ==================== REDIRECTIONS ==================== */}

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;