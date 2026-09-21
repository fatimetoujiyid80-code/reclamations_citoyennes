import { useEffect, useState } from "react";
import { listerNotifications } from "../../api/notificationsApi";

function NotificationsList() {
  const [donnees, setDonnees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    let annule = false;

    async function chargerInitial() {
      try {
        const data = await listerNotifications();
        if (!annule) {
          setDonnees(data);
        }
      } catch {
        if (!annule) {
          setErreur("Impossible de charger vos notifications.");
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
      const data = await listerNotifications(url);
      setDonnees(data);
    } catch {
      setErreur("Impossible de charger vos notifications.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Mes notifications</h1>

      {loading && <p>Chargement...</p>}
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      {!loading && !erreur && donnees && (
        <>
          {donnees.count === 0 ? (
            <p>Vous n'avez aucune notification pour le moment.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Contenu</th>
                  <th style={{ textAlign: "left" }}>Canal</th>
                  <th style={{ textAlign: "left" }}>Statut d'envoi</th>
                  <th style={{ textAlign: "left" }}>Date d'envoi</th>
                  <th style={{ textAlign: "left" }}>Réclamation</th>
                </tr>
              </thead>
              <tbody>
                {donnees.results.map((n) => (
                  <tr key={n.id}>
                    <td>{n.contenu}</td>
                    <td>{n.canal}</td>
                    <td>{n.statut_envoi}</td>
                    <td>{n.date_envoi ? new Date(n.date_envoi).toLocaleString() : "—"}</td>
                    <td>{n.reclamation ? n.reclamation.numero_suivi : "—"}</td>
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

export default NotificationsList;