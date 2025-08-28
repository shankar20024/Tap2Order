import { User } from "@/models/User";

/**
 * Generate next available hotel code in format: A1234
 * Logic: Fill gaps first (A0001, A0003 → assign A0002), then continue sequence
 */
export async function generateHotelCode() {
  try {
    // Get all existing hotel codes sorted
    const existingUsers = await User.find(
      { hotelCode: { $exists: true, $ne: null, $ne: '' } },
      { hotelCode: 1 }
    ).sort({ hotelCode: 1 });

    const existingCodes = existingUsers.map(user => user.hotelCode);
    
    if (existingCodes.length === 0) {
      // First hotel code
      return "A0001";
    }

    // Find the first gap in existing codes
    const gap = findFirstGap(existingCodes);
    if (gap) {
      return gap;
    }

    // No gaps found, generate next sequential code
    const lastCode = existingCodes[existingCodes.length - 1];
    return getNextSequentialCode(lastCode);

  } catch (error) {
    throw error;
  }
}

/**
 * Find first available gap in hotel codes
 */
function findFirstGap(existingCodes) {
  if (existingCodes.length === 0) return "A0001";

  // Check each letter series (A, B, C, etc.)
  for (let letterCode = 65; letterCode <= 90; letterCode++) { // A-Z
    const letter = String.fromCharCode(letterCode);
    
    // Get all codes for this letter
    const letterCodes = existingCodes
      .filter(code => code.startsWith(letter))
      .map(code => parseInt(code.substring(1)))
      .sort((a, b) => a - b);

    if (letterCodes.length === 0) {
      // No codes for this letter yet
      return `${letter}0001`;
    }

    // Convert to Set for O(1) lookup
    const codeSet = new Set(letterCodes);
    
    // Check for gaps starting from 1
    for (let i = 1; i <= 9999; i++) {
      if (!codeSet.has(i)) {
        return `${letter}${i.toString().padStart(4, '0')}`;
      }
    }
  }

  return null; // No gaps found
}

/**
 * Get next sequential code after the last one
 */
function getNextSequentialCode(lastCode) {
  const letter = lastCode.charAt(0);
  const number = parseInt(lastCode.substring(1));

  // If number is less than 9999, increment it
  if (number < 9999) {
    const newNumber = (number + 1).toString().padStart(4, '0');
    return `${letter}${newNumber}`;
  }

  // If number is 9999, move to next letter
  if (letter === 'Z') {
    throw new Error('All hotel codes exhausted! Maximum capacity reached.');
  }

  const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
  return `${nextLetter}0001`;
}

/**
 * Validate hotel code format
 */
export function validateHotelCode(code) {
  const regex = /^[A-Z]\d{4}$/;
  return regex.test(code);
}

/**
 * Check if hotel code is available
 */
export async function isHotelCodeAvailable(code) {
  if (!validateHotelCode(code)) {
    return false;
  }
  
  const existingUser = await User.findOne({ hotelCode: code });
  return !existingUser;
}
