import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "./db";
import Teacher from "../models/Teacher";
import Student from "../models/Student";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      //configiration function {keeps the configiration object in it}
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        //kullanıcı "Giriş Yap" butonuna bastığında devreye girer. kullanici verilerini dogrulayip obje olarak dondurur
        if (!credentials?.email || !credentials?.password) {
          //authentication
          throw new Error("Please enter an email and password");
        }

        await dbConnect();

        // Try to find user in Teacher model first
        let user = await Teacher.findOne({ email: credentials.email });

        // If not found in Teacher model, try Student model
        if (!user) {
          user = await Student.findOne({ email: credentials.email });
        }

        if (!user || !user?.password) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      //token olusturur ve rol bilgisini token icine ekler
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      //session nesnesi server'a giden oturum bilgisini temsil ediyor
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session; //session konfigurasyonu tanimlar. daha sonra server buna gore session olusturacak.
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
