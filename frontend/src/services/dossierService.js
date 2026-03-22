import API from "../api/api";

export const getDossiers = async () => {
  const res = await API.get("/dossiers");
  return res.data;
};

export const createDossier = async (data) => {
  return await API.post("/dossiers", data);
};

export const filterDossiers = async (params) => {
  const res = await API.get("/dossiers/filter", { params });
  return res.data;
};
