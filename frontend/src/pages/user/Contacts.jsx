import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiPhone,
  FiUser,
  FiUsers,
  FiCheck,
  FiX,
  FiMail,
} from "react-icons/fi";
import { MdSecurity, MdSend } from "react-icons/md";
import toast from "react-hot-toast";
import { useEffect } from "react";
import {
  fetchContacts,
  addNewContact,
  updateExistingContact,
  removeContact,
} from "../../services/contactService";

// Initial dummy contacts
const initialContacts = [
  {
    id: 1,
    name: "Sunita Sharma",
    phone: "9876543210",
    relation: "Mother",
    status: "Active",
    avatar: "S",
    avatarColor: "from-pink-400 to-pink-600",
  },
  {
    id: 2,
    name: "Rahul Sharma",
    phone: "9845678901",
    relation: "Father",
    status: "Active",
    avatar: "R",
    avatarColor: "from-blue-400 to-blue-600",
  },
  {
    id: 3,
    name: "Anjali Singh",
    phone: "9812345678",
    relation: "Friend",
    status: "Active",
    avatar: "A",
    avatarColor: "from-purple-400 to-purple-600",
  },
];

const relations = [
  "Mother",
  "Father",
  "Sibling",
  "Spouse",
  "Friend",
  "Guardian",
  "Other",
];

const relationColors = {
  Mother: "bg-pink-100 text-pink-700",
  Father: "bg-blue-100 text-blue-700",
  Sibling: "bg-purple-100 text-purple-700",
  Spouse: "bg-red-100 text-red-700",
  Friend: "bg-green-100 text-green-700",
  Guardian: "bg-orange-100 text-orange-700",
  Other: "bg-gray-100 text-gray-700",
};

