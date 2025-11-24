import { connectDB } from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { NextResponse } from 'next/server';

// GET /api/contacts - Get all contacts with optional status filter
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .lean();
      
    return NextResponse.json(contacts);
    
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create a new contact
export async function POST(request) {
  try {
    const { name, email, phone, message } = await request.json();
    
    // Basic validation
    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: 'Name, email, phone, and message are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';

    // Create new contact
    const newContact = await Contact.create({
      name,
      email,
      phone,
      message,
      metadata: {
        ipAddress,
        userAgent,
        referrer
      }
    });

    return NextResponse.json(
      { success: true, message: 'Your message has been sent successfully!', data: newContact },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving contact:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}

// PATCH /api/contacts/[id] - Update a contact (status, read status, etc.)
export async function PATCH(request) {
  try {
    const { id } = await request.json();
    const updateData = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedContact);
    
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}
