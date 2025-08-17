import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

/**
 * Hotels API - Fetch all active hotels for staff login
 * 
 * Returns list of hotels (user role) with their business names and hotel codes
 * sorted by hotel code in ascending order for staff selection.
 */
export async function GET(req) {
  try {
    
    await connectDB();

    // Find all active hotel owners (user role) with hotel codes
    const hotels = await User.find({
      role: 'user',
      isActive: true,
      hotelCode: { $exists: true, $ne: null, $ne: '' }
    }, 'businessName hotelCode name email').sort({ hotelCode: 1 }); // Sort by hotel code ascending

    const response = {
      success: true,
      message: "Hotels fetched successfully",
      hotels: hotels.map(hotel => ({
        _id: hotel._id,
        businessName: hotel.businessName || hotel.name,
        hotelCode: hotel.hotelCode,
        displayName: `${hotel.hotelCode} - ${hotel.businessName || hotel.name}`, // Format: "A0001 - Hotel Name"
        ownerName: hotel.name,
        ownerEmail: hotel.email
      }))
    };

    return new Response(
      JSON.stringify(response), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error fetching hotels:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Failed to fetch hotels",
        details: error.message 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
