import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { date, startTime, endTime, reason } = body;

        if (!date || !startTime || !endTime) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create the block
        const block = await prisma.timeBlock.create({
            data: {
                photographerId: id,
                date: new Date(date), // Expecting YYYY-MM-DD
                startTime,
                endTime,
                reason
            }
        });

        // Return serialized block matching frontend interface
        return NextResponse.json({
            id: block.id,
            date: block.date.toISOString().split('T')[0],
            startTime: block.startTime,
            endTime: block.endTime,
            reason: block.reason
        });

    } catch (error) {
        console.error('Error creating time block:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const { blockId } = body;

        if (!blockId) {
            return NextResponse.json({ error: 'Missing blockId' }, { status: 400 });
        }

        await prisma.timeBlock.delete({
            where: { id: blockId }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting time block:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
