import api from "./api.js";

export const fetchContacts = async () => {
  const response = await api.get("/contacts");
  return response.data;
};

export const addNewContact = async (data) => {
  const response = await api.post("/contacts/add", {
    name: data.name,
    phone: data.phone,
    email: data.email || "",
    relation: data.relation,
  });
  return response.data;
};

export const updateExistingContact = async (contactId, data) => {
  const response = await api.put(`/contacts/${contactId}`, {
    name: data.name,
    phone: data.phone,
    email: data.email || "",
    relation: data.relation,
  });
  return response.data;
};

export const removeContact = async (contactId) => {
  const response = await api.delete(`/contacts/${contactId}`);
  return response.data;
};
