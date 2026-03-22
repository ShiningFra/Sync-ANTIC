import API from "../api/api";

export const login = async (email, password) => {
  const res = await API.post("/auth/login", { email, password });
  localStorage.setItem("token", res.data.token);
};

export const logout = () => {
  localStorage.removeItem("token");
  window.location.reload();
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};
