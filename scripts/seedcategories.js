const Category = require("../model/category");
const mongoose = require("mongoose");
const Subcategory = require("../model/subcategory");
const { quiptSubCat, robo, diag, consumSubCat, instrumentSubCat, furn, it, kits, facility, special } = require("./subCat");

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
  // "Specialty Packages" // TODO: 
];

async function seedCategories() {
  try {

    await mongoose.connect("mongodb://127.0.0.1:27017/sema_local");
    // await mongoose.connect("mongodb+srv://shubham:Qwertyuiop@cluster0.nbshs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
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
  } catch (err) {
    console.error('❌ Error seeding categories:', err);
    process.exit(1);
  }
}


async function seedSubCats(catName, subCatOb) {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/sema_local");
    // await mongoose.connect("mongodb+srv://shubham:Qwertyuiop@cluster0.nbshs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

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



async function seedDb() {
  await seedCategories();
  await seedSubCats("Consumables", consumSubCat)
  await seedSubCats("Instruments", instrumentSubCat)
  await seedSubCats("Medical Equipment", quiptSubCat)
  await seedSubCats("Advanced & Robotic Systems", robo)
  await seedSubCats("Diagnostics", diag)
  await seedSubCats("Hospital Furniture", furn)
  await seedSubCats("Hospital IT & Software", it)
  await seedSubCats("Kits & Bundles", kits)
  await seedSubCats("Facility & Utilities", facility)
  // await seedSubCats("Pharmaceuticals & Therapeutics", facility) // TODO: no subcat

  process.exit();

}

seedDb()

// seedSubCats("Specialty Packages", special)
