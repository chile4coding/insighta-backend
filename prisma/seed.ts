import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcrypt";
import { TokenService } from "../src/services/token";

const prisma = new PrismaClient();

interface ProfileData {
  name: string;
  gender: string;
  gender_probability: number;
  age: number;
  age_group: string;
  country_id: string;
  country_name: string;
  country_probability: number;
}

async function seed() {
  console.log("Starting seed...");

  // Create default users
  console.log("Creating default users...");
  const adminUser = await prisma.user.upsert({
    where: { githubId: "1" },
    update: {},
    create: {
      githubId: "1",
      username: "admin",
      email: "admin@insighta.com",
      avatarUrl: "https://github.com/admin.png",
      role: "admin",
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  const analystUser = await prisma.user.upsert({
    where: { githubId: "2" },
    update: {},
    create: {
      githubId: "2",
      username: "analyst",
      email: "analyst@insighta.com",
      avatarUrl: "https://github.com/analyst.png",
      role: "analyst",
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  console.log(`Created admin user: ${adminUser.username} (role: ${adminUser.role})`);
  console.log(`Created analyst user: ${analystUser.username} (role: ${analystUser.role})`);

  // Seed profiles
  const seedFilePath = path.join(__dirname, "seed_profiles.json");
  const seedData = JSON.parse(fs.readFileSync(seedFilePath, "utf-8"));
  const profiles: ProfileData[] = seedData.profiles;

  console.log(`Found ${profiles.length} profiles to seed.`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const profile of profiles) {
    try {
      await prisma.profile.upsert({
        where: { name: profile.name.toLowerCase().trim() },
        update: {
          gender: profile.gender.toLowerCase(),
          genderProbability: profile.gender_probability,
          age: profile.age,
          ageGroup: profile.age_group.toLowerCase(),
          countryId: profile.country_id.toUpperCase(),
          countryName: profile.country_name,
          countryProbability: profile.country_probability,
          userId: adminUser.id,
        },
        create: {
          name: profile.name.toLowerCase().trim(),
          gender: profile.gender.toLowerCase(),
          genderProbability: profile.gender_probability,
          age: profile.age,
          ageGroup: profile.age_group.toLowerCase(),
          countryId: profile.country_id.toUpperCase(),
          countryName: profile.country_name,
          countryProbability: profile.country_probability,
          userId: adminUser.id,
        },
      });
      successCount++;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        skippedCount++;
      } else {
        errorCount++;
        console.error(`Error seeding profile ${profile.name}:`, error);
      }
    }
  }

  console.log(
    `Seed complete. Success: ${successCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`,
  );

  const totalProfiles = await prisma.profile.count();
  const totalUsers = await prisma.user.count();
  console.log(`Total users in database: ${totalUsers}`);
  console.log(`Total profiles in database: ${totalProfiles}`);
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
