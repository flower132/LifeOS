// Simple test using webkit's built-in automation via osascript
// Instead, let's just analyze the code statically

const fs = require('fs');
const path = require('path');

// Read the ObjectForm component
const formCode = fs.readFileSync('/Users/temp/Vibe_Project/LifeOS/components/object/ObjectForm.tsx', 'utf8');

// Key analysis
console.log('=== ObjectForm Analysis ===');

// 1. Check canSubmit logic
const canSubmitMatch = formCode.match(/const canSubmit = (.+)/);
console.log('canSubmit logic:', canSubmitMatch ? canSubmitMatch[1] : 'NOT FOUND');

// 2. Check how useObjectStore is used
const storeMatch = formCode.match(/useObjectStore\([^)]*\)/g);
console.log('useObjectStore calls:', storeMatch);

// 3. Check if there's any useEffect that resets name
const useEffectMatch = formCode.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[[^\]]*\]\)/g);
console.log('useEffect blocks:', useEffectMatch ? useEffectMatch.length : 0);

// Read the stores/index.ts
const storesCode = fs.readFileSync('/Users/temp/Vibe_Project/LifeOS/stores/index.ts', 'utf8');
console.log('\n=== Stores Index ===');
console.log('hydrateStores function exists:', storesCode.includes('hydrateStores'));

// Check ClientProviders for hydration
const providersCode = fs.readFileSync('/Users/temp/Vibe_Project/LifeOS/components/ClientProviders.tsx', 'utf8');
console.log('\n=== ClientProviders ===');
console.log('Has hydrateStores call:', providersCode.includes('hydrateStores'));

// The key question: does the hydration of useObjectStore cause ObjectForm to re-render?
// In Zustand v5, `const { addObject } = useObjectStore()` subscribes to the ENTIRE store.
// When hydrateStores() runs and sets objects/loaded/etc, ObjectForm re-renders.
// But React's useState should preserve state through re-renders.
// So canSubmit should still work after typing.

// However, there might be a timing issue - if the form re-renders during hydration,
// and the name input loses focus, the user might not see the state update.

console.log('\n=== Key Finding ===');
console.log('useObjectStore() without selector subscribes to entire store.');
console.log('This causes unnecessary re-renders but should NOT break useState.');
console.log('The issue might be elsewhere - perhaps TagSelect is the problem.');

// Read TagSelect
const tagCode = fs.readFileSync('/Users/temp/Vibe_Project/LifeOS/components/tag/TagSelect.tsx', 'utf8');

// Check the key handling
const enterKeyMatch = tagCode.match(/e\.key === "Enter"[\s\S]*?\n\s*\}/);
console.log('\n=== TagSelect Enter Key ===');
if (enterKeyMatch) {
  console.log('Enter key handler:', enterKeyMatch[0].substring(0, 200));
}

// Check if TagSelect has input that might steal focus
const tagInputMatch = tagCode.match(/<input[^>]*>/g);
console.log('\nTagSelect inputs:', tagInputMatch ? tagInputMatch.length : 0);

console.log('\n=== CONCLUSION ===');
console.log('The most likely issue: TagSelect has its own <input> that handles Enter key.');
console.log('When the dropdown is open with items, pressing Enter in the tag input');
console.log('prevents the form from submitting. But this should only affect tag input,');
console.log('not the Name input.');
console.log('\nLet me check if there is a focus/blur issue...');
