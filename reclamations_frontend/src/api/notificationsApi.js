import axiosClient from "./axiosClient";

export const listerNotifications = async (url = "notifications/notifications/") => {
  const response = await axiosClient.get(url);
  return response.data; // { count, next, previous, results }
};