export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calendarEvents, workItems, clients } from '@/lib/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const results = await db.select({
      id: calendarEvents.id,
      title: calendarEvents.title,
      description: calendarEvents.description,
      eventDate: calendarEvents.eventDate,
      eventType: calendarEvents.eventType,
      workItemId: calendarEvents.workItemId,
      clientId: workItems.clientId,
      clientName: clients.name,
    })
      .from(calendarEvents)
      .leftJoin(workItems, eq(calendarEvents.workItemId, workItems.id))
      .leftJoin(clients, eq(workItems.clientId, clients.id));

    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workItemId, title, description, eventDate, eventType } = body;
    if (!title || !eventDate) return NextResponse.json({ error: 'title and eventDate required' }, { status: 400 });

    const [event] = await db.insert(calendarEvents).values({
      workItemId: workItemId ? parseInt(workItemId) : null,
      userId: 1, // placeholder until auth
      title,
      description,
      eventDate: new Date(eventDate),
      eventType: eventType || 'task',
    }).returning();

    return NextResponse.json(event, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
