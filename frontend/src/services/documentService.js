import API from "../api/api";

export const uploadDocument = async (etapeId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return await API.post(`/documents/${etapeId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
