require("dotenv").config();
const mongoose = require("mongoose");
const { ProductVariant } = require("../model/product");

async function main() {
  const connectionString =
    process.env.DB_URL ||
    "mongodb+srv://shubham:Qwertyuiop@cluster0.nbshs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

  await mongoose.connect(connectionString);

  const variants = await ProductVariant.find({
    $or: [{ commission: { $exists: false } }, { commission: null }],
  }).populate("productId", "commission");

  let updatedCount = 0;

  for (const variant of variants) {
    const fallbackCommission = Number(variant?.productId?.commission ?? 0);
    if (!Number.isFinite(fallbackCommission)) continue;

    variant.commission = fallbackCommission;
    variant.commissionHistory = Array.isArray(variant.commissionHistory)
      ? variant.commissionHistory
      : [];

    if (variant.commissionHistory.length === 0) {
      variant.commissionHistory.push({
        commission: fallbackCommission,
        updatedAt: new Date(),
      });
    }

    await variant.save({ validateBeforeSave: false });
    updatedCount += 1;
  }

  console.log(`Backfilled commission for ${updatedCount} variants.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
