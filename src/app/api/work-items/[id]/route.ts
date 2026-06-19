export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workItems } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [item] = await db.select().from(workItems).where(eq(workItems.id, parseInt(id)));
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch work item' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, status, priority, dueDate, amount, paymentStatus } = body;
    const [updated] = await db.update(workItems)
      .set({ title, description, status, priority, dueDate, amount, paymentStatus, updatedAt: new Date() })
      .where(eq(workItems.id, parseInt(id)))
      .returning();
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update work item' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(workItems).where(eq(workItems.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete work item' }, { status: 500 });
  }
}
