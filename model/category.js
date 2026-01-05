const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  image: {
    type: String,
    required: false, 
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory'
  }]
}, {
  timestamps: true
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category
