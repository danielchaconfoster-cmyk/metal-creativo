const test = require('node:test');
const assert = require('node:assert/strict');

// In Alpine.js, when a component has x-data="{ mobileMenuOpen: false }",
// property lookups delegate to parent scopes if not found locally.
// However, if mobileMenuOpen is also present on cartStore, it works either way!
