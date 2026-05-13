// Basit logger utility
const logger = {
  info: (message) => console.log(`ℹ️  ${message}`),
  success: (message) => console.log(`✅ ${message}`),
  error: (message) => console.error(`❌ ${message}`),
  warn: (message) => console.warn(`⚠️  ${message}`),
  debug: (message) => console.log(`🐛 ${message}`),
};

module.exports = logger;
