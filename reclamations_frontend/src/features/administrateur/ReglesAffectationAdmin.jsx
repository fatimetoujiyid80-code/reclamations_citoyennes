import { useEffect, useState } from "react";
import {
  listerReglesAffectation,
  creerRegleAffectation,
  modifierRegleAffectation,
  supprimerRegleAffectation,
} from "../../api/assignmentApi";
import { listerCategories } from "../../api/categoriesApi";
import { listerServices, listerZones } from "../../api/accountsApi";

const FORM_VIDE = { categorie: "", zone: "", service_cible: "", priorite: "0", active: true };

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

function ReglesAffectationAdmin() {
  const [regles, setRegles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesErreur, setCategoriesErreur] = useState("");

  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesErreur, setZonesErreur] = useState("");

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
        const data = await listerReglesAffectation();
        if (!annule) {
          setRegles(data.results);
        }
      } catch {
        if (!annule) {
          setErreur("Impossible de charger les règles d'affectation.");
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

    async function chargerCategories() {
      try {
        const data = await listerCategories();
        if (!annule) {
          setCategories(data.results);
        }
      } catch {
        if (!annule) {
          setCategoriesErreur("Impossible de charger les catégories.");
        }
      } finally {
        if (!annule) {
          setCategoriesLoading(false);
        }
      }
    }

    chargerCategories();

    return () => {
      annule = true;
    };
  }, []);

  useEffect(() => {
    let annule = false;

    async function chargerZones() {
      try {
        const data = await listerZones();
        if (!annule) {
          setZones(data.results);
        }
      } catch {
        if (!annule) {
          setZonesErreur("Impossible de charger les zones.");
        }
      } finally {
        if (!annule) {
          setZonesLoading(false);
        }
      }
    }

    chargerZones();

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
          if (data.results.length > 0) {
            setForm((f) => (f.service_cible ? f : { ...f, service_cible: data.results[0].id }));
          }
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
      const data = await listerReglesAffectation();
      setRegles(data.results);
    } catch {
      setErreur("Impossible de charger les règles d'affectation.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const commencerEdition = (regle) => {
    setEditingId(regle.id);
    setForm({
      categorie: regle.categorie || "",
      zone: regle.zone || "",
      service_cible: regle.service_cible || "",
      priorite: String(regle.priorite),
      active: regle.active,
    });
    setFormErreur("");
    setFormSuccesMessage("");
  };

  const annulerEdition = () => {
    setEditingId(null);
    setForm(FORM_VIDE);
    setFormErreur("");
  };

  const construirePayload = () => ({
    categorie: form.categorie || null,
    zone: form.zone || null,
    service_cible: form.service_cible,
    priorite: parseInt(form.priorite, 10) || 0,
    active: form.active,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormErreur("");
    setFormSuccesMessage("");
    setSubmitting(true);
    try {
      if (editingId) {
        await modifierRegleAffectation(editingId, construirePayload());
        setFormSuccesMessage("Règle modifiée avec succès.");
      } else {
        await creerRegleAffectation(construirePayload());
        setFormSuccesMessage("Règle créée avec succès.");
      }
      setForm({ ...FORM_VIDE, service_cible: services.length > 0 ? services[0].id : "" });
      setEditingId(null);
      await rechargerListe();
    } catch (err) {
      setFormErreur(extraireMessageErreur(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupprimer = async (regle) => {
    const confirmation = window.confirm(
      "Supprimer définitivement cette règle d'affectation ? Cette action est irréversible."
    );
    if (!confirmation) {
      return;
    }
    setSuppressionErreur("");
    setSuppressionSuccesMessage("");
    setSuppressionEnCoursId(regle.id);
    try {
      await supprimerRegleAffectation(regle.id);
      setSuppressionSuccesMessage("Règle supprimée avec succès.");
      if (editingId === regle.id) {
        annulerEdition();
      }
      await rechargerListe();
    } catch (err) {
      setSuppressionErreur(extraireMessageErreur(err));
    } finally {
      setSuppressionEnCoursId(null);
    }
  };

  const nomCategoriePour = (id) => {
    const c = categories.find((cat) => cat.id === id);
    return c ? c.nom : "Toutes les catégories";
  };
  const nomZonePour = (id) => {
    const z = zones.find((zone) => zone.id === id);
    return z ? z.nom : "Toutes les zones";
  };
  const nomServicePour = (id) => {
    const s = services.find((service) => service.id === id);
    return s ? s.nom : "—";
  };

  const referentielsPrets = !categoriesLoading && !zonesLoading && !servicesLoading;
  const referentielsErreur = categoriesErreur || zonesErreur || servicesErreur;

  return (
    <div>
      <h1>Gestion des règles d'affectation</h1>

      <h2>{editingId ? "Modifier la règle" : "Créer une règle"}</h2>

      {!referentielsPrets && <p>Chargement des catégories, zones et services...</p>}
      {referentielsErreur && <p style={{ color: "red" }}>{referentielsErreur}</p>}

      {referentielsPrets && !referentielsErreur && (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="categorie">Catégorie</label>
            <select id="categorie" name="categorie" value={form.categorie} onChange={handleChange}>
              <option value="">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="zone">Zone</label>
            <select id="zone" name="zone" value={form.zone} onChange={handleChange}>
              <option value="">Toutes les zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="service_cible">Service cible</label>
            <select id="service_cible" name="service_cible" value={form.service_cible} onChange={handleChange} required>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priorite">Priorité</label>
            <input
              id="priorite"
              name="priorite"
              type="number"
              value={form.priorite}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="active">
              <input id="active" name="active" type="checkbox" checked={form.active} onChange={handleChange} />
              {" "}Active
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
      )}

      <h2>Règles existantes</h2>
      {loading && <p>Chargement...</p>}
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {suppressionErreur && <p style={{ color: "red" }}>{suppressionErreur}</p>}
      {suppressionSuccesMessage && <p style={{ color: "green" }}>{suppressionSuccesMessage}</p>}

      {!loading && !erreur && (
        <>
          {regles.length === 0 ? (
            <p>Aucune règle d'affectation pour le moment.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Catégorie</th>
                  <th style={{ textAlign: "left" }}>Zone</th>
                  <th style={{ textAlign: "left" }}>Service cible</th>
                  <th style={{ textAlign: "left" }}>Priorité</th>
                  <th style={{ textAlign: "left" }}>Active</th>
                  <th style={{ textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {regles.map((r) => (
                  <tr key={r.id}>
                    <td>{referentielsPrets ? nomCategoriePour(r.categorie) : "..."}</td>
                    <td>{referentielsPrets ? nomZonePour(r.zone) : "..."}</td>
                    <td>{referentielsPrets ? nomServicePour(r.service_cible) : "..."}</td>
                    <td>{r.priorite}</td>
                    <td>{r.active ? "Oui" : "Non"}</td>
                    <td>
                      <button type="button" onClick={() => commencerEdition(r)}>
                        Modifier
                      </button>{" "}
                      <button
                        type="button"
                        onClick={() => handleSupprimer(r)}
                        disabled={suppressionEnCoursId === r.id}
                      >
                        {suppressionEnCoursId === r.id ? "Suppression..." : "Supprimer"}
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

export default ReglesAffectationAdmin;