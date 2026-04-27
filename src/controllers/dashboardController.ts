import { Request, Response } from "express";
import prisma from "../services/db";
import { toSnakeList } from "../utils/serializer";

export async function getDashboardStats(req: Request, res: Response) {
  try {
    // Total users
    const totalUsers = await prisma.profile.count();

    // Total profiles by gender
    const genderStats = await prisma.profile.groupBy({
      by: ["gender"],
      where: { gender: { not: null } },
      _count: { gender: true },
    });

    const totalMale =
      genderStats.find((g) => g.gender?.toLowerCase() === "male")?._count
        .gender || 0;
    const totalFemale =
      genderStats.find((g) => g.gender?.toLowerCase() === "female")?._count
        .gender || 0;

    // Total profiles by age group
    const ageGroupStats = await prisma.profile.groupBy({
      by: ["ageGroup"],
      where: { ageGroup: { not: null } },
      _count: { ageGroup: true },
    });

    const totalChildren =
      ageGroupStats.find((a) => a.ageGroup?.toLowerCase() === "child")?._count
        .ageGroup || 0;

    // Most recent profiles created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentProfiles = await prisma.profile.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert to snake_case format (consistent with other endpoints)

    return res.status(200).json({
      status: "success",
      data: {
        totalUsers,
        totalMale,
        totalFemale,
        totalChildren,
        recentProfiles: recentProfiles,
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to fetch dashboard stats" });
  }
}
