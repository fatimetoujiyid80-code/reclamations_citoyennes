import { useEffect, useState } from "react";
import {
  listerCategories,
  creerCategorie,
  modifierCategorie,
  supprimerCategorie,
} from "../../api/categoriesApi";

const FORM_VIDE = { nom: "", description: "" };

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

function CategoriesAdmin() {
  const [categories, setCategories] = useState([]);
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
        const data = await listerCategories();
        if (!annule) {
          setCategories(data.results);
        }
      } catch {
        if (!annule) {
          setErreur("Impossible de charger les catégories.");
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
      const data = await listerCategories();
      setCategories(data.results);
    } catch {
      setErreur("Impossible de charger les catégories.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const commencerEdition = (categorie) => {
    setEditingId(categorie.id);
    setForm({ nom: categorie.nom, description: categorie.description || "" });
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
        await modifierCategorie(editingId, form);
        setFormSuccesMessage("Catégorie modifiée avec succès.");
      } else {
        await creerCategorie(form);
        setFormSuccesMessage("Catégorie créée avec succès.");
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

  const handleSupprimer = async (categorie) => {
    const confirmation = window.confirm(
      `Supprimer définitivement la catégorie "${categorie.nom}" ? Cette action est irréversible.`
    );
    if (!confirmation) {
      return;
    }
    setSuppressionErreur("");
    setSuppressionSuccesMessage("");
    setSuppressionEnCoursId(categorie.id);
    try {
      await supprimerCategorie(categorie.id);
      setSuppressionSuccesMessage(`Catégorie "${categorie.nom}" supprimée avec succès.`);
      if (editingId === categorie.id) {
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
      <h1>Gestion des catégories</h1>

      <h2>{editingId ? "Modifier la catégorie" : "Créer une catégorie"}</h2>
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

      <h2>Catégories existantes</h2>
      {loading && <p>Chargement...</p>}
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {suppressionErreur && <p style={{ color: "red" }}>{suppressionErreur}</p>}
      {suppressionSuccesMessage && <p style={{ color: "green" }}>{suppressionSuccesMessage}</p>}

      {!loading && !erreur && (
        <>
          {categories.length === 0 ? (
            <p>Aucune catégorie pour le moment.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Nom</th>
                  <th style={{ textAlign: "left" }}>Description</th>
                  <th style={{ textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nom}</td>
                    <td>{c.description || "—"}</td>
                    <td>
                      <button type="button" onClick={() => commencerEdition(c)}>
                        Modifier
                      </button>{" "}
                      <button
                        type="button"
                        onClick={() => handleSupprimer(c)}
                        disabled={suppressionEnCoursId === c.id}
                      >
                        {suppressionEnCoursId === c.id ? "Suppression..." : "Supprimer"}
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

export default CategoriesAdmin;