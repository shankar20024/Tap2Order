import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CustomerSupport } from '@/models/CustomerSupport';
import { User } from '@/models/User';
import { getAuthUser } from '@/lib/auth-middleware';

// GET - Fetch all customer support tickets (Admin only)
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const issueType = searchParams.get('issueType');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Build filter query
    let filter = {};
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (issueType && issueType !== 'all') filter.issueType = issueType;

    // Get total count for pagination
    const totalTickets = await CustomerSupport.countDocuments(filter);

    // Fetch tickets with pagination and populate hotel owner info
    const tickets = await CustomerSupport.find(filter)
      .populate('hotelOwner', 'businessName email hotelCode')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get summary statistics
    const stats = await CustomerSupport.aggregate([
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          openTickets: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          inProgressTickets: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolvedTickets: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          urgentTickets: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
          highPriorityTickets: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
        }
      }
    ]);

    return NextResponse.json({
      tickets,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTickets / limit),
        totalTickets,
        limit
      },
      stats: stats[0] || {
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        urgentTickets: 0,
        highPriorityTickets: 0
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch customer support tickets' },
      { status: 500 }
    );
  }
}

// POST - Create new customer support ticket
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      hotelOwner,
      subject,
      description,
      issueType,
      priority
    } = body;

    // Validate required fields
    if (!customerName || !customerEmail || !subject || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, customerEmail, subject, description' },
        { status: 400 }
      );
    }

    // Get hotel information if hotelOwner is provided
    let hotelName = null;
    let hotelCode = null;
    
    if (hotelOwner) {
      const hotel = await User.findById(hotelOwner).select('businessName hotelCode');
      if (hotel) {
        hotelName = hotel.businessName;
        hotelCode = hotel.hotelCode;
      }
    }

    // Create new support ticket
    const supportTicket = new CustomerSupport({
      customerName,
      customerEmail,
      customerPhone: customerPhone || 'Not provided',
      hotelOwner: hotelOwner || null,
      hotelName,
      hotelCode,
      subject,
      description,
      issueType: issueType || 'other',
      priority: priority || 'medium',
      status: 'open'
    });

    await supportTicket.save();

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: supportTicket
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
