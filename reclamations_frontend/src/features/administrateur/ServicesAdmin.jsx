import { useEffect, useState } from "react";
import {
  listerServices,
  creerService,
  modifierService,
  supprimerService,
} from "../../api/accountsApi";

const FORM_VIDE = { nom: "", description: "", actif: true };

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

function ServicesAdmin() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  const [form, setForm] = useState(FORM_VIDE);
  const [editingId, setEditingId] = useState(null);
  const [formErreur, setFormErreur] = useState("");
  const [formSuccesMessage, setFormSuccesMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [suppressionEnCoursId, setSuppressionEnCoursId] = useState(null);
  const [suppressionErreur, setSuppressionErreur] = useState("");
  const [suppressionSuccesMessage, setSuppressionSuccesMessage] = useState("");

  useEffect(() => {
    let annule = false;

    async function chargerInitial() {
      try {
        const data = await listerServices();
        if (!annule) {
          setServices(data.results);
        }
      } catch {
        if (!annule) {
          setErreur("Impossible de charger les services.");
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

  const rechargerListe = async () => {
    setLoading(true);
    setErreur("");
    try {
      const data = await listerServices();
      setServices(data.results);
    } catch {
      setErreur("Impossible de charger les services.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const commencerEdition = (service) => {
    setEditingId(service.id);
    setForm({ nom: service.nom, description: service.description || "", actif: service.actif });
    setFormErreur("");
    setFormSuccesMessage("");
  };

  const annulerEdition = () => {
    setEditingId(null);
    setForm(FORM_VIDE);
    setFormErreur("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormErreur("");
    setFormSuccesMessage("");
    setSubmitting(true);
    try {
      if (editingId) {
        await modifierService(editingId, form);
        setFormSuccesMessage("Service modifié avec succès.");
      } else {
        await creerService(form);
        setFormSuccesMessage("Service créé avec succès.");
      }
      setForm(FORM_VIDE);
      setEditingId(null);
      await rechargerListe();
    } catch (err) {
      setFormErreur(extraireMessageErreur(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupprimer = async (service) => {
    const confirmation = window.confirm(
      `Supprimer définitivement le service "${service.nom}" ? Cette action est irréversible.`
    );
    if (!confirmation) {
      return;
    }
    setSuppressionErreur("");
    setSuppressionSuccesMessage("");
    setSuppressionEnCoursId(service.id);
    try {
      await supprimerService(service.id);
      setSuppressionSuccesMessage(`Service "${service.nom}" supprimé avec succès.`);
      if (editingId === service.id) {
        annulerEdition();
      }
      await rechargerListe();
    } catch (err) {
      setSuppressionErreur(extraireMessageErreur(err));
    } finally {
      setSuppressionEnCoursId(null);
    }
  };

  return (
    <div>
      <h1>Gestion des services</h1>

      <h2>{editingId ? "Modifier le service" : "Créer un service"}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nom">Nom</label>
          <input id="nom" name="nom" type="text" value={form.nom} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="actif">
            <input id="actif" name="actif" type="checkbox" checked={form.actif} onChange={handleChange} />
            {" "}Actif
          </label>
        </div>

        {formErreur && <p style={{ color: "red" }}>{formErreur}</p>}
        {formSuccesMessage && <p style={{ color: "green" }}>{formSuccesMessage}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Envoi..." : editingId ? "Enregistrer les modifications" : "Créer"}
        </button>
        {editingId && (
          <button type="button" onClick={annulerEdition} disabled={submitting}>
            Annuler
          </button>
        )}
      </form>

      <h2>Services existants</h2>
      {loading && <p>Chargement...</p>}
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {suppressionErreur && <p style={{ color: "red" }}>{suppressionErreur}</p>}
      {suppressionSuccesMessage && <p style={{ color: "green" }}>{suppressionSuccesMessage}</p>}

      {!loading && !erreur && (
        <>
          {services.length === 0 ? (
            <p>Aucun service pour le moment.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Nom</th>
                  <th style={{ textAlign: "left" }}>Description</th>
                  <th style={{ textAlign: "left" }}>Actif</th>
                  <th style={{ textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td>{s.nom}</td>
                    <td>{s.description || "—"}</td>
                    <td>{s.actif ? "Oui" : "Non"}</td>
                    <td>
                      <button type="button" onClick={() => commencerEdition(s)}>
                        Modifier
                      </button>{" "}
                      <button
                        type="button"
                        onClick={() => handleSupprimer(s)}
                        disabled={suppressionEnCoursId === s.id}
                      >
                        {suppressionEnCoursId === s.id ? "Suppression..." : "Supprimer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default ServicesAdmin;