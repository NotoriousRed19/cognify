import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO: Reemplaza con tu consulta real a la base de datos
        // Esto es un placeholder — conecta tu BD para verificar credenciales
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Por favor ingresa email y contraseña.");
        }

        // Ejemplo: buscar usuario en tu base de datos
        // const user = await db.user.findUnique({ where: { email: credentials.email } });
        // if (!user || !await bcrypt.compare(credentials.password, user.password)) {
        //   throw new Error("Credenciales inválidas.");
        // }
        // return { id: user.id, name: user.name, email: user.email };

        // Placeholder temporal — eliminar cuando conectes una base de datos
        throw new Error("CredentialsProvider no está conectado a una base de datos aún.");
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

export { handler as GET, handler as POST };
