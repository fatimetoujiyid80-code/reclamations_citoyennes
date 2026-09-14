import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

const ACCUEIL_PAR_ROLE = {
  CITOYEN: "/citoyen",
  AGENT: "/agent",
  SUPERVISEUR: "/superviseur",
  ADMINISTRATEUR: "/administrateur",
  DECIDEUR: "/superviseur",
};

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      const destination = ACCUEIL_PAR_ROLE[user.role] || "/login";
      navigate(destination, { replace: true });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Email ou mot de passe incorrect.");
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Connexion</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}

export default Login;