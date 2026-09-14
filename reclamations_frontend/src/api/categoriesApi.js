import axiosClient from "./axiosClient";

export const listerCategories = async () => {
  const response = await axiosClient.get("complaints/categories/");
  return response.data; // { count, next, previous, results }
};