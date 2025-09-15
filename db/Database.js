const mongoose = require("mongoose");

// const url = "mongodb+srv://shubham:Qwertyuiop@cluster0.nbshs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const url = "mongodb://127.0.0.1:27017/sema_local"

const connectDatabase = () => {
  mongoose
    //.connect(process.env.DB_URL, {
    .connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log(`mongod connected with server: ${url}`);
    });
};

module.exports = connectDatabase;
