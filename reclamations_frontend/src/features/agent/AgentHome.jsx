import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listerMesReclamations } from "../../api/reclamationsApi";
import StatutBadge from "../../components/ui/StatutBadge.jsx";

function AgentHome() {
  const navigate = useNavigate();

  const [donnees, setDonnees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    let annule = false;

    async function chargerInitial() {
      try {
        const data = await listerMesReclamations();
        if (!annule) {
          setDonnees(data);
        }
      } catch {
        if (!annule) {
          setErreur("Impossible de charger les réclamations de votre service.");
        }
      } finally {
        if (!annule) {
          setLoading(false);
        }
      }
    }

    chargerInitial();

    return () => {
      annule = true;
    };
  }, []);

  const charger = async (url) => {
    setLoading(true);
    setErreur("");
    try {
      const data = await listerMesReclamations(url);
      setDonnees(data);
    } catch {
      setErreur("Impossible de charger les réclamations de votre service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Réclamations de mon service</h1>

      {loading && <p>Chargement...</p>}
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      {!loading && !erreur && donnees && (
        <>
          {donnees.count === 0 ? (
            <p>Aucune réclamation affectée à votre service pour le moment.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>N° de suivi</th>
                  <th style={{ textAlign: "left" }}>Titre</th>
                  <th style={{ textAlign: "left" }}>Catégorie</th>
                  <th style={{ textAlign: "left" }}>Statut</th>
                  <th style={{ textAlign: "left" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {donnees.results.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/agent/reclamations/${r.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{r.numero_suivi}</td>
                    <td>{r.titre}</td>
                    <td>{r.categorie?.nom}</td>
                    <td>
                      <StatutBadge statut={r.statut} />
                    </td>
                    <td>{new Date(r.date_creation).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
            <button onClick={() => charger(donnees.previous)} disabled={!donnees.previous}>
              Précédent
            </button>
            <button onClick={() => charger(donnees.next)} disabled={!donnees.next}>
              Suivant
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AgentHome;