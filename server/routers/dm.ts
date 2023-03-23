import { protectedProcedure } from "./../trpc";
import { router } from "../trpc";
import { z } from "zod";
import prisma from "../prisma";
import { TRPCError } from "@trpc/server";
import { contentSchema } from "./chat";
import { channels } from "@/utils/ably";
import ably from "../ably";

export const dmRouter = router({
    info: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
            })
        )
        .query(async ({ input }) => {
            const target_user = await prisma.user.findUnique({
                where: {
                    id: input.userId,
                },
                select: {
                    name: true,
                    image: true,
                },
            });

            if (target_user == null)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "User not found",
                });
            return target_user;
        }),
    send: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                message: contentSchema,
            })
        )
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.session.user.id;
            const message = await prisma.directMessage.create({
                data: {
                    author_id: userId,
                    content: input.message,
                    receiver_id: input.userId,
                },
                include: {
                    author: true,
                },
            });

            await channels.dm.message_sent.publish(
                ably,
                [input.userId, userId],
                message
            );

            return message;
        }),
    messages: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                count: z.number().min(0).max(50).default(50),
                cursorType: z.enum(["after", "before"]).default("before"),
                cursor: z.string().datetime().optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            const userId = ctx.session.user.id;
            const messages = await prisma.directMessage.findMany({
                include: {
                    author: true,
                },
                orderBy: {
                    timestamp: "desc",
                },
                where: {
                    receiver_id: {
                        in: [input.userId, userId],
                    },
                    author_id: {
                        in: [input.userId, userId],
                    },
                    timestamp:
                        input.cursor != null
                            ? {
                                  [input.cursorType === "after" ? "gt" : "lt"]:
                                      input.cursor,
                              }
                            : undefined,
                },
                take: Math.min(input.count, 50),
            });

            return messages;
        }),
    update: protectedProcedure
        .input(
            z.object({
                messageId: z.number(),
                userId: z.string(),
                content: contentSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            const result = await prisma.directMessage.updateMany({
                where: {
                    id: input.messageId,
                    author_id: ctx.session.user.id,
                    receiver_id: input.userId,
                },
                data: {
                    content: input.content,
                },
            });

            if (result.count === 0)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No permission or message doesn't exist",
                });

            await channels.dm.message_updated.publish(
                ably,
                [input.userId, ctx.session.user.id],
                {
                    id: input.messageId,
                    content: input.content,
                }
            );
        }),
    delete: protectedProcedure
        .input(
            z.object({
                messageId: z.number(),
                userId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const result = await prisma.directMessage.deleteMany({
                where: {
                    id: input.messageId,
                    author_id: ctx.session.user.id,
                    receiver_id: input.userId,
                },
            });

            if (result.count === 0)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No permission or message doesn't exist",
                });

            await channels.dm.message_deleted.publish(
                ably,
                [input.userId, ctx.session.user.id],
                {
                    id: input.messageId,
                }
            );
        }),
});
