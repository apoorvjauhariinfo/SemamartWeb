const mongoose = require("mongoose");

const url = process.env.DB_URL

// const url = "mongodb://127.0.0.1:27017/sema_local"

const connectDatabase = () => {
  mongoose
    .connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log(`mongod connected with server: ${url}`);
    });
};

module.exports = connectDatabase;
