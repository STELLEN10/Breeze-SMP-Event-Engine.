const PREFIX = "[BreezeEvents]";

export const logger = {
  info(message) {
    console.warn(`${PREFIX} ${message}`);
  },
  warn(message) {
    console.warn(`${PREFIX} WARNING: ${message}`);
  },
  error(message) {
    console.error(`${PREFIX} ERROR: ${message}`);
  }
};
