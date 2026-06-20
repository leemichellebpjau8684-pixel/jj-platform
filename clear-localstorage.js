// Script to clear all localStorage data for jiajiao app
// Run this in browser console or as a Node script

const keysToRemove = [
  'jiajiao_online_json',
  'jiajiao_draft_json',
  'jiajiao_archive_json',
  'jiajiao_stat_json',
  'jiajiao_current_landmark',
  'jiajiao_admin_verified'
];

console.log('Clearing jiajiao localStorage data...');
keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log(`Removed: ${key}`);
  }
});
console.log('All jiajiao data cleared!');

// If running in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { keysToRemove };
}