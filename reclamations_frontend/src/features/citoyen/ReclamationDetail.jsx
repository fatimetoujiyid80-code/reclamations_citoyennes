import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  obtenirReclamation,
  evaluerReclamation,
  ajouterMediaReclamation,
} from "../../api/reclamationsApi";
import StatutBadge from "../../components/ui/StatutBadge.jsx";

function extraireMessageErreur(err) {
  if (!err.response || !err.response.data) {
    return "Une erreur est survenue lors de l'envoi du fichier.";
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
  return messages.length ? messages.join(" ") : "Une erreur est survenue lors de l'envoi du fichier.";
}

function ReclamationDetail() {
  const { id } = useParams();

  const [reclamation, setReclamation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  const [note, setNote] = useState("5");
  const [evaluationErreur, setEvaluationErreur] = useState("");
  const [evaluationSubmitting, setEvaluationSubmitting] = useState(false);

  const [fichierSelectionne, setFichierSelectionne] = useState(null);
  const [uploadErreur, setUploadErreur] = useState("");
  const [uploadSucces, setUploadSucces] = useState(false);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [inputKey, setInputKey] = useState(0);

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
            setErreur("Cette réclamation n'existe pas ou ne vous appartient pas.");
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

  const handleEvaluer = async (event) => {
    event.preventDefault();
    setEvaluationErreur("");
    setEvaluationSubmitting(true);
    try {
      const data = await evaluerReclamation(id, parseInt(note, 10));
      setReclamation(data);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.note_citoyen) {
        setEvaluationErreur(err.response.data.note_citoyen.join(" "));
      } else if (err.response && err.response.data && err.response.data.detail) {
        setEvaluationErreur(err.response.data.detail);
      } else {
        setEvaluationErreur("Impossible d'enregistrer votre évaluation.");
      }
    } finally {
      setEvaluationSubmitting(false);
    }
  };

  const handleFichierChange = (event) => {
    setFichierSelectionne(event.target.files[0] || null);
    setUploadErreur("");
    setUploadSucces(false);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!fichierSelectionne) {
      setUploadErreur("Veuillez sélectionner un fichier.");
      return;
    }
    setUploadErreur("");
    setUploadSucces(false);
    setUploadSubmitting(true);
    try {
      await ajouterMediaReclamation(id, fichierSelectionne);
      const data = await obtenirReclamation(id);
      setReclamation(data);
      setFichierSelectionne(null);
      setInputKey((k) => k + 1); // force la réinitialisation visuelle de l'input file
      setUploadSucces(true);
    } catch (err) {
      setUploadErreur(extraireMessageErreur(err));
    } finally {
      setUploadSubmitting(false);
    }
  };

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (erreur) {
    return (
      <div>
        <p style={{ color: "red" }}>{erreur}</p>
        <Link to="/citoyen">&larr; Retour à mes réclamations</Link>
      </div>
    );
  }

  if (!reclamation) {
    return null;
  }

  const peutEvaluer = reclamation.statut === "CLOTUREE" && reclamation.note_citoyen === null;
  const typeDetecte = fichierSelectionne
    ? fichierSelectionne.type.startsWith("video/")
      ? "Vidéo"
      : "Photo"
    : null;

  return (
    <div>
      <p>
        <Link to="/citoyen">&larr; Retour à mes réclamations</Link>
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
      <p>Créée le : {new Date(reclamation.date_creation).toLocaleString()}</p>
      <p>Dernière mise à jour : {new Date(reclamation.date_maj).toLocaleString()}</p>
      {reclamation.date_cloture && (
        <p>Clôturée le : {new Date(reclamation.date_cloture).toLocaleString()}</p>
      )}
      {reclamation.note_citoyen !== null && <p>Votre évaluation : {reclamation.note_citoyen} / 5</p>}

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

      <h3>Ajouter une photo ou une vidéo</h3>
      <form onSubmit={handleUpload}>
        <input
          key={inputKey}
          type="file"
          accept="image/*,video/*"
          onChange={handleFichierChange}
        />
        {typeDetecte && <p>Type détecté : {typeDetecte}</p>}
        {uploadErreur && <p style={{ color: "red" }}>{uploadErreur}</p>}
        {uploadSucces && <p style={{ color: "green" }}>Média ajouté avec succès.</p>}
        <button type="submit" disabled={uploadSubmitting}>
          {uploadSubmitting ? "Envoi..." : "Envoyer"}
        </button>
      </form>

      {peutEvaluer && (
        <div>
          <h2>Évaluer cette réclamation</h2>
          <form onSubmit={handleEvaluer}>
            <label htmlFor="note">Note (1 à 5)</label>
            <select id="note" value={note} onChange={(e) => setNote(e.target.value)}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            {evaluationErreur && <p style={{ color: "red" }}>{evaluationErreur}</p>}
            <button type="submit" disabled={evaluationSubmitting}>
              {evaluationSubmitting ? "Envoi..." : "Envoyer mon évaluation"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ReclamationDetail;