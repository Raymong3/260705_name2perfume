import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import crypto from 'node:crypto';

// Polyfill global crypto for older Node.js versions
const customGetRandomValues = function (typedArray: any) {
  if (!typedArray) {
    throw new TypeError("Failed to execute 'getRandomValues' on 'Crypto'");
  }
  const bytes = crypto.randomBytes(typedArray.byteLength);
  const uint8View = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
  uint8View.set(bytes);
  return typedArray;
};

if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = { getRandomValues: customGetRandomValues };
} else if (!globalThis.crypto.getRandomValues) {
  // @ts-ignore
  globalThis.crypto.getRandomValues = customGetRandomValues;
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
});