// Empty form state
const emptyForm = {
  name: "",
  phone: "",
  email: "",
  relation: "",
};

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [testingId, setTestingId] = useState(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setPageLoading(true);
    try {
      const response = await fetchContacts();
      // ✅ Map backend data to match UI format
      const mapped = response.contacts.map((c) => ({
        id: c._id,
        name: c.name,
        phone: c.phone,
        email: c.email || "",
        relation: c.relation,
        status: "Active",
        avatar: c.name?.charAt(0)?.toUpperCase() || "?",
        avatarColor: "from-pink-400 to-pink-600",
      }));
      setContacts(mapped);
    } catch (error) {
      toast.error("Failed to load contacts");
    } finally {
      setPageLoading(false);
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    else if (formData.phone.length < 10)
      newErrors.phone = "Enter valid phone number";
    if (!formData.relation) newErrors.relation = "Please select relation";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Open Add Modal
  const handleAddNew = () => {
    setEditingContact(null);
    setFormData(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  // Open Edit Modal
  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || "", // ✅ ADD
      relation: contact.relation,
    });
    setErrors({});
    setShowModal(true);
  };
  // Open Delete Modal
  const handleDeleteClick = (contact) => {
    setDeleteTarget(contact);
    setShowDeleteModal(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    try {
      await removeContact(deleteTarget.id);
      await loadContacts();
      toast.success(`${deleteTarget.name} removed`);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error) {
      toast.error("Failed to remove contact");
    }
  };

  // Save Contact (Add or Edit)
  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingContact) {
        console.log("Updating contact with:", formData);
        await updateExistingContact(editingContact.id, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          relation: formData.relation,
        });
        await loadContacts();
        toast.success("Contact updated ✅");
      } else {
        console.log("Adding contact with:", formData);
        await addNewContact({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          relation: formData.relation,
        });
        await loadContacts();
        toast.success("Contact added ✅");
      }

      setShowModal(false);
      setFormData(emptyForm);
    } catch (error) {
      console.error("Save error:", error);
      const message = error.response?.data?.message || "Failed to save contact";
      toast.error(message);
    }
  };

  // Test Alert
  const handleTestAlert = async (contact) => {
    setTestingId(contact.id);
    toast.loading(`Sending test alert to ${contact.name}...`, { id: "test" });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toast.success(`Test alert sent to ${contact.name}! 📱`, { id: "test" });
    setTestingId(null);
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <DashboardLayout>
      {pageLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading contacts...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A2E]">
                Emergency Contacts
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                These people will be alerted in case of emergency
              </p>
            </div>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              <FiPlus className="text-lg" />
              Add Contact
            </button>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#E91E8C] rounded-xl flex items-center justify-center flex-shrink-0">
              <MdSecurity className="text-white text-xl" />
            </div>
            <div>
              <h4 className="font-bold text-[#1A1A2E] text-sm mb-1">
                How Emergency Contacts Work
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                When you trigger an emergency alert, all contacts below will
                instantly receive:
                <br />
                📱 <strong>SMS</strong> (if phone added) + 📧{" "}
                <strong>Email</strong> (if email added)
                <br />
                with your live location and Google Maps link. Add as many
                contacts as you need — <strong>no limit!</strong>
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: <FiUsers className="text-xl" />,
                label: "Total Contacts",
                value: contacts.length,
                color: "text-blue-500",
                bg: "bg-blue-50",
              },
              {
                icon: <FiCheck className="text-xl" />,
                label: "Active",
                value: contacts.filter((c) => c.status === "Active").length,
                color: "text-green-500",
                bg: "bg-green-50",
              },
              {
                icon: <FiPlus className="text-xl" />,
                label: "Max Contacts",
                value: "∞",
                color: "text-purple-500",
                bg: "bg-purple-50",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 border border-gray-100 text-center"
              >
                <div
                  className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}
                >
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <div className="text-2xl font-bold text-[#1A1A2E]">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Contacts Grid */}
          {contacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Top - Avatar + Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${contact.avatarColor} rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg`}
                    >
                      {contact.avatar}
                    </div>
                    <div className="flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      {contact.status}
                    </div>
                  </div>

                  {/* Info */}
                  <h3 className="font-bold text-[#1A1A2E] text-lg mb-1">
                    {contact.name}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <FiPhone className="text-[#E91E8C]" />
                    {contact.phone}
                  </div>
                  {contact.email ? (
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                      <FiMail className="text-[#E91E8C] text-xs" />
                      {contact.email}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-400 text-xs mb-2">
                      <FiMail className="text-orange-400 text-xs" />
                      No email — add for email alerts
                    </div>
                  )}
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      relationColors[contact.relation] ||
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {contact.relation}
                  </span>

                  {/* Divider */}
                  <div className="border-t border-gray-100 my-4"></div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {/* Edit */}
                    <button
                      onClick={() => handleEdit(contact)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-blue-500 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
                    >
                      <FiEdit2 className="text-sm" />
                      Edit
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteClick(contact)}
                      className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add More Card */}
              {
                <button
                  onClick={handleAddNew}
                  className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-[#E91E8C] hover:bg-pink-50 transition-all duration-300 group min-h-[200px]"
                >
                  <div className="w-14 h-14 bg-gray-100 group-hover:bg-pink-100 rounded-2xl flex items-center justify-center transition-colors">
                    <FiPlus className="text-2xl text-gray-400 group-hover:text-[#E91E8C] transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-500 group-hover:text-[#E91E8C] transition-colors">
                      Add New Contact
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {contacts.length} contact
                      {contacts.length !== 1 ? "s" : ""} added
                    </p>
                  </div>
                </button>
              }
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
              <div className="w-24 h-24 bg-pink-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FiUsers className="text-5xl text-[#E91E8C]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">
                No Contacts Yet
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Add emergency contacts who will be notified when you need help.
                We recommend adding at least 3 contacts.
              </p>
              <button
                onClick={handleAddNew}
                className="px-8 py-3 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Add Your First Contact
              </button>
            </div>
          )}

          {/* Add/Edit Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div>
                    <h3 className="text-xl font-bold text-[#1A1A2E]">
                      {editingContact ? "Edit Contact" : "Add New Contact"}
                    </h3>
                    <p className="text-gray-400 text-sm mt-0.5">
                      {editingContact
                        ? "Update contact details"
                        : "Fill in the contact details"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <FiX />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Contact's full name"
                        className={`w-full pl-11 pr-4 py-3.5 border-2 rounded-xl text-[#1A1A2E] placeholder-gray-400 focus:outline-none focus:border-[#E91E8C] transition-colors ${
                          errors.name
                            ? "border-red-400 bg-red-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1.5">
                        ⚠ {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className={`w-full pl-11 pr-4 py-3.5 border-2 rounded-xl text-[#1A1A2E] placeholder-gray-400 focus:outline-none focus:border-[#E91E8C] transition-colors ${
                          errors.phone
                            ? "border-red-400 bg-red-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1.5">
                        ⚠ {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                      Email Address
                      <span className="text-gray-400 text-xs font-normal ml-2">
                        (For emergency email alerts)
                      </span>
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="contact@email.com"
                        className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#E91E8C] text-[#1A1A2E] placeholder-gray-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Relation */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                      Relation *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {relations.map((rel) => (
                        <button
                          key={rel}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, relation: rel }));
                            if (errors.relation)
                              setErrors((prev) => ({ ...prev, relation: "" }));
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                            formData.relation === rel
                              ? "border-[#E91E8C] bg-pink-50 text-[#E91E8C]"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {rel}
                        </button>
                      ))}
                    </div>
                    {errors.relation && (
                      <p className="text-red-500 text-xs mt-1.5">
                        ⚠ {errors.relation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-3 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    {editingContact ? "Save Changes" : "Add Contact"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirm Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <FiTrash2 className="text-3xl text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">
                  Remove Contact?
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Are you sure you want to remove{" "}
                  <strong className="text-[#1A1A2E]">
                    {deleteTarget?.name}
                  </strong>{" "}
                  from your emergency contacts?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
                  >
                    Yes, Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Contacts;
