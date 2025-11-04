const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "userType",
    },
    userType: {
      type: String,
      enum: ["User", "Shop"],
    },

    action: {
      type: String,
      required: true, // e.g. Product Updated, Order Created etc
    },

    entityType: {
      type: String,
      required: true, // user, shop, order, product etc
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId, // _id of the thing on which action is taken
      required: true,
    },

    metaData: {
      type: Object, // changed field, old data and new data etc
      default: {},
    },

    description: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);