import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '../../../lib/mongodb';
import MenuItem from '../../../models/MenuItem';
import Table from '../../../models/Table';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const userId = session.user.id;

    // Fetch unique categories from menu items
    const categories = await MenuItem.distinct('category', { userId });
    
    // Fetch unique table numbers
    const tables = await Table.distinct('tableNumber', { userId });

    const filterOptions = {
      categories: categories.filter(Boolean), // Remove null/undefined values
      tables: tables.filter(Boolean).sort((a, b) => {
        // Sort tables numerically if they're numbers, otherwise alphabetically
        const aNum = parseInt(a);
        const bNum = parseInt(b);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.localeCompare(b);
      }),
      statuses: ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
      paymentMethods: ['cash', 'card', 'upi', 'wallet']
    };

    return NextResponse.json(filterOptions);
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch filter options', details: error.message },
      { status: 500 }
    );
  }
}
