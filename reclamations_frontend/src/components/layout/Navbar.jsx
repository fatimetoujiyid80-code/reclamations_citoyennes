import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

const NAV_LINKS_PAR_ROLE = {
  CITOYEN: [{ label: "Accueil", path: "/citoyen" }],
  AGENT: [{ label: "Accueil", path: "/agent" }],
  SUPERVISEUR: [{ label: "Accueil", path: "/superviseur" }],
  DECIDEUR: [{ label: "Accueil", path: "/superviseur" }],
  ADMINISTRATEUR: [{ label: "Accueil", path: "/administrateur" }],
};

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const liens = user ? NAV_LINKS_PAR_ROLE[user.role] || [] : [];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav style={{ display: "flex", justifyContent: "space-between", padding: "1rem", borderBottom: "1px solid #ccc" }}>
      <div style={{ display: "flex", gap: "1rem" }}>
        {liens.map((lien) => (
          <Link key={lien.path} to={lien.path}>
            {lien.label}
          </Link>
        ))}
      </div>
      {user && (
        <div>
          <span style={{ marginRight: "1rem" }}>
            {user.prenom} {user.nom} ({user.role})
          </span>
          <button onClick={handleLogout}>Déconnexion</button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;