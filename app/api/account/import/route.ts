import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;
    
    if (!password || typeof password !== 'string' || password.length < 10) {
      return NextResponse.json({ 
        error: "Invalid password. Password must be at least 10 characters long." 
      }, { status: 400 });
    }
    
    // In a real application, you would HASH this password before saving!
    // For example, using bcrypt: const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        password: password,
        hasLoggedIn: false, // Explicitly set to false for new accounts
        // The alias will be "anon" by default as defined in the schema
      },
    });

    return NextResponse.json({ 
      password: password, 
      userId: newUser.id,
      alias: newUser.alias,
      hasLoggedIn: false
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create account with imported password:", error);
    return NextResponse.json({ 
      error: "Failed to create account. See server logs." 
    }, { status: 500 });
  }
} 