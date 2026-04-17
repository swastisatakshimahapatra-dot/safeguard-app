import User from "../models/User.js";

// ✅ Get contacts
export const getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("emergencyContacts");

    res.status(200).json({
      success: true,
      contacts: user.emergencyContacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get contacts",
    });
  }
};

// ✅ Add contact
export const addContact = async (req, res) => {
  try {
    const { name, phone, email, relation } = req.body;

    console.log("📝 Adding contact:", { name, phone, email, relation });

    if (!name || !phone || !relation) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and relation required",
      });
    }

    const user = await User.findById(req.user.id);

    user.emergencyContacts.push({
      name,
      phone,
      email: email || "",
      relation,
    });

    await user.save();

    console.log("✅ Contact added with email:", email);

    res.status(201).json({
      success: true,
      message: "Contact added",
      contacts: user.emergencyContacts,
    });
  } catch (error) {
    console.error("❌ Add contact error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add contact",
    });
  }
};

// ✅ Update contact
export const updateContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { name, phone, email, relation } = req.body;

    console.log("📝 Updating contact:", contactId, {
      name,
      phone,
      email,
      relation,
    });

    const user = await User.findById(req.user.id);
    const contact = user.emergencyContacts.id(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // ✅ Update all fields including email
    if (name) contact.name = name;
    if (phone) contact.phone = phone;
    contact.email = email || "";
    if (relation) contact.relation = relation;

    await user.save();

    console.log("✅ Contact updated:", contact);

    res.status(200).json({
      success: true,
      message: "Contact updated",
      contacts: user.emergencyContacts,
    });
  } catch (error) {
    console.error("❌ Update contact error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update contact",
    });
  }
};

// ✅ Delete contact
export const deleteContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    const user = await User.findById(req.user.id);

    user.emergencyContacts = user.emergencyContacts.filter(
      (c) => c._id.toString() !== contactId,
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: "Contact removed",
      contacts: user.emergencyContacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete contact",
    });
  }
};
