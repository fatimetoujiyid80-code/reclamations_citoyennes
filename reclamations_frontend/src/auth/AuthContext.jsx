import { useState } from "react";
import { login as loginApi } from "../api/authApi";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "./AuthContext.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);

    try {
      await loginApi(email, password);

      const response = await axiosClient.get("accounts/moi/");

      setUser(response.data);

      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}