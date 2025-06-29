import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ بيانات الدخول مفقودة')
          return null
        }
        console.log('🚀 محاولة تسجيل دخول:', credentials.email)
        try {
          const { Client } = require('pg')
          const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
          })
          await client.connect()
          console.log('🔍 البحث عن المستخدم:', credentials.email)
          const result = await client.query(
            'SELECT id, name, email, password, role FROM users WHERE email = $1',
            [credentials.email]
          )
          await client.end()
          if (result.rows.length === 0) {
            console.log('❌ المستخدم غير موجود:', credentials.email)
            return null
          }
          const user = result.rows[0]
          console.log('✅ تم العثور على المستخدم:', user.email, 'Role:', user.role)
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )
          if (!isValidPassword) {
            console.log('❌ كلمة المرور غير صحيحة للمستخدم:', user.email)
            return null
          }
          console.log('✅ تم تسجيل الدخول بنجاح:', user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error('❌ خطأ في التحقق:', error)
          return null
        }
      }
    })
  ],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/admin/login",
  },
  debug: true,
  callbacks: {
    async jwt({ token, user, account }) {
      console.log('🔧 JWT Callback - User:', user, 'Token:', token, 'Account:', account)
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        console.log('✅ تم تحديث JWT token:', { id: token.id, role: token.role })
      } else if (token.email && !token.role) {
        try {
          const { Client } = require('pg')
          const client = new Client({
            connectionString: process.env.DATABASE_URL
          })
          await client.connect()
          const result = await client.query(
            'SELECT id, role FROM users WHERE email = $1',
            [token.email]
          )
          if (result.rows.length > 0) {
            token.id = result.rows[0].id
            token.role = result.rows[0].role
            console.log('✅ تم جلب الدور من قاعدة البيانات:', token.role)
          }
          await client.end()
        } catch (error) {
          console.error('❌ خطأ في جلب الدور:', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      console.log('🔧 Session Callback - Token:', token, 'Session:', session)
      if (token && session.user) {
        (session.user as any).id = token.id as string
        ;(session.user as any).role = token.role as string
        try {
          const { Client } = require('pg')
          const client = new Client({
            connectionString: process.env.DATABASE_URL
          })
          await client.connect()
          const result = await client.query(
            'SELECT image FROM users WHERE email = $1',
            [session.user.email]
          )
          if (result.rows.length > 0) {
            (session.user as any).image = result.rows[0].image
          }
          await client.end()
        } catch (error) {
          console.error('❌ خطأ في جلب الصورة:', error)
        }
        console.log('✅ تم تحديث Session:', { 
          id: (session.user as any).id, 
          role: (session.user as any).role,
          image: (session.user as any).image 
        })
      }
      return session
    }
  }
}

export default authOptions;
