import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  session: { strategy: 'jwt' },
});


