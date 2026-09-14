import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { listerCategories } from "../../api/categoriesApi";
import { creerReclamation } from "../../api/reclamationsApi";
import { useGeolocation } from "../../hooks/useGeolocation";

function extraireErreursChamps(err) {
  if (!err.response || !err.response.data) {
    return { non_field_errors: ["Une erreur est survenue. Veuillez réessayer."] };
  }
  const data = err.response.data;
  const erreurs = {};
  Object.entries(data).forEach(([champ, valeur]) => {
    erreurs[champ] = Array.isArray(valeur) ? valeur : [String(valeur)];
  });
  return erreurs;
}

function NouvelleReclamation() {
  const navigate = useNavigate();
  const geolocation = useGeolocation();

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesErreur, setCategoriesErreur] = useState("");

  const [form, setForm] = useState({
    titre: "",
    description: "",
    categorie: "",
    adresse_approx: "",
    latitude: "",
    longitude: "",
  });
  const [erreurs, setErreurs] = useState({});
  const [submitting, setSubmitting] = useState(false);

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

  // Valeurs dérivées pendant le rendu (pas de useEffect) : tant que l'utilisateur
  // n'a rien saisi manuellement, on affiche/utilise la position du navigateur.
  const latitudeEffective = form.latitude !== "" ? form.latitude : geolocation.latitude ?? "";
  const longitudeEffective = form.longitude !== "" ? form.longitude : geolocation.longitude ?? "";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErreurs({});
    setSubmitting(true);

    const payload = {
      titre: form.titre,
      description: form.description,
      categorie: form.categorie,
      latitude: latitudeEffective,
      longitude: longitudeEffective,
    };
    if (form.adresse_approx) {
      payload.adresse_approx = form.adresse_approx;
    }

    try {
      await creerReclamation(payload);
      navigate("/citoyen", { replace: true });
    } catch (err) {
      setErreurs(extraireErreursChamps(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Nouvelle réclamation</h1>
      <p>
        <Link to="/citoyen">&larr; Retour à mes réclamations</Link>
      </p>

      {geolocation.loading && <p>Récupération de votre position...</p>}
      {geolocation.erreur && (
        <p style={{ color: "#856404" }}>
          {geolocation.erreur} Vous pouvez saisir la position manuellement ci-dessous.
        </p>
      )}

      {erreurs.non_field_errors && (
        <ul style={{ color: "red" }}>
          {erreurs.non_field_errors.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="titre">Titre</label>
          <input id="titre" name="titre" type="text" value={form.titre} onChange={handleChange} required />
          {erreurs.titre && <p style={{ color: "red" }}>{erreurs.titre.join(" ")}</p>}
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" value={form.description} onChange={handleChange} required />
          {erreurs.description && <p style={{ color: "red" }}>{erreurs.description.join(" ")}</p>}
        </div>

        <div>
          <label htmlFor="categorie">Catégorie</label>
          {categoriesLoading && <p>Chargement des catégories...</p>}
          {categoriesErreur && <p style={{ color: "red" }}>{categoriesErreur}</p>}
          {!categoriesLoading && !categoriesErreur && (
            <select id="categorie" name="categorie" value={form.categorie} onChange={handleChange} required>
              <option value="">-- Sélectionner une catégorie --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          )}
          {erreurs.categorie && <p style={{ color: "red" }}>{erreurs.categorie.join(" ")}</p>}
        </div>

        <div>
          <label htmlFor="adresse_approx">Adresse (facultatif)</label>
          <input
            id="adresse_approx"
            name="adresse_approx"
            type="text"
            value={form.adresse_approx}
            onChange={handleChange}
          />
          {erreurs.adresse_approx && <p style={{ color: "red" }}>{erreurs.adresse_approx.join(" ")}</p>}
        </div>

        <div>
          <label htmlFor="latitude">Latitude</label>
          <input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            value={latitudeEffective}
            onChange={handleChange}
            required
          />
          {erreurs.latitude && <p style={{ color: "red" }}>{erreurs.latitude.join(" ")}</p>}
        </div>

        <div>
          <label htmlFor="longitude">Longitude</label>
          <input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            value={longitudeEffective}
            onChange={handleChange}
            required
          />
          {erreurs.longitude && <p style={{ color: "red" }}>{erreurs.longitude.join(" ")}</p>}
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Envoi..." : "Soumettre la réclamation"}
        </button>
      </form>
    </div>
  );
}

export default NouvelleReclamation;