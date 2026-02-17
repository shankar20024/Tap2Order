import { User } from '@/models/User';
import { Order } from '@/models/Order';
import { MenuItem } from '@/models/MenuItem';
import { Table } from '@/models/Table';
import { Staff } from '@/models/Staff';
import { Customer } from '@/models/Customer';
import mongoose from 'mongoose';

/**
 * Data Reset Service
 * 
 * Timeline:
 * - Day 0-30: Full access (active/trial)
 * - Day 31-45: Read-only access
 * - Day 45+: Complete data reset
 */

export class DataResetService {
  
  /**
   * Reset all data for a user
   */
  static async resetUserData(userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      console.log(`🔄 Starting data reset for user: ${userId}`);
      
      // Delete all orders
      const orderResult = await Order.deleteMany({ userId }, { session });
      console.log(`📋 Deleted ${orderResult.deletedCount} orders`);
      
      // Delete all menu items
      const menuResult = await MenuItem.deleteMany({ userId }, { session });
      console.log(`🍽️ Deleted ${menuResult.deletedCount} menu items`);
      
      // Reset tables to default (keep table numbers, clear occupancy)
      const tableUpdate = await Table.updateMany(
        { userId },
        { 
          $set: { 
            isOccupied: false, 
            currentOrder: null,
            lastOccupied: null
          } 
        },
        { session }
      );
      console.log(`🪑 Reset ${tableUpdate.modifiedCount} tables`);
      
      // Delete all staff (except keep the structure)
      const staffResult = await Staff.deleteMany({ userId }, { session });
      console.log(`👥 Deleted ${staffResult.deletedCount} staff members`);
      
      // Delete all customer data
      const customerResult = await Customer.deleteMany({ userId }, { session });
      console.log(`👤 Deleted ${customerResult.deletedCount} customer records`);
      
      // Update user's reset tracking
      await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            isDataReset: true,
            lastDataReset: new Date(),
            subscriptionStatus: 'expired',
            currentStaffCount: 0,
            tables: [] // Clear table numbers
          },
          $unset: {
            menu: 1 // Clear menu array
          }
        },
        { session }
      );
      
      await session.commitTransaction();
      console.log(`✅ Data reset completed for user: ${userId}`);
      
      return {
        success: true,
        message: 'Data reset completed successfully',
        deletedCounts: {
          orders: orderResult.deletedCount,
          menuItems: menuResult.deletedCount,
          staff: staffResult.deletedCount,
          customers: customerResult.deletedCount,
          tablesReset: tableUpdate.modifiedCount
        }
      };
      
    } catch (error) {
      await session.abortTransaction();
      console.error(`❌ Data reset failed for user: ${userId}`, error);
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Check and perform data reset for expired users
   */
  static async checkAndResetExpiredUsers() {
    try {
      console.log('🔍 Checking for expired users needing data reset...');
      
      // Find users who need data reset
      const expiredUsers = await User.find({
        $and: [
          { role: 'user' }, // Only hotel owners, not admins
          { isDataReset: false }, // Not already reset
          { dataResetDate: { $lte: new Date() } } // Reset date passed
        ]
      });
      
      console.log(`📊 Found ${expiredUsers.length} users needing data reset`);
      
      const results = [];
      
      for (const user of expiredUsers) {
        try {
          const result = await this.resetUserData(user._id);
          results.push({
            userId: user._id,
            businessName: user.businessName,
            hotelCode: user.hotelCode,
            ...result
          });
        } catch (error) {
          results.push({
            userId: user._id,
            businessName: user.businessName,
            hotelCode: user.hotelCode,
            success: false,
            error: error.message
          });
        }
      }
      
      console.log(`📋 Data reset batch completed: ${results.filter(r => r.success).length} successful, ${results.filter(r => !r.success).length} failed`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Batch data reset failed:', error);
      throw error;
    }
  }
  
  /**
   * Get data reset status for a user
   */
  static async getDataResetStatus(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { error: 'User not found' };
      }
      
      const now = new Date();
      const dataResetDate = user.dataResetDate;
      const isOverdue = dataResetDate && dataResetDate <= now;
      
      return {
        isDataReset: user.isDataReset,
        lastDataReset: user.lastDataReset,
        dataResetDate: dataResetDate,
        daysUntilReset: dataResetDate ? Math.ceil((dataResetDate - now) / (1000 * 60 * 60 * 24)) : 0,
        isOverdue: isOverdue,
        canReset: !user.isDataReset && isOverdue
      };
      
    } catch (error) {
      console.error('❌ Get data reset status error:', error);
      return { error: 'Failed to get data reset status' };
    }
  }
  
  /**
   * Force reset user data (admin function)
   */
  static async forceResetUserData(userId, adminId) {
    try {
      console.log(`🔨 Admin ${adminId} forcing data reset for user: ${userId}`);
      
      const result = await this.resetUserData(userId);
      
      return {
        ...result,
        forcedBy: adminId,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error(`❌ Force data reset failed for user: ${userId}`, error);
      throw error;
    }
  }
  
  /**
   * Restore user to trial (admin function)
   */
  static async restoreUserToTrial(userId, adminId, trialDays = 30) {
    try {
      console.log(`🔄 Admin ${adminId} restoring user ${userId} to trial for ${trialDays} days`);
      
      const now = new Date();
      const trialExpiry = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      const dataResetDate = new Date(trialExpiry.getTime() + 15 * 24 * 60 * 60 * 1000);
      
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            subscriptionStatus: 'trial',
            subscriptionExpiry: trialExpiry,
            dataResetDate: dataResetDate,
            isDataReset: false,
            lastDataReset: null
          }
        },
        { new: true }
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      console.log(`✅ User ${userId} restored to trial until ${trialExpiry}`);
      
      return {
        success: true,
        message: 'User restored to trial successfully',
        userId: userId,
        businessName: user.businessName,
        trialExpiry: trialExpiry,
        dataResetDate: dataResetDate,
        restoredBy: adminId
      };
      
    } catch (error) {
      console.error(`❌ Restore user to trial failed:`, error);
      throw error;
    }
  }
}

export default DataResetService;
