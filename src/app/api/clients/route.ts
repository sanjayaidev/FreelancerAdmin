export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    const all = await db.select().from(clients).orderBy(clients.createdAt);
    return NextResponse.json(all);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, company, address, notes } = body;
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    let slug = slugify(name);
    // ensure unique slug
    const existing = await db.select({ id: clients.id }).from(clients).where(eq(clients.slug, slug));
    if (existing.length > 0) slug = `${slug}-${Date.now()}`;

    const [client] = await db.insert(clients).values({ name, email, phone, company, address, notes, slug }).returning();
    return NextResponse.json(client, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
