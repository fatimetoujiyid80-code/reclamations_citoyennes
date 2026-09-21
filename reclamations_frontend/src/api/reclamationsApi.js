import axiosClient from "./axiosClient";

export const listerMesReclamations = async (url = "complaints/reclamations/") => {
  const response = await axiosClient.get(url);
  return response.data; // { count, next, previous, results }
};

export const creerReclamation = async (payload) => {
  const response = await axiosClient.post("complaints/reclamations/", payload);
  return response.data;
};

export const obtenirReclamation = async (id) => {
  const response = await axiosClient.get(`complaints/reclamations/${id}/`);
  return response.data;
};

export const evaluerReclamation = async (id, note) => {
  const response = await axiosClient.post(`complaints/reclamations/${id}/evaluer/`, {
    note_citoyen: note,
  });
  return response.data;
};

export const ajouterMediaReclamation = async (id, fichier) => {
  const typeMedia = fichier.type.startsWith("video/") ? "VIDEO" : "PHOTO";

  const formData = new FormData();
  formData.append("fichier", fichier);
  formData.append("type_media", typeMedia);

  const response = await axiosClient.post(`complaints/reclamations/${id}/medias/`, formData);
  return response.data;
};

export const changerStatutReclamation = async (id, statut, commentaire) => {
  const response = await axiosClient.post(`complaints/reclamations/${id}/changer-statut/`, {
    statut,
    commentaire,
  });
  return response.data;
};

export const reaffecterReclamation = async (id, serviceId) => {
  const response = await axiosClient.post(`complaints/reclamations/${id}/reaffecter/`, {
    service: serviceId,
  });
  return response.data;
};