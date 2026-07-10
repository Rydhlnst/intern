import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { members } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24, // 1 day
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.insert(members).values({
            memberCode: `MBR-${Date.now()}`,
            name: user.name,
            email: user.email,
            status: "active",
          });
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
