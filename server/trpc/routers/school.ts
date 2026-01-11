import { z } from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
    adminProcedure,
} from "../trpc";
import { prisma } from "@/lib/prisma";

export const schoolRouter = createTRPCRouter({
    // Create a new school (Admin only)
    create: adminProcedure
        .input(
            z.object({
                name: z.string().min(3, "Nama sekolah minimal 3 karakter"),
                address: z.string().optional(),
                logoUrl: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const school = await prisma.school.create({
                data: input,
            });
            return school;
        }),

    // Update a school (Admin only)
    update: adminProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(3, "Nama sekolah minimal 3 karakter").optional(),
                address: z.string().optional(),
                logoUrl: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const { id, ...data } = input;
            const school = await prisma.school.update({
                where: { id },
                data,
            });
            return school;
        }),

    // Delete a school (Admin only)
    delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await prisma.school.delete({
                where: { id: input.id },
            });
            return { success: true };
        }),

    // Get all schools (Admin can see all, regular users might be restricted in future but for now used for selection)
    // For admin dashboard mostly. For public selection we might need a public procedure.
    getAll: adminProcedure.query(async () => {
        return await prisma.school.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { users: true, classes: true },
                },
            },
        });
    }),

    // Public procedure to list schools for registration/onboarding
    getSchoolsForSelection: protectedProcedure.query(async () => {
        return await prisma.school.findMany({
            select: { id: true, name: true, logoUrl: true },
            orderBy: { name: "asc" },
        });
    }),

    // Get classes for a specific school
    getClasses: protectedProcedure
        .input(z.object({ schoolId: z.string() }))
        .query(async ({ input }) => {
            return await prisma.class.findMany({
                where: { schoolId: input.schoolId },
                orderBy: { name: "asc" },
            });
        }),

    // Add a class to a school (Admin only)
    addClass: adminProcedure
        .input(
            z.object({
                schoolId: z.string(),
                name: z.string().min(1, "Nama kelas harus diisi"),
            })
        )
        .mutation(async ({ input }) => {
            // Check for duplicate class in same school
            const existing = await prisma.class.findFirst({
                where: {
                    schoolId: input.schoolId,
                    name: input.name,
                },
            });

            if (existing) {
                throw new Error("Kelas dengan nama tersebut sudah ada di sekolah ini");
            }

            return await prisma.class.create({
                data: {
                    schoolId: input.schoolId,
                    name: input.name,
                },
            });
        }),

    // Remove a class (Admin only)
    removeClass: adminProcedure
        .input(z.object({ classId: z.string() }))
        .mutation(async ({ input }) => {
            await prisma.class.delete({
                where: { id: input.classId },
            });
            return { success: true };
        }),

    // Get all unique legacy class strings from User table
    getLegacyClasses: adminProcedure.query(async () => {
        const groups = await prisma.user.groupBy({
            by: ['kelas'],
            _count: {
                _all: true
            },
            where: {
                kelas: { not: null }
            },
            orderBy: {
                kelas: 'asc'
            }
        });

        return groups
            .filter(g => g.kelas !== null)
            .map(g => ({
                name: g.kelas as string,
                studentCount: g._count._all
            }));
    }),

    // Migrate a legacy class string to a real Class entity and link users
    migrateClass: adminProcedure
        .input(
            z.object({
                schoolId: z.string(),
                className: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            const { schoolId, className } = input;

            // 1. Ensure Class exists in the school
            await prisma.class.upsert({
                where: {
                    schoolId_name: {
                        schoolId,
                        name: className,
                    },
                },
                update: {}, // No update needed if exists
                create: {
                    schoolId,
                    name: className,
                },
            });

            // 2. Update all users with this `kelas` string to use this `schoolId`
            const updateResult = await prisma.user.updateMany({
                where: {
                    kelas: className,
                },
                data: {
                    schoolId,
                },
            });

            return {
                success: true,
                usersUpdated: updateResult.count,
            };
        }),

    // Get consolidated data for the unified admin panel
    getUnifiedManagementData: adminProcedure.query(async () => {
        const schools = await prisma.school.findMany({
            orderBy: { name: "asc" },
            include: {
                classes: {
                    orderBy: { name: "asc" },
                },
            },
        });

        // Fetch all subscriptions
        const subscriptions = await (prisma as any).classSubscription.findMany();

        // Get user counts grouped by school and kelas string
        const userCounts = await prisma.user.groupBy({
            by: ["schoolId", "kelas"],
            _count: {
                _all: true,
            },
        });

        // Merge the data
        const consolidatedData = schools.map((school) => {
            const processedClasses = school.classes.map((cls) => {
                const sub = subscriptions.find((s: any) => s.kelas === cls.name);
                const countObj = userCounts.find(
                    (uc) => uc.schoolId === school.id && uc.kelas === cls.name
                );

                return {
                    ...cls,
                    userCount: countObj?._count._all || 0,
                    subscription: sub || null,
                };
            });

            // Calculate total students across all classes in this school
            const totalStudents = userCounts
                .filter((uc) => uc.schoolId === school.id)
                .reduce((acc, curr) => acc + curr._count._all, 0);

            // Check if there are users with schoolId but whose kelas is NOT in the Class model
            // (Legacy/Inconsistent data)
            const classNamesInModel = new Set(processedClasses.map(c => c.name));
            const legacyUsers = userCounts.filter(uc =>
                uc.schoolId === school.id &&
                uc.kelas &&
                !classNamesInModel.has(uc.kelas)
            );

            const legacyClasses = legacyUsers.map(lu => ({
                id: `legacy-${lu.kelas}`,
                name: lu.kelas,
                userCount: lu._count._all,
                subscription: subscriptions.find((s: any) => s.kelas === lu.kelas) || null,
                isLegacy: true
            }));

            return {
                id: school.id,
                name: school.name,
                address: school.address,
                logoUrl: school.logoUrl,
                createdAt: school.createdAt,
                updatedAt: school.updatedAt,
                classes: [...processedClasses, ...legacyClasses],
                totalStudents,
                totalClasses: processedClasses.length + legacyClasses.length,
            };
        });

        return consolidatedData;
    }),
});
