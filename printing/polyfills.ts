// Needed for libraries that rely on Node's Buffer in React Native
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as any;

// react-native-bluetooth-classic supports Buffer writes
// We polyfill Buffer for RN runtimes that don't include it.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Buffer } = require('buffer');

if (!g.Buffer) {
  g.Buffer = Buffer;
}
