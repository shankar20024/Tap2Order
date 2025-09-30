import { connectDB } from "@/lib/mongodb";
import { BillCounter } from "@/models/BillCounter";

/**
 * Get next token number for today - automatically resets daily
 * @param {string} userId - Hotel owner's user ID
 * @returns {Promise<{tokenNumber: number, billCounter: Object}>}
 */
export async function getNextTokenNumber(userId) {
  try {
    await connectDB();
    
    const today = new Date().toISOString().split('T')[0];
    
    // Find or create today's bill counter
    let billCounter = await BillCounter.findOne({
      hotelOwner: userId,
      date: today
    });

    if (!billCounter) {
      // Create new counter for today (starts from 0)
      billCounter = new BillCounter({
        hotelOwner: userId,
        date: today,
        counter: 0
      });
          }

    // Increment counter for next token
    billCounter.counter += 1;
    await billCounter.save();

        
    return {
      tokenNumber: billCounter.counter,
      billCounter: billCounter
    };
  } catch (error) {
        throw error;
  }
}

/**
 * Get current token count for today without incrementing
 * @param {string} userId - Hotel owner's user ID
 * @returns {Promise<number>}
 */
export async function getCurrentTokenCount(userId) {
  try {
    await connectDB();
    
    const today = new Date().toISOString().split('T')[0];
    
    const billCounter = await BillCounter.findOne({
      hotelOwner: userId,
      date: today
    });

    return billCounter ? billCounter.counter : 0;
  } catch (error) {
        return 0;
  }
}

/**
 * Reset token counter for testing purposes (admin only)
 * @param {string} userId - Hotel owner's user ID
 * @param {string} date - Date to reset (YYYY-MM-DD format)
 * @returns {Promise<boolean>}
 */
export async function resetTokenCounter(userId, date = null) {
  try {
    await connectDB();
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const result = await BillCounter.findOneAndUpdate(
      {
        hotelOwner: userId,
        date: targetDate
      },
      {
        counter: 0
      },
      {
        new: true,
        upsert: true
      }
    );

        return true;
  } catch (error) {
        return false;
  }
}
