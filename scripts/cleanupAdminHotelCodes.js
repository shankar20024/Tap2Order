import { connectDB } from "../lib/mongodb.js";
import { User } from "../models/User.js";

/**
 * Migration Script: Remove hotel codes from admin users
 * 
 * This script fixes existing data where admin users incorrectly 
 * have hotel codes assigned. Only user role should have hotel codes.
 */

async function cleanupAdminHotelCodes() {
  try {
    console.log('🔧 Starting admin hotel code cleanup migration...');
    
    await connectDB();
    console.log('✅ Connected to database');

    // Find all admin users with hotel codes
    const adminUsersWithCodes = await User.find({
      role: 'admin',
      hotelCode: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`📊 Found ${adminUsersWithCodes.length} admin users with hotel codes:`);
    
    if (adminUsersWithCodes.length === 0) {
      console.log('✅ No admin users found with hotel codes. Database is clean!');
      return;
    }

    // Display admin users that will be cleaned
    adminUsersWithCodes.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Code: ${user.hotelCode}`);
    });

    console.log('\n🧹 Removing hotel codes from admin users...');

    // Remove hotel codes from admin users
    const result = await User.updateMany(
      { 
        role: 'admin',
        hotelCode: { $exists: true, $ne: null, $ne: '' }
      },
      { 
        $unset: { hotelCode: 1 } 
      }
    );

    console.log(`✅ Successfully cleaned ${result.modifiedCount} admin users`);

    // Verify cleanup
    const remainingAdminCodes = await User.countDocuments({
      role: 'admin',
      hotelCode: { $exists: true, $ne: null, $ne: '' }
    });

    if (remainingAdminCodes === 0) {
      console.log('✅ Cleanup verified: No admin users have hotel codes');
    } else {
      console.log(`⚠️  Warning: ${remainingAdminCodes} admin users still have hotel codes`);
    }

    // Show current hotel code distribution
    const userCodes = await User.countDocuments({
      role: 'user',
      hotelCode: { $exists: true, $ne: null, $ne: '' }
    });

    const adminCount = await User.countDocuments({ role: 'admin' });
    const userCount = await User.countDocuments({ role: 'user' });

    console.log('\n📊 Final Statistics:');
    console.log(`   - Total Admin Users: ${adminCount} (0 with hotel codes)`);
    console.log(`   - Total Hotel Owners: ${userCount} (${userCodes} with hotel codes)`);
    
    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupAdminHotelCodes()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { cleanupAdminHotelCodes };
