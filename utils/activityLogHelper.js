const ActivityLog = require("../model/activityLog");

async function addActivityLog({
  action,
  entityType,
  entityId,
  metaData = {},
  description = "",
  userId,
  userType,
}) {
  try {

    throw new Error("testing")

    await ActivityLog.create({
      user: userId,
      userType: userType,
      action: action,
      entityType: entityType,
      entityId: entityId,
      metaData: metaData,
      description: description,
    });
  } catch (err) {
    console.log(err);
  }
}

module.exports = addActivityLog;
