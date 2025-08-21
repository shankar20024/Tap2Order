import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findById(session.user.id).select('-password -loginAttempts -lockUntil');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user in GET /api/profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    await connectDB();
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    const {
      password,
      role,
      hotelCode,
      createdBy,
      loginAttempts,
      lockUntil,
      lastLogin,
      subscriptionStatus,
      subscriptionExpiry,
      ...updateData
    } = body;

    // Validate GST number format if provided
    if (updateData.gstDetails?.gstNumber) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(updateData.gstDetails.gstNumber)) {
        return NextResponse.json({ error: 'Invalid GST number format' }, { status: 400 });
      }
    }

    // Validate PAN number format if provided
    if (updateData.gstDetails?.panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(updateData.gstDetails.panNumber)) {
        return NextResponse.json({ error: 'Invalid PAN number format' }, { status: 400 });
      }
    }

    // Validate FSSAI number format if provided
    if (updateData.fssaiDetails?.fssaiNumber) {
      const fssaiRegex = /^[0-9]{14}$/;
      if (!fssaiRegex.test(updateData.fssaiDetails.fssaiNumber)) {
        return NextResponse.json({ error: 'Invalid FSSAI number format (must be 14 digits)' }, { status: 400 });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true,
        select: '-password -loginAttempts -lockUntil'
      }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error in PUT /api/profile:", error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message)
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
