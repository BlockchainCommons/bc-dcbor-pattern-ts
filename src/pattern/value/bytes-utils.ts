/**
 * Byte array utility functions.
 */

/**
 * Compares two Uint8Arrays for equality.
 */
export const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

/**
 * Tests if bytes start with a prefix.
 */
export const bytesStartsWith = (bytes: Uint8Array, prefix: Uint8Array): boolean => {
  if (bytes.length < prefix.length) {
    return false;
  }
  for (let i = 0; i < prefix.length; i++) {
    if (bytes[i] !== prefix[i]) {
      return false;
    }
  }
  return true;
};

/**
 * The bytes as a string with one character per byte (code 0–255), the
 * text a byte regex runs over.
 */
export const bytesToLatin1 = (bytes: Uint8Array): string => {
  let result = "";
  for (const byte of bytes) {
    result += String.fromCharCode(byte);
  }
  return result;
};
