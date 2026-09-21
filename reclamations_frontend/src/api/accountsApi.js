import axiosClient from "./axiosClient";

export const inscription = async ({ email, password, nom, prenom, telephone }) => {
  const response = await axiosClient.post("accounts/inscription/", {
    email,
    password,
    nom,
    prenom,
    telephone,
  });
  return response.data;
};

export const listerServices = async () => {
  const response = await axiosClient.get("accounts/services/");
  return response.data;
};

export const listerZones = async () => {
  const response = await axiosClient.get("accounts/zones/");
  return response.data;
};

export const creerService = async (payload) => {
  const response = await axiosClient.post("accounts/services/", payload);
  return response.data;
};

export const modifierService = async (id, payload) => {
  const response = await axiosClient.patch(`accounts/services/${id}/`, payload);
  return response.data;
};

export const supprimerService = async (id) => {
  await axiosClient.delete(`accounts/services/${id}/`);
};

export const creerZone = async (payload) => {
  const response = await axiosClient.post("accounts/zones/", payload);
  return response.data;
};

export const modifierZone = async (id, payload) => {
  const response = await axiosClient.patch(`accounts/zones/${id}/`, payload);
  return response.data;
};

export const supprimerZone = async (id) => {
  await axiosClient.delete(`accounts/zones/${id}/`);
};

export const listerUtilisateurs = async () => {
  const response = await axiosClient.get("accounts/utilisateurs/");
  return response.data;
};

export const creerUtilisateur = async (payload) => {
  const response = await axiosClient.post("accounts/utilisateurs/", payload);
  return response.data;
};

export const modifierUtilisateur = async (id, payload) => {
  const response = await axiosClient.patch(`accounts/utilisateurs/${id}/`, payload);
  return response.data;
};

export const supprimerUtilisateur = async (id) => {
  await axiosClient.delete(`accounts/utilisateurs/${id}/`);
};