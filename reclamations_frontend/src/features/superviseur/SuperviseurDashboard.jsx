import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenirKPI, obtenirCarte } from "../../api/dashboardApi";
import { listerZones } from "../../api/accountsApi";
import { listerCategories } from "../../api/categoriesApi";
import StatutBadge from "../../components/ui/StatutBadge.jsx";

function extraireMessageErreur(err) {
  if (!err.response || !err.response.data) {
    return "Une erreur est survenue lors du chargement des données.";
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
  return messages.length ? messages.join(" ") : "Une erreur est survenue lors du chargement des données.";
}

const FILTRES_VIDES = { periode_debut: "", periode_fin: "", zone: "", categorie: "" };

function SuperviseurDashboard() {
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesErreur, setZonesErreur] = useState("");

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesErreur, setCategoriesErreur] = useState("");

  const [filtres, setFiltres] = useState(FILTRES_VIDES);

  const [kpi, setKpi] = useState(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiErreur, setKpiErreur] = useState("");

  const [carte, setCarte] = useState(null);
  const [carteLoading, setCarteLoading] = useState(true);
  const [carteErreur, setCarteErreur] = useState("");

  // Chargement des référentiels (zones, catégories) pour peupler les filtres
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

  // Chargement initial des KPI + carte (sans filtre)
  useEffect(() => {
    let annule = false;

    async function chargerInitial() {
      try {
        const [dataKpi, dataCarte] = await Promise.all([obtenirKPI(FILTRES_VIDES), obtenirCarte(FILTRES_VIDES)]);
        if (!annule) {
          setKpi(dataKpi);
          setCarte(dataCarte);
        }
      } catch (err) {
        if (!annule) {
          const message = extraireMessageErreur(err);
          setKpiErreur(message);
          setCarteErreur(message);
        }
      } finally {
        if (!annule) {
          setKpiLoading(false);
          setCarteLoading(false);
        }
      }
    }

    chargerInitial();

    return () => {
      annule = true;
    };
  }, []);

  // Rechargement déclenché par un clic (jamais depuis un effet)
  const chargerAvecFiltres = async (filtresActuels) => {
    setKpiLoading(true);
    setKpiErreur("");
    setCarteLoading(true);
    setCarteErreur("");
    try {
      const [dataKpi, dataCarte] = await Promise.all([
        obtenirKPI(filtresActuels),
        obtenirCarte(filtresActuels),
      ]);
      setKpi(dataKpi);
      setCarte(dataCarte);
    } catch (err) {
      const message = extraireMessageErreur(err);
      setKpiErreur(message);
      setCarteErreur(message);
    } finally {
      setKpiLoading(false);
      setCarteLoading(false);
    }
  };

  const handleChangeFiltre = (event) => {
    setFiltres({ ...filtres, [event.target.name]: event.target.value });
  };

  const handleAppliquerFiltres = (event) => {
    event.preventDefault();
    chargerAvecFiltres(filtres);
  };

  const handleReinitialiser = () => {
    setFiltres(FILTRES_VIDES);
    chargerAvecFiltres(FILTRES_VIDES);
  };

  return (
    <div>
      <h1>Tableau de bord</h1>

      <h2>Filtres</h2>
      <form onSubmit={handleAppliquerFiltres}>
        <div>
          <label htmlFor="periode_debut">Période — début</label>
          <input
            id="periode_debut"
            name="periode_debut"
            type="date"
            value={filtres.periode_debut}
            onChange={handleChangeFiltre}
          />
        </div>
        <div>
          <label htmlFor="periode_fin">Période — fin</label>
          <input
            id="periode_fin"
            name="periode_fin"
            type="date"
            value={filtres.periode_fin}
            onChange={handleChangeFiltre}
          />
        </div>
        <div>
          <label htmlFor="zone">Zone</label>
          {zonesLoading && <p>Chargement des zones...</p>}
          {zonesErreur && <p style={{ color: "red" }}>{zonesErreur}</p>}
          {!zonesLoading && !zonesErreur && (
            <select id="zone" name="zone" value={filtres.zone} onChange={handleChangeFiltre}>
              <option value="">Toutes les zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nom}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label htmlFor="categorie">Catégorie</label>
          {categoriesLoading && <p>Chargement des catégories...</p>}
          {categoriesErreur && <p style={{ color: "red" }}>{categoriesErreur}</p>}
          {!categoriesLoading && !categoriesErreur && (
            <select id="categorie" name="categorie" value={filtres.categorie} onChange={handleChangeFiltre}>
              <option value="">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          )}
        </div>

        <button type="submit">Appliquer les filtres</button>
        <button type="button" onClick={handleReinitialiser}>
          Réinitialiser
        </button>
      </form>

      <h2>Indicateurs</h2>
      {kpiLoading && <p>Chargement...</p>}
      {kpiErreur && <p style={{ color: "red" }}>{kpiErreur}</p>}
      {!kpiLoading && !kpiErreur && kpi && (
        <>
          <p>Total réclamations : {kpi.total_reclamations}</p>
          <p>
            Délai moyen de traitement :{" "}
            {kpi.delai_moyen_traitement_heures !== null ? `${kpi.delai_moyen_traitement_heures} h` : "Non disponible"}
          </p>
          <p>
            Taux de résolution :{" "}
            {kpi.taux_resolution_pourcent !== null ? `${kpi.taux_resolution_pourcent} %` : "Non disponible"}
          </p>

          <h3>Volumes par catégorie</h3>
          {kpi.volumes_par_categorie.length === 0 ? (
            <p>Aucune donnée.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Catégorie</th>
                  <th style={{ textAlign: "left" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {kpi.volumes_par_categorie.map((v) => (
                  <tr key={v.categorie_id || "sans-categorie"}>
                    <td>{v.categorie_nom || "Non renseignée"}</td>
                    <td>{v.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>Volumes par zone</h3>
          {kpi.volumes_par_zone.length === 0 ? (
            <p>Aucune donnée.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Zone</th>
                  <th style={{ textAlign: "left" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {kpi.volumes_par_zone.map((v) => (
                  <tr key={v.zone_id || "sans-zone"}>
                    <td>{v.zone_nom || "Non affectée"}</td>
                    <td>{v.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>Volumes par statut</h3>
          {kpi.volumes_par_statut.length === 0 ? (
            <p>Aucune donnée.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Statut</th>
                  <th style={{ textAlign: "left" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {kpi.volumes_par_statut.map((v) => (
                  <tr key={v.statut}>
                    <td>
                      <StatutBadge statut={v.statut} />
                    </td>
                    <td>{v.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <h2>Réclamations géolocalisées</h2>
      {carteLoading && <p>Chargement...</p>}
      {carteErreur && <p style={{ color: "red" }}>{carteErreur}</p>}
      {!carteLoading && !carteErreur && carte && (
        <>
          <p>Total : {carte.total_points}</p>
          {carte.total_points === 0 ? (
            <p>Aucune réclamation géolocalisée pour ce filtre.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>N° de suivi</th>
                  <th style={{ textAlign: "left" }}>Titre</th>
                  <th style={{ textAlign: "left" }}>Catégorie</th>
                  <th style={{ textAlign: "left" }}>Statut</th>
                  <th style={{ textAlign: "left" }}>Latitude</th>
                  <th style={{ textAlign: "left" }}>Longitude</th>
                  <th style={{ textAlign: "left" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {carte.points.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/superviseur/reclamations/${p.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{p.numero_suivi}</td>
                    <td>{p.titre}</td>
                    <td>{p.categorie}</td>
                    <td>
                      <StatutBadge statut={p.statut} />
                    </td>
                    <td>{p.latitude}</td>
                    <td>{p.longitude}</td>
                    <td>{new Date(p.date_creation).toLocaleDateString()}</td>
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

export default SuperviseurDashboard;