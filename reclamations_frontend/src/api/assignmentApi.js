import axiosClient from "./axiosClient";

export const listerReglesAffectation = async () => {
  const response = await axiosClient.get("assignment/regles-affectation/");
  return response.data; // { count, next, previous, results }
};

export const creerRegleAffectation = async (payload) => {
  const response = await axiosClient.post("assignment/regles-affectation/", payload);
  return response.data;
};

export const modifierRegleAffectation = async (id, payload) => {
  const response = await axiosClient.patch(`assignment/regles-affectation/${id}/`, payload);
  return response.data;
};

export const supprimerRegleAffectation = async (id) => {
  await axiosClient.delete(`assignment/regles-affectation/${id}/`);
};