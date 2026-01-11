import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const subjectRouter = createTRPCRouter({
    getSubjects: protectedProcedure
        .input(z.object({ schoolId: z.string() }))
        .query(async ({ input }) => {
            return await prisma.subject.findMany({
                where: { schoolId: input.schoolId },
                orderBy: { name: "asc" },
            });
        }),

    create: adminProcedure
        .input(z.object({
            schoolId: z.string(),
            name: z.string().min(1)
        }))
        .mutation(async ({ input }) => {
            return await prisma.subject.create({
                data: {
                    name: input.name,
                    schoolId: input.schoolId,
                },
            });
        }),

    update: adminProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().min(1)
        }))
        .mutation(async ({ input }) => {
            return await prisma.subject.update({
                where: { id: input.id },
                data: { name: input.name },
            });
        }),

    delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await prisma.subject.delete({
                where: { id: input.id },
            });
        }),
});
