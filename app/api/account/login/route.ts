import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;
    
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ 
        error: "Password is required" 
      }, { status: 400 });
    }
    
    // Find user by password (in a real application, you would compare hashed passwords)
    const user = await prisma.user.findFirst({
      where: {
        password: password,
      },
    });

    if (!user) {
      return NextResponse.json({ 
        error: "Invalid password. Account not found." 
      }, { status: 404 });
    }
    
    // Update user to mark as logged in
    await prisma.user.update({
      where: { id: user.id },
      data: { hasLoggedIn: true }
    });

    return NextResponse.json({ 
      userId: user.id,
      alias: user.alias,
      hasLoggedIn: true,
      // In a real application, you would generate a session token here
      // and possibly set it as an HTTP-only cookie
      sessionActive: true
    }, { status: 200 });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ 
      error: "Login failed. See server logs." 
    }, { status: 500 });
  }
} 