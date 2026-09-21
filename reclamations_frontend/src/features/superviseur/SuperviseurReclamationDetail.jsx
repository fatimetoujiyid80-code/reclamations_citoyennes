import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  obtenirReclamation,
  changerStatutReclamation,
  reaffecterReclamation,
} from "../../api/reclamationsApi";
import { listerServices } from "../../api/accountsApi";
import { useAuth } from "../../auth/useAuth";
import StatutBadge from "../../components/ui/StatutBadge.jsx";

const TOUS_LES_STATUTS = [
  "NOUVELLE",
  "RECUE",
  "AFFECTEE",
  "EN_COURS",
  "RESOLUE",
  "CLOTUREE",
  "REJETEE",
];

function extraireMessageErreur(err) {
  if (!err.response || !err.response.data) {
    return "Une erreur est survenue.";
  }
  const data = err.response.data;
  const messages = [];
  Object.values(data).forEach((valeur) => {
    if (Array.isArray(valeur)) {
      messages.push(...valeur);
    } else {
      messages.push(String(valeur));
    }
  });
  return messages.length ? messages.join(" ") : "Une erreur est survenue.";
}

function SuperviseurReclamationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const peutModifierReclamation = user?.role === "SUPERVISEUR";

  const [reclamation, setReclamation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  const [nouveauStatut, setNouveauStatut] = useState(TOUS_LES_STATUTS[0]);
  const [commentaire, setCommentaire] = useState("");
  const [changementErreur, setChangementErreur] = useState("");
  const [changementSuccesMessage, setChangementSuccesMessage] = useState("");
  const [changementSubmitting, setChangementSubmitting] = useState(false);

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(peutModifierReclamation);
  const [servicesErreur, setServicesErreur] = useState("");
  const [serviceChoisi, setServiceChoisi] = useState("");
  const [reaffectationErreur, setReaffectationErreur] = useState("");
  const [reaffectationSuccesMessage, setReaffectationSuccesMessage] = useState("");
  const [reaffectationSubmitting, setReaffectationSubmitting] = useState(false);

  useEffect(() => {
    let annule = false;

    async function chargerDetail() {
      setLoading(true);
      setErreur("");
      try {
        const data = await obtenirReclamation(id);
        if (!annule) {
          setReclamation(data);
        }
      } catch (err) {
        if (!annule) {
          if (err.response && err.response.status === 404) {
            setErreur("Cette réclamation n'existe pas ou n'est pas accessible.");
          } else {
            setErreur("Impossible de charger cette réclamation.");
          }
        }
      } finally {
        if (!annule) {
          setLoading(false);
        }
      }
    }

    chargerDetail();

    return () => {
      annule = true;
    };
  }, [id]);

  useEffect(() => {
    if (!peutModifierReclamation) {
      return undefined;
    }

    let annule = false;

    async function chargerServices() {
      try {
        const data = await listerServices();
        if (!annule) {
          setServices(data.results);
          if (data.results.length > 0) {
            setServiceChoisi(data.results[0].id);
          }
        }
      } catch {
        if (!annule) {
          setServicesErreur("Impossible de charger la liste des services.");
        }
      } finally {
        if (!annule) {
          setServicesLoading(false);
        }
      }
    }

    chargerServices();

    return () => {
      annule = true;
    };
  }, [peutModifierReclamation]);

  const handleChangerStatut = async (event) => {
    event.preventDefault();
    setChangementErreur("");
    setChangementSuccesMessage("");
    setChangementSubmitting(true);
    try {
      const data = await changerStatutReclamation(id, nouveauStatut, commentaire);
      setReclamation(data);
      setCommentaire("");
      setChangementSuccesMessage("Statut mis à jour avec succès.");
    } catch (err) {
      setChangementErreur(extraireMessageErreur(err));
    } finally {
      setChangementSubmitting(false);
    }
  };

  const handleReaffecter = async (event) => {
    event.preventDefault();
    setReaffectationErreur("");
    setReaffectationSuccesMessage("");
    setReaffectationSubmitting(true);
    try {
      const data = await reaffecterReclamation(id, serviceChoisi);
      setReclamation(data);
      setReaffectationSuccesMessage("Réclamation réaffectée avec succès.");
    } catch (err) {
      setReaffectationErreur(extraireMessageErreur(err));
    } finally {
      setReaffectationSubmitting(false);
    }
  };

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (erreur) {
    return (
      <div>
        <p style={{ color: "red" }}>{erreur}</p>
        <Link to="/superviseur">&larr; Retour à la liste</Link>
      </div>
    );
  }

  if (!reclamation) {
    return null;
  }

  return (
    <div>
      <p>
        <Link to="/superviseur">&larr; Retour à la liste</Link>
      </p>

      <h1>{reclamation.titre}</h1>
      <p>N° de suivi : {reclamation.numero_suivi}</p>
      <p>
        Statut : <StatutBadge statut={reclamation.statut} />
      </p>
      <p>Catégorie : {reclamation.categorie?.nom}</p>
      <p>Description : {reclamation.description}</p>
      <p>Adresse : {reclamation.adresse_approx || "Non renseignée"}</p>
      <p>
        Position : {reclamation.latitude}, {reclamation.longitude}
      </p>
      <p>Zone : {reclamation.zone?.nom || "Non affectée"}</p>
      <p>Service : {reclamation.service?.nom || "Non affecté"}</p>
      <p>
        Agent en charge :{" "}
        {reclamation.agent ? `${reclamation.agent.prenom} ${reclamation.agent.nom}` : "Non affecté"}
      </p>
      <p>
        Citoyen : {reclamation.citoyen ? `${reclamation.citoyen.prenom} ${reclamation.citoyen.nom}` : "—"}
      </p>
      <p>Créée le : {new Date(reclamation.date_creation).toLocaleString()}</p>
      <p>Dernière mise à jour : {new Date(reclamation.date_maj).toLocaleString()}</p>
      {reclamation.date_cloture && (
        <p>Clôturée le : {new Date(reclamation.date_cloture).toLocaleString()}</p>
      )}
      {reclamation.note_citoyen !== null && <p>Évaluation du citoyen : {reclamation.note_citoyen} / 5</p>}

      <h2>Historique</h2>
      {reclamation.historique.length === 0 ? (
        <p>Aucun changement de statut pour le moment.</p>
      ) : (
        <ul>
          {reclamation.historique.map((h) => (
            <li key={h.id}>
              {h.ancien_statut || "—"} → {h.nouveau_statut} le {new Date(h.date_changement).toLocaleString()}
              {h.commentaire ? ` — ${h.commentaire}` : ""}
            </li>
          ))}
        </ul>
      )}

      <h2>Médias</h2>
      {reclamation.medias.length === 0 ? (
        <p>Aucune photo ou vidéo pour le moment.</p>
      ) : (
        <ul>
          {reclamation.medias.map((m) => (
            <li key={m.id}>
              {m.type_media} — {(m.taille_octets / 1024).toFixed(0)} Ko
            </li>
          ))}
        </ul>
      )}

      {peutModifierReclamation && (
        <>
          <h2>Changer le statut</h2>
          <form onSubmit={handleChangerStatut}>
            <label htmlFor="statut">Nouveau statut</label>
            <select id="statut" value={nouveauStatut} onChange={(e) => setNouveauStatut(e.target.value)}>
              {TOUS_LES_STATUTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div>
              <label htmlFor="commentaire">Commentaire (facultatif)</label>
              <textarea
                id="commentaire"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
              />
            </div>

            {changementErreur && <p style={{ color: "red" }}>{changementErreur}</p>}
            {changementSuccesMessage && <p style={{ color: "green" }}>{changementSuccesMessage}</p>}

            <button type="submit" disabled={changementSubmitting}>
              {changementSubmitting ? "Envoi..." : "Valider le changement de statut"}
            </button>
          </form>

          <h2>Réaffecter à un service</h2>
          {servicesLoading && <p>Chargement des services...</p>}
          {servicesErreur && <p style={{ color: "red" }}>{servicesErreur}</p>}
          {!servicesLoading && !servicesErreur && (
            <form onSubmit={handleReaffecter}>
              <label htmlFor="service">Nouveau service</label>
              <select id="service" value={serviceChoisi} onChange={(e) => setServiceChoisi(e.target.value)}>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom}
                  </option>
                ))}
              </select>

              {reaffectationErreur && <p style={{ color: "red" }}>{reaffectationErreur}</p>}
              {reaffectationSuccesMessage && <p style={{ color: "green" }}>{reaffectationSuccesMessage}</p>}

              <button type="submit" disabled={reaffectationSubmitting || services.length === 0}>
                {reaffectationSubmitting ? "Envoi..." : "Réaffecter"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default SuperviseurReclamationDetail;