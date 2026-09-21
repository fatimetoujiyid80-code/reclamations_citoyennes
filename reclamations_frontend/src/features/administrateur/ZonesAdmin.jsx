import { useEffect, useState } from "react";
import {
  listerZones,
  creerZone,
  modifierZone,
  supprimerZone,
  listerServices,
} from "../../api/accountsApi";

const FORM_VIDE = { nom: "", service: "" };

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

function ZonesAdmin() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesErreur, setServicesErreur] = useState("");

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
        const data = await listerZones();
        if (!annule) {
          setZones(data.results);
        }
      } catch {
        if (!annule) {
          setErreur("Impossible de charger les zones.");
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

  useEffect(() => {
    let annule = false;

    async function chargerServices() {
      try {
        const data = await listerServices();
        if (!annule) {
          setServices(data.results);
        }
      } catch {
        if (!annule) {
          setServicesErreur("Impossible de charger les services.");
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
  }, []);

  const rechargerListe = async () => {
    setLoading(true);
    setErreur("");
    try {
      const data = await listerZones();
      setZones(data.results);
    } catch {
      setErreur("Impossible de charger les zones.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const commencerEdition = (zone) => {
    setEditingId(zone.id);
    setForm({ nom: zone.nom, service: zone.service || "" });
    setFormErreur("");
    setFormSuccesMessage("");
  };

  const annulerEdition = () => {
    setEditingId(null);
    setForm(FORM_VIDE);
    setFormErreur("");
  };

  const construirePayload = () => ({
    nom: form.nom,
    service: form.service || null,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormErreur("");
    setFormSuccesMessage("");
    setSubmitting(true);
    try {
      if (editingId) {
        await modifierZone(editingId, construirePayload());
        setFormSuccesMessage("Zone modifiée avec succès.");
      } else {
        await creerZone(construirePayload());
        setFormSuccesMessage("Zone créée avec succès.");
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

  const handleSupprimer = async (zone) => {
    const confirmation = window.confirm(
      `Supprimer définitivement la zone "${zone.nom}" ? Toute règle d'affectation ciblant cette zone sera également supprimée. Cette action est irréversible.`
    );
    if (!confirmation) {
      return;
    }
    setSuppressionErreur("");
    setSuppressionSuccesMessage("");
    setSuppressionEnCoursId(zone.id);
    try {
      await supprimerZone(zone.id);
      setSuppressionSuccesMessage(`Zone "${zone.nom}" supprimée avec succès.`);
      if (editingId === zone.id) {
        annulerEdition();
      }
      await rechargerListe();
    } catch (err) {
      setSuppressionErreur(extraireMessageErreur(err));
    } finally {
      setSuppressionEnCoursId(null);
    }
  };

  const nomServicePour = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.nom : "Non rattachée";
  };

  return (
    <div>
      <h1>Gestion des zones</h1>

      <h2>{editingId ? "Modifier la zone" : "Créer une zone"}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nom">Nom</label>
          <input id="nom" name="nom" type="text" value={form.nom} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="service">Service</label>
          {servicesLoading && <p>Chargement des services...</p>}
          {servicesErreur && <p style={{ color: "red" }}>{servicesErreur}</p>}
          {!servicesLoading && !servicesErreur && (
            <select id="service" name="service" value={form.service} onChange={handleChange}>
              <option value="">Aucun service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>
          )}
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

      <h2>Zones existantes</h2>
      {loading && <p>Chargement...</p>}
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {suppressionErreur && <p style={{ color: "red" }}>{suppressionErreur}</p>}
      {suppressionSuccesMessage && <p style={{ color: "green" }}>{suppressionSuccesMessage}</p>}

      {!loading && !erreur && (
        <>
          {zones.length === 0 ? (
            <p>Aucune zone pour le moment.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Nom</th>
                  <th style={{ textAlign: "left" }}>Service</th>
                  <th style={{ textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id}>
                    <td>{z.nom}</td>
                    <td>{servicesLoading ? "..." : nomServicePour(z.service)}</td>
                    <td>
                      <button type="button" onClick={() => commencerEdition(z)}>
                        Modifier
                      </button>{" "}
                      <button
                        type="button"
                        onClick={() => handleSupprimer(z)}
                        disabled={suppressionEnCoursId === z.id}
                      >
                        {suppressionEnCoursId === z.id ? "Suppression..." : "Supprimer"}
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

export default ZonesAdmin;