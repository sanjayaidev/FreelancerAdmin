export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workItems, clients } from '@/lib/schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const statuses = searchParams.get('statuses')?.split(',').filter(Boolean);

    const [client] = await db.select().from(clients).where(eq(clients.slug, slug));
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const conditions: any[] = [eq(workItems.clientId, client.id)];
    if (from) conditions.push(gte(workItems.dueDate, from));
    if (to) conditions.push(lte(workItems.dueDate, to));
    if (statuses && statuses.length > 0) conditions.push(inArray(workItems.status, statuses));

    const items = await db.select().from(workItems).where(and(...conditions)).orderBy(workItems.dueDate);

    const totalAmount = items.reduce((s, i) => s + Number(i.amount || 0), 0);
    const paidAmount = items.filter(i => i.paymentStatus === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0);
    const partialAmount = items.filter(i => i.paymentStatus === 'partial').reduce((s, i) => s + Number(i.amount || 0), 0);
    const unpaidAmount = items.filter(i => i.paymentStatus === 'unpaid').reduce((s, i) => s + Number(i.amount || 0), 0);

    return NextResponse.json({
      client: { name: client.name, company: client.company, email: client.email, slug: client.slug },
      filters: { from, to, statuses },
      summary: { totalAmount, paidAmount, partialAmount, unpaidAmount, totalItems: items.length },
      items,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch share data' }, { status: 500 });
  }
}
