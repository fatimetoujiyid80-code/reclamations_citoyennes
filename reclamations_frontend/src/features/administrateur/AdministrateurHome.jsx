import { Link } from "react-router-dom";

const SECTIONS_ADMINISTRATION = [
  { label: "Catégories", path: "/administrateur/categories" },
  { label: "Services", path: "/administrateur/services" },
  { label: "Zones", path: "/administrateur/zones" },
  { label: "Règles d'affectation", path: "/administrateur/regles-affectation" },
  { label: "Utilisateurs", path: "/administrateur/utilisateurs" },
];

function AdministrateurHome() {
  return (
    <div>
      <h1>Administration</h1>
      <p>Gestion des ressources de la plateforme.</p>

      <ul>
        {SECTIONS_ADMINISTRATION.map((section) => (
          <li key={section.path}>
            <Link to={section.path}>{section.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdministrateurHome;