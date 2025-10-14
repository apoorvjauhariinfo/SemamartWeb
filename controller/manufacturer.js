const express = require("express");
const Manufacturer = require("../model/manufacturer");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");

const router = express.Router();

router.get(
	"/search",
	catchAsyncErrors(async (req, res) => {
		const query = req.query.q?.trim();

		if (!query || query.length < 2) {
			return new ErrorHandler(400, "Not query");
		}

		const results = await Manufacturer.find({
			manufacturerName: { $regex: query, $options: "i" },
		})
			.select("manufacturerName email phone origin")
			.limit(10);

		res.status(200).json(results);
	}),
);

module.exports = router;
