import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-middleware";
import { connectDB } from "@/lib/mongodb";
import { BillCounter } from "@/models/BillCounter";

export async function GET(request) {
  try {
    await connectDB();
    
    const { user, error } = await getAuthUser(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get today's bill counter - automatically creates new one for new day
    let billCounter = await BillCounter.findOne({
      hotelOwner: user.id,
      date: today
    });

    if (!billCounter) {
      // New day - create counter starting from 0 (so first token will be 1)
      billCounter = new BillCounter({
        hotelOwner: user.id,
        date: today,
        counter: 0
      });
      await billCounter.save();
      console.log(`New day detected: Token counter reset for ${today}`);
    }

    const nextTokenNumber = billCounter.counter + 1;

    return NextResponse.json({ 
      nextTokenNumber,
      date: today,
      currentCounter: billCounter?.counter || 0
    });
  } catch (error) {
    console.error('Error fetching token number:', error);
    return NextResponse.json(
      { error: "Failed to fetch token number" },
      { status: 500 }
    );
  }
}
