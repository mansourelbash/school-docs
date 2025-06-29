import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../[...nextauth]/route"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        canManageUsers: false,
        canManageCategories: false,
        canUploadDocuments: false,
        canEditOwnDocuments: false,
        canDeleteOwnDocuments: false,
        canViewAllDocuments: false,
        canViewReports: false
      }, { status: 401 })
    }

    // استخدام pg مباشرة
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    await client.connect()

    const result = await client.query(
      'SELECT role, permissions FROM users WHERE email = $1',
      [session.user.email]
    )

    await client.end()

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        canManageUsers: false,
        canManageCategories: false,
        canUploadDocuments: false,
        canEditOwnDocuments: false,
        canDeleteOwnDocuments: false,
        canViewAllDocuments: false
      })
    }

    const user = result.rows[0]
    const permissions = typeof user.permissions === 'string' 
      ? JSON.parse(user.permissions) 
      : user.permissions

    // إرجاع الصلاحيات
    return NextResponse.json({
      role: user.role,
      canManageUsers: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canManageUsers === true,
      canManageCategories: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canManageCategories === true,
      canUploadDocuments: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canUploadDocuments === true,
      canEditOwnDocuments: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canEditOwnDocuments === true,
      canDeleteOwnDocuments: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canDeleteOwnDocuments === true,
      canViewAllDocuments: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canViewAllDocuments === true,
      canManageDocuments: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canManageDocuments === true,
      canDeleteDocuments: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canDeleteDocuments === true,
      canViewReports: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canViewReports === true
    })

  } catch (error) {
    console.error('خطأ في فحص الصلاحيات:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // استخدام pg مباشرة
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })

    await client.connect()

    const result = await client.query(
      'SELECT role, permissions FROM users WHERE email = $1',
      [email]
    )

    await client.end()

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        canManageUsers: false,
        canManageCategories: false,
        canUploadDocuments: false,
        canEditOwnDocuments: false,
        canDeleteOwnDocuments: false,
        canViewAllDocuments: false,
        canViewReports: false
      })
    }

    const user = result.rows[0]
    const permissions = typeof user.permissions === 'string' 
      ? JSON.parse(user.permissions) 
      : user.permissions

    // إرجاع الصلاحيات
    return NextResponse.json({
      role: user.role,
      canManageUsers: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canManageUsers === true,
      canManageCategories: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canManageCategories === true,
      canUploadDocuments: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canUploadDocuments === true,
      canEditOwnDocuments: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canEditOwnDocuments === true,
      canDeleteOwnDocuments: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canDeleteOwnDocuments === true,
      canViewAllDocuments: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canViewAllDocuments === true,
      canViewReports: user.role === 'ADMIN' || user.role === 'admin' || permissions?.canViewReports === true
    })

  } catch (error) {
    console.error('خطأ في فحص الصلاحيات:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
