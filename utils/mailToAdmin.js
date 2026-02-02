const User = require("../model/user");
const sendMail = require("./sendMail");

async function sentMailToAdmin(subject, body) {
  try {
    const admin = await User.findOne({role:"Admin"})
    const adminEmail = "semaahealthcare@gmail.com";
    sendMail({ email: adminEmail, subject: subject, html: body });
  } catch (err) {
    console.log("failed to send mail to admin")
    console.log(err);
  }
}

module.exports = sentMailToAdmin;
