import { seedAIMAData } from "./seedAIMA";
import { seedAdmin } from "./seedAdmin";
import { seedFairnessQuestions } from "./seedFairnessPrompts";

async function runAllSeeds() {
  try {
    console.log("🌱 Starting seed process...\n");

    // Run all seed functions
    await seedAIMAData();
    await seedAdmin();
    await seedFairnessQuestions();

    console.log("\n✅ All seeds completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed process failed:", error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runAllSeeds();
}