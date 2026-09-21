import axiosClient from "./axiosClient";

function nettoyerFiltres(filtres = {}) {
  const params = {};
  Object.entries(filtres).forEach(([cle, valeur]) => {
    if (valeur !== "" && valeur !== null && valeur !== undefined) {
      params[cle] = valeur;
    }
  });
  return params;
}

export const obtenirKPI = async (filtres) => {
  const response = await axiosClient.get("dashboard/kpi/", { params: nettoyerFiltres(filtres) });
  return response.data;
};

export const obtenirCarte = async (filtres) => {
  const response = await axiosClient.get("dashboard/carte/", { params: nettoyerFiltres(filtres) });
  return response.data;
};