import axiosClient from "./axiosClient";

export const listerCategories = async () => {
  const response = await axiosClient.get("complaints/categories/");
  return response.data; // { count, next, previous, results }
};

export const creerCategorie = async (payload) => {
  const response = await axiosClient.post("complaints/categories/", payload);
  return response.data;
};

export const modifierCategorie = async (id, payload) => {
  const response = await axiosClient.patch(`complaints/categories/${id}/`, payload);
  return response.data;
};

export const supprimerCategorie = async (id) => {
  await axiosClient.delete(`complaints/categories/${id}/`);
};