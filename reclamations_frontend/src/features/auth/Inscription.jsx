import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { inscription } from "../../api/accountsApi";
import { useAuth } from "../../auth/useAuth";

function extraireMessagesErreur(err) {
  if (!err.response || !err.response.data) {
    return ["Une erreur est survenue. Veuillez réessayer."];
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
  return messages.length ? messages : ["Une erreur est survenue. Veuillez réessayer."];
}

function Inscription() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    nom: "",
    prenom: "",
    telephone: "",
  });
  const [erreurs, setErreurs] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErreurs([]);
    setSubmitting(true);
    try {
      await inscription(form);
      await login(form.email, form.password);
      navigate("/citoyen", { replace: true });
    } catch (err) {
      setErreurs(extraireMessagesErreur(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Créer un compte</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="password">Mot de passe</label>
          <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
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
          <label htmlFor="telephone">Téléphone (optionnel)</label>
          <input id="telephone" name="telephone" type="text" value={form.telephone} onChange={handleChange} />
        </div>

        {erreurs.length > 0 && (
          <ul style={{ color: "red" }}>
            {erreurs.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Création..." : "Créer mon compte"}
        </button>
      </form>
      <p>
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </div>
  );
}

export default Inscription;