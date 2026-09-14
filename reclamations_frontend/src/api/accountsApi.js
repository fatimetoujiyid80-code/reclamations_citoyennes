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