const mongoose = require("mongoose");

const manufacturerSchema = new mongoose.Schema(
	{
		manufacturerName: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			lowercase: true,
			trim: true,
		},
		phone: {
			type: String,
			trim: true,
		},
		origin: {
			type: String,
			trim: true,
		},
	},
	{ timestamps: true },
);

module.exports = mongoose.model("Manufacturer", manufacturerSchema);
