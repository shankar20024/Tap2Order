import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CustomerSupport } from '@/models/CustomerSupport';
import { getAuthUser } from '@/lib/auth-middleware';

// GET - Fetch single customer support ticket
export async function GET(request, { params }) {
  try {
    const authResult = await getAuthUser(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;

    // Only allow admin users to access customer support
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }

    await connectDB();
    
    const { id } = await params;
    const ticket = await CustomerSupport.findById(id)
      .populate('hotelOwner', 'businessName email hotelCode');

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ ticket });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

// PUT - Update customer support ticket
export async function PUT(request, { params }) {
  try {
    const authResult = await getAuthUser(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { status, assignedTo, resolution, priority, internalNote } = body;

    const updateData = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (resolution) updateData.resolution = resolution;
    if (priority) updateData.priority = priority;

    const ticket = await CustomerSupport.findById(params.id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Add internal note if provided
    if (internalNote) {
      ticket.internalNotes.push({
        note: internalNote,
        addedBy: user.email || user.businessName || 'Admin'
      });
    }

    // Update ticket fields
    Object.assign(ticket, updateData);
    await ticket.save();

    const updatedTicket = await CustomerSupport.findById(params.id)
      .populate('hotelOwner', 'businessName email hotelCode');

    return NextResponse.json({
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

// DELETE - Delete customer support ticket
export async function DELETE(request, { params }) {
  try {
    const authResult = await getAuthUser(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }

    await connectDB();

    const ticket = await CustomerSupport.findByIdAndDelete(params.id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Ticket deleted successfully' });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}
