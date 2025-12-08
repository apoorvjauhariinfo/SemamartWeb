const mongoose = require("mongoose");

const sliderSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    // store multiple images
    images: {
        type: [String],
        required: true,
        validate: {
            validator: function (value) {
                const type = this.type;

                // type → required number of images
                const rules = {
                    slider: { min: 1, max: Infinity },       // unlimited
                    "banner-left": { min: 1, max: 1 },
                    "banner-right": { min: 1, max: 1 },
                    sectionbanner1: { min: 2, max: 2 },
                    sectionbanner2: { min: 2, max: 2 },
                    sectionbanner3: { min: 2, max: 2 }
                };

                const { min, max } = rules[type] || { min: 1, max: Infinity };

                return value.length >= min && value.length <= max;
            },
            message: (props) =>
                `Invalid number of images for type "${props.instance.type}"`
        }
    },

    link: {
        type: String,
        default: "#"
    },

    type: {
        type: String,
        enum: [
            "slider",
            "banner-left",
            "banner-right",
            "sectionbanner1",
            "sectionbanner2",
            "sectionbanner3"
        ],
        default: "slider"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Slider", sliderSchema);
