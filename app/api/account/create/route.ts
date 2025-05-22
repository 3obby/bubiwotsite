import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Function to generate a simple random password
function generatePassword(length = 20) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
}

export async function POST() {
  try {
    const password = generatePassword();
    // In a real application, you would HASH this password before saving!
    // For example, using bcrypt: const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        password: password, // Store the plain password for now as per current scope
                            // but ideally, this should be hashedPassword
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
    console.error("Failed to create account:", error);
    return NextResponse.json({ error: "Failed to create account. See server logs." }, { status: 500 });
  }
} 