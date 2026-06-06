import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password)
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    const token = await signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });

    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    response.cookies.set('token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 60 * 60 * 24, path: '/',
    });

    await prisma.activityLog.create({ data: { userId: user.id, action: 'USER_LOGIN', entityType: 'User', entityId: user.id, details: `${user.name} logged in` } });
    return response;
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Login failed' }, { status: 500 }); }
}
