import { useEffect, useState } from "react";
import {
  listerUtilisateurs,
  creerUtilisateur,
  modifierUtilisateur,
  supprimerUtilisateur,
  listerServices,
} from "../../api/accountsApi";

const ROLES = ["CITOYEN", "AGENT", "SUPERVISEUR", "ADMINISTRATEUR", "DECIDEUR"];
const ROLES_AVEC_SERVICE = ["AGENT", "SUPERVISEUR"];

const FORM_VIDE = {
  email: "",
  password: "",
  nom: "",
  prenom: "",
  telephone: "",
  role: "CITOYEN",
  service: "",
  is_active: true,
};

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

function UtilisateursAdmin() {
  const [utilisateurs, setUtilisateurs] = useState([]);
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
        const data = await listerUtilisateurs();
        if (!annule) {
          setUtilisateurs(data.results);
        }
      } catch {
        if (!annule) {
          setErreur("Impossible de charger les utilisateurs.");
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
      const data = await listerUtilisateurs();
      setUtilisateurs(data.results);
    } catch {
      setErreur("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  const roleActuelAvecService = ROLES_AVEC_SERVICE.includes(form.role);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;

    if (name === "role") {
      const nouveauRoleAvecService = ROLES_AVEC_SERVICE.includes(value);
      setForm({
        ...form,
        role: value,
        service: nouveauRoleAvecService ? form.service : "",
      });
      return;
    }

    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const commencerEdition = (utilisateur) => {
    setEditingId(utilisateur.id);
    setForm({
      email: utilisateur.email,
      password: "",
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      telephone: utilisateur.telephone || "",
      role: utilisateur.role,
      service: utilisateur.service || "",
      is_active: utilisateur.is_active,
    });
    setFormErreur("");
    setFormSuccesMessage("");
  };

  const annulerEdition = () => {
    setEditingId(null);
    setForm(FORM_VIDE);
    setFormErreur("");
  };

  const construirePayload = () => {
    const payload = {
      email: form.email,
      nom: form.nom,
      prenom: form.prenom,
      telephone: form.telephone,
      role: form.role,
      service: ROLES_AVEC_SERVICE.includes(form.role) && form.service ? form.service : null,
      is_active: form.is_active,
    };
    // Mot de passe : envoyé uniquement s'il a été saisi (création : toujours ;
    // édition : seulement si l'admin veut le changer).
    if (form.password) {
      payload.password = form.password;
    }
    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormErreur("");
    setFormSuccesMessage("");
    setSubmitting(true);
    try {
      if (editingId) {
        await modifierUtilisateur(editingId, construirePayload());
        setFormSuccesMessage("Utilisateur modifié avec succès.");
      } else {
        await creerUtilisateur(construirePayload());
        setFormSuccesMessage("Utilisateur créé avec succès.");
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

  const handleSupprimer = async (utilisateur) => {
    const confirmation = window.confirm(
      `Supprimer définitivement l'utilisateur "${utilisateur.email}" ? Cette action est irréversible.`
    );
    if (!confirmation) {
      return;
    }
    setSuppressionErreur("");
    setSuppressionSuccesMessage("");
    setSuppressionEnCoursId(utilisateur.id);
    try {
      await supprimerUtilisateur(utilisateur.id);
      setSuppressionSuccesMessage(`Utilisateur "${utilisateur.email}" supprimé avec succès.`);
      if (editingId === utilisateur.id) {
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
    return service ? service.nom : "—";
  };

  return (
    <div>
      <h1>Gestion des utilisateurs</h1>

      <h2>{editingId ? "Modifier l'utilisateur" : "Créer un utilisateur"}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        <div>
          <label htmlFor="password">
            {editingId ? "Nouveau mot de passe (laisser vide pour ne pas le changer)" : "Mot de passe"}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required={!editingId}
          />
        </div>

        <div>
          <label htmlFor="nom">Nom</label>
          <input id="nom" name="nom" type="text" value={form.nom} onChange={handleChange} required />
        </div>

        <div>
          <label htmlFor="prenom">Prénom</label>
          <input id="prenom" name="prenom" type="text" value={form.prenom} onChange={handleChange} required />
        </div>

        <div>
          <label htmlFor="telephone">Téléphone</label>
          <input id="telephone" name="telephone" type="text" value={form.telephone} onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="role">Rôle</label>
          <select id="role" name="role" value={form.role} onChange={handleChange}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {roleActuelAvecService && (
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
        )}

        <div>
          <label htmlFor="is_active">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={handleChange}
            />
            {" "}Compte actif
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

      <h2>Utilisateurs existants</h2>
      {loading && <p>Chargement...</p>}
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {suppressionErreur && <p style={{ color: "red" }}>{suppressionErreur}</p>}
      {suppressionSuccesMessage && <p style={{ color: "green" }}>{suppressionSuccesMessage}</p>}

      {!loading && !erreur && (
        <>
          {utilisateurs.length === 0 ? (
            <p>Aucun utilisateur pour le moment.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Email</th>
                  <th style={{ textAlign: "left" }}>Nom</th>
                  <th style={{ textAlign: "left" }}>Prénom</th>
                  <th style={{ textAlign: "left" }}>Rôle</th>
                  <th style={{ textAlign: "left" }}>Service</th>
                  <th style={{ textAlign: "left" }}>Actif</th>
                  <th style={{ textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.nom}</td>
                    <td>{u.prenom}</td>
                    <td>{u.role}</td>
                    <td>{u.service ? (servicesLoading ? "..." : nomServicePour(u.service)) : "—"}</td>
                    <td>{u.is_active ? "Oui" : "Non"}</td>
                    <td>
                      <button type="button" onClick={() => commencerEdition(u)}>
                        Modifier
                      </button>{" "}
                      <button
                        type="button"
                        onClick={() => handleSupprimer(u)}
                        disabled={suppressionEnCoursId === u.id}
                      >
                        {suppressionEnCoursId === u.id ? "Suppression..." : "Supprimer"}
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

export default UtilisateursAdmin;