import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    const { password, hash } = await req.json();
    const valid = await bcrypt.compare(password, hash);
    return NextResponse.json({ valid });
}
