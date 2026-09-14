import axios from "axios";
const axiosClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

// Request Interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access_token");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Pour du JSON classique : Content-Type explicite, comme avant.
    // Pour un FormData (upload de fichier) : on ne touche à rien, Axios
    // détecte le FormData tout seul et génère l'en-tête multipart correct
    // avec sa boundary — un Content-Type manuel ici la casserait.
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // إذا كان الخطأ 401 ولم نحاول تجديد التوكن من قبل
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const response = await axios.post(
            "http://127.0.0.1:8000/api/token/refresh/",
            {
              refresh: refreshToken,
            }
          );

          const newAccessToken = response.data.access;

          localStorage.setItem("access_token", newAccessToken);

          originalRequest.headers.Authorization =
            `Bearer ${newAccessToken}`;

          return axiosClient(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");

          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;