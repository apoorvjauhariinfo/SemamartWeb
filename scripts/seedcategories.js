const Category = require("../model/category");
const mongoose = require("mongoose");
const Subcategory = require("../model/subcategory");
const { quiptSubCat, robo, diag, consumSubCat, instrumentSubCat } = require("./subCat");

const categories = [
  "Consumables",
  "Instruments",
  "Medical Equipment",
  "Advanced & Robotic Systems",
  "Diagnostics",
  "Hospital Furniture",
  "Pharmaceuticals & Therapeutics",
  "Hospital IT & Software",
  "Kits & Bundles",
  "Facility & Utilities",
  "Specialty Packages"
];

async function seedCategories() {
  try {

    await mongoose.connect("mongodb://127.0.0.1:27017/sema_local");
    console.log('Connected to MongoDB');

    for (const name of categories) {
      const existing = await Category.findOne({ name });
      if (!existing) {
        await Category.create({ name });
        console.log(`✅ Category created: ${name}`);
      } else {
        console.log(`⚠️ Category already exists: ${name}`);
      }
    }

    console.log('Seeding complete.');
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding categories:', err);
    process.exit(1);
  }
}

// seedCategories();

async function seedSubCats(catName, subCatOb) {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/sema_local");

    const category = await Category.findOne({ name: catName });

    for (const subCat of Object.keys(subCatOb)) {
      // Object.keys(subCatOb).forEach(async (subCat) => {
      console.log(subCat)
      const newSubCat = await Subcategory.create({
        name: subCat,
        category: category._id,
        tags: subCatOb[subCat]
      })

      // push subcat in category
      category.subcategories.push(newSubCat._id)
    }
    // )

    await category.save()
  } catch (er) {
    console.error(er)
  }
}



seedSubCats("Advanced & Robotic Systems", robo)
