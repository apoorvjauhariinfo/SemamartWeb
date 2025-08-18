const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

const Subcategory = mongoose.model('Subcategory', subcategorySchema);

module.exports = Subcategory
