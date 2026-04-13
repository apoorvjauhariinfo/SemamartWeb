require("dotenv").config();
const mongoose = require("mongoose");
const { ProductVariant } = require("../model/product");

async function main() {
  const connectionString =
    process.env.DB_URL ||
    "mongodb+srv://shubham:Qwertyuiop@cluster0.nbshs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

  await mongoose.connect(connectionString);

  const variants = await ProductVariant.find({
    $or: [
      { commission: { $exists: false } },
      { commission: null },
      { "bulkOrders.commission": { $exists: false } },
      { "bulkOrders.commission": null },
    ],
  }).populate("productId", "commission");

  let updatedCount = 0;
  let bulkTierUpdatedCount = 0;

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

    variant.bulkOrders = Array.isArray(variant.bulkOrders) ? variant.bulkOrders : [];
    variant.bulkOrders.forEach((bulkOrder) => {
      const bulkCommission = Number(
        bulkOrder?.commission ?? variant.commission ?? fallbackCommission,
      );
      if (!Number.isFinite(bulkCommission)) return;

      if (bulkOrder.commission === undefined || bulkOrder.commission === null) {
        bulkOrder.commission = bulkCommission;
        bulkTierUpdatedCount += 1;
      }

      bulkOrder.commissionHistory = Array.isArray(bulkOrder.commissionHistory)
        ? bulkOrder.commissionHistory
        : [];

      if (bulkOrder.commissionHistory.length === 0) {
        bulkOrder.commissionHistory.push({
          commission: bulkCommission,
          updatedAt: new Date(),
        });
      }
    });

    await variant.save({ validateBeforeSave: false });
    updatedCount += 1;
  }

  console.log(`Backfilled commission for ${updatedCount} variants.`);
  console.log(`Backfilled commission for ${bulkTierUpdatedCount} bulk tiers.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
