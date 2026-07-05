const crypto = require('crypto');

const customGetRandomValues = function (typedArray) {
  if (!typedArray) {
    throw new TypeError("Failed to execute 'getRandomValues' on 'Crypto': 1 argument required, but only 0 present.");
  }
  const bytes = crypto.randomBytes(typedArray.byteLength);
  const uint8View = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
  uint8View.set(bytes);
  return typedArray;
};

// 1. Mutate the native node:crypto module object itself
try {
  crypto.getRandomValues = customGetRandomValues;
} catch (e) {
  console.warn("Failed to mutate native crypto module:", e);
}

// 2. Mutate crypto.webcrypto if it exists
if (crypto.webcrypto) {
  try {
    crypto.webcrypto.getRandomValues = customGetRandomValues;
  } catch (e) {}
}

// 3. Polyfill globalThis
const polyfillCrypto = {
  getRandomValues: customGetRandomValues
};

if (typeof globalThis !== 'undefined') {
  if (!globalThis.crypto) {
    globalThis.crypto = polyfillCrypto;
  } else if (!globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues = customGetRandomValues;
  }
}

// 4. Polyfill global (older Node environments)
if (typeof global !== 'undefined') {
  if (!global.crypto) {
    global.crypto = polyfillCrypto;
  } else if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = customGetRandomValues;
  }
}
