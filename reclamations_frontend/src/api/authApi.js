import axios from "axios";
import axiosClient from "./axiosClient";

export const login = async (email, password) => {
  const response = await axios.post(
    "http://127.0.0.1:8000/api/token/",
    {
      email,
      password,
    }
  );

  const { access, refresh } = response.data;

  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);

  return response.data;
};

export const refreshToken = async () => {
  const token = localStorage.getItem("refresh_token");

  if (!token) {
    throw new Error("Refresh token introuvable.");
  }

  const response = await axiosClient.post("token/refresh/", {
    refresh: token,
  });

  const newAccessToken = response.data.access;

  localStorage.setItem("access_token", newAccessToken);

  return response.data;
};