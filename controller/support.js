const express = require("express");
const jwt = require("jsonwebtoken");
const { uploadDocUpdate } = require("../multer");
const SupportTicket = require("../model/supportTicket");
const User = require("../model/user");
const Shop = require("../model/shop");
const sentMailToAdmin = require("../utils/mailToAdmin");

const router = express.Router();

async function resolveActor(req) {
  const { token, seller_token } = req.cookies || {};

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await User.findById(decoded.id).lean();
      if (user) {
        return { kind: "user", user };
      }
    } catch (error) {}
  }

  if (seller_token) {
    try {
      const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);
      const seller = await Shop.findById(decoded.id).lean();
      if (seller) {
        return { kind: "seller", seller };
      }
    } catch (error) {}
  }

  return null;
}

function normalizeUserType(rawUserType, actor) {
  if (rawUserType === "Institute" || rawUserType === "Seller" || rawUserType === "Customer" || rawUserType === "User") {
    return rawUserType;
  }

  if (actor?.kind === "seller") return "Seller";

  const role = actor?.user?.role;
  if (role === "Institute") return "Institute";

  return "Customer";
}

function buildIdentityCandidates(actor, explicitUser) {
  const values = new Set();

  if (explicitUser) values.add(String(explicitUser));

  if (actor?.kind === "user" && actor.user) {
    values.add(String(actor.user._id));
    if (actor.user.email) values.add(String(actor.user.email));
    if (actor.user.shopId) values.add(String(actor.user.shopId));
    if (actor.user.parentUser) values.add(String(actor.user.parentUser));
  }

  if (actor?.kind === "seller" && actor.seller) {
    values.add(String(actor.seller._id));
    if (actor.seller.email) values.add(String(actor.seller.email));
    if (actor.seller.businessName) values.add(String(actor.seller.businessName));
  }

  return Array.from(values).filter(Boolean);
}

async function generateCaseId(userType) {
  const prefix = userType === 'Seller' ? 'S' : 'U';
  const count = await SupportTicket.countDocuments({ userType });
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

router.post("/create", uploadDocUpdate.array("documents", 5), async (req, res) => {
  try {
    const actor = await resolveActor(req);
    const { userType, user, topic, message } = req.body || {};
    const files = req.files || [];
    const rawDocuments = Array.isArray(req.body.documents) ? req.body.documents : req.body.documents ? [req.body.documents] : [];

    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ success: false, message: "Topic is required" });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const normalizedUser = String(user || actor?.user?.email || actor?.seller?.email || "").trim();
    if (!normalizedUser) {
      return res.status(400).json({ success: false, message: "User identity is required" });
    }

    const documents = files.length > 0
      ? files.map((file) => `docs/${file.filename}`)
      : Array.isArray(rawDocuments)
      ? rawDocuments
          .filter((doc) => typeof doc === 'string' && doc.trim())
          .map((doc) => {
            const normalizedDoc = String(doc).trim().replace(/^\//, "");
            if (/^https?:\/\//i.test(normalizedDoc)) return normalizedDoc;
            return normalizedDoc.startsWith('docs/') ? normalizedDoc : `docs/${normalizedDoc}`;
          })
      : [];
    
    const finalUserType = normalizeUserType(userType, actor);
    const ticket = await SupportTicket.create({
      caseId: await generateCaseId(finalUserType),
      userType: finalUserType,
      user: normalizedUser,
      topic: String(topic).trim(),
      message: String(message).trim(),
      documents,
      conversation: [],
      status: "New",
    });

    // Send email notification to admin
    const adminSubject = `New Support Ticket - ${ticket.caseId}`;
    const adminBody = `
      <h2>New Support Ticket Received</h2>
      <p><strong>Case ID:</strong> ${ticket.caseId}</p>
      <p><strong>User Type:</strong> ${ticket.userType}</p>
      <p><strong>User:</strong> ${ticket.user}</p>
      <p><strong>Topic:</strong> ${ticket.topic}</p>
      <p><strong>Message:</strong> ${ticket.message}</p>
      <p><strong>Submitted:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
      <p>Please login to admin panel to respond.</p>
    `;
    sentMailToAdmin(adminSubject, adminBody);

    return res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticket,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create support ticket",
    });
  }
});

router.get("/all", async (req, res) => {
  try {
    // Temporary: bypass auth check to test
    // const actor = await resolveActor(req);
    // if (!actor?.user || actor.user.role !== "Admin") {
    //   return res.status(403).json({ success: false, message: "Admin access required" });
    // }

    const tickets = await SupportTicket.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, tickets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch tickets" });
  }
});

router.get("/user-tickets", async (req, res) => {
  try {
    const actor = await resolveActor(req);
    if (!actor?.user) {
      return res.status(401).json({ success: false, message: "User login required" });
    }

    const identifiers = buildIdentityCandidates(actor);
    const tickets = await SupportTicket.find({
      $or: [{ user: { $in: identifiers } }, { userType: { $in: ["Customer", "Institute", "User"] }, user: actor.user.email }],
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, tickets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch user tickets" });
  }
});

router.get("/seller-tickets", async (req, res) => {
  try {
    const actor = await resolveActor(req);
    if (!actor) {
      return res.status(401).json({ success: false, message: "Seller login required" });
    }

    const identifiers = buildIdentityCandidates(actor);
    const tickets = await SupportTicket.find({
      userType: "Seller",
      user: { $in: identifiers },
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, tickets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch seller tickets" });
  }
});

router.get("/:ticketId", async (req, res) => {
  try {
    const actor = await resolveActor(req);
    if (!actor) {
      return res.status(401).json({ success: false, message: "Login required" });
    }

    const ticket = await SupportTicket.findById(req.params.ticketId).lean();
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    if (actor?.user?.role !== "Admin") {
      const identifiers = buildIdentityCandidates(actor);
      if (!identifiers.includes(String(ticket.user))) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch ticket" });
  }
});

router.patch("/:ticketId/status", async (req, res) => {
  try {
    const actor = await resolveActor(req);
    if (!actor?.user || actor.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { status } = req.body || {};
    const allowedStatuses = ["New", "Open", "In Progress", "Closed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.ticketId,
      { status },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update ticket status" });
  }
});

router.patch("/:ticketId/message", async (req, res) => {
  try {
    const actor = await resolveActor(req);
    if (!actor) {
      return res.status(401).json({ success: false, message: "Login required" });
    }

    const from = req.body?.from || (actor.kind === "seller" ? "Seller" : actor.user?.role === "Admin" ? "Admin" : "User");
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    ticket.conversation.push({
      from,
      message,
      timestamp: new Date(),
      attachments: Array.isArray(req.body?.attachments) ? req.body.attachments : [],
    });

    if (from === "Admin" && ticket.status === "New") {
      ticket.status = "Open";
    }

    await ticket.save();

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to add message" });
  }
});

// Delete all tickets (for testing)
router.delete("/delete-all", async (req, res) => {
  try {
    await SupportTicket.deleteMany({});
    return res.status(200).json({ success: true, message: "All tickets deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;