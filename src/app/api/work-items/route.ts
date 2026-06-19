export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workItems, clients } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    const query = db.select({
      id: workItems.id,
      clientId: workItems.clientId,
      clientName: clients.name,
      clientSlug: clients.slug,
      title: workItems.title,
      description: workItems.description,
      status: workItems.status,
      priority: workItems.priority,
      dueDate: workItems.dueDate,
      amount: workItems.amount,
      paymentStatus: workItems.paymentStatus,
      createdAt: workItems.createdAt,
      updatedAt: workItems.updatedAt,
    })
      .from(workItems)
      .leftJoin(clients, eq(workItems.clientId, clients.id))
      .orderBy(desc(workItems.createdAt));

    const results = clientId
      ? await query.where(eq(workItems.clientId, parseInt(clientId)))
      : await query;

    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch work items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, title, description, status, priority, dueDate, amount, paymentStatus } = body;
    if (!clientId || !title) return NextResponse.json({ error: 'clientId and title are required' }, { status: 400 });

    const [item] = await db.insert(workItems).values({
      clientId: parseInt(clientId),
      title,
      description,
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      amount: amount || null,
      paymentStatus: paymentStatus || 'unpaid',
    }).returning();

    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create work item' }, { status: 500 });
  }
}
