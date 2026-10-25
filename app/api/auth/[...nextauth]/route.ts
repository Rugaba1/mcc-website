// app/api/auth/[...nextauth]/route.ts
import NextAuth, { SessionStrategy } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { api } from "@/lib/api";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { 
          label: "Email/Phone", 
          type: "text", 
          placeholder: "email@example.com or phone number" 
        },
        password: { 
          label: "Password", 
          type: "password" 
        },
      },
      async authorize(credentials) {
        try {
          const identifier = credentials?.identifier;
          const password = credentials?.password;
          if (!identifier || !password) return null;

          const data = await api.authenticate({
            identifier,
            password,
            next: "/",
          });

          if (data.success && data.user) {
            return {
              id: String(data.user.id),
              name: [data.user.firstName, data.user.lastName]
                .filter(Boolean)
                .join(" "),
              email: data.user.email,
              role: data.user.role.id,
              language: null,
              timezone: null,
              device: "",
              identifier,
              image: data.user.profilePicture || null,
            };
          }
          
          return null;
        } catch {
          console.error("Legacy credentials authentication failed.");
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: JWT;
      user?: {
        id?: string;
        name?: string | null;
        email?: string | null;
        role?: number;
        language?: string | null;
        timezone?: string | null;
        identifier?: string | null;
        device?: string | null;
        image?: string | null;
        [key: string]: any;
      };
      trigger?: "signIn" | "signUp" | "update";
      session?: {
        id?: string;
        name?: string | null;
        role?:number;
        language?: string | null;
        timezone?: string | null;
        identifier?: string | null;
        device?: string | null;
        image?: string | null;
        [key: string]: any;
      };
    }): Promise<JWT> {
      // Initial sign in
      if (user) {
        token.id = user.id || "";
        token.name = user.name || null;
        token.role = user?.role|| -1;
        token.language = user.language || null;
        token.timezone = user.timezone || null;
        token.identifier = user.identifier || null;
        token.device = user.device || null;
        token.image = user.image || null;
      }
      
      // Update session
      if (trigger === "update" && session) {
        token.id = session.id ?? token.id;
        token.name = session.name ?? token.name;
        token.role = session.role ?? token.role;
        token.language = session.language ?? token.language;
        token.timezone = session.timezone ?? token.timezone;
        token.identifier = session.identifier ?? token.identifier;
        token.device = session.device ?? token.device;
        token.image = session.image ?? token.image;
      }
      
      return token;
    },
    
    async session({ 
      session, 
      token 
    }: { 
      session: any; 
      token: JWT;
    }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          name: token.name as string | null,
          role: token.role ,
          language: token.language as string | null,
          timezone: token.timezone as string | null,
          device: token.device as string | null,
          identifier: token.identifier as string | null,
          image: token.image as string | null,
        },
      };
    },
  },
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
const rateLimitedHandler = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 30,
})(handler);

export { rateLimitedHandler as GET, rateLimitedHandler as POST };