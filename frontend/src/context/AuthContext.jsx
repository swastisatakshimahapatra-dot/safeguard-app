import { createContext, useContext, useState, useEffect } from "react";
import { getProfile } from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem("safeguard_user");
      const token = localStorage.getItem("safeguard_token");

      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        try {
          const response = await getProfile();
          if (response.user) {
            setUser(response.user);
            localStorage.setItem(
              "safeguard_user",
              JSON.stringify(response.user),
            );
          }
        } catch (error) {
          localStorage.removeItem("safeguard_user");
          localStorage.removeItem("safeguard_token");
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("safeguard_user", JSON.stringify(userData));
    localStorage.setItem("safeguard_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("safeguard_user");
    localStorage.removeItem("safeguard_token");
    setUser(null);
  };

  // ✅ Update user in context + localStorage without full login
  const updateUser = (updatedUser) => {
    localStorage.setItem("safeguard_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
