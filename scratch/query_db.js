const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const firebaseConfig = {
  apiKey:            env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkDb() {
  try {
    console.log('Querying restaurants...');
    const snap = await getDocs(collection(db, 'restaurants'));
    console.log(`Found ${snap.size} restaurants:`);
    for (const d of snap.docs) {
      console.log(`- ID: ${d.id}, Name: ${d.data().name}, Status: ${d.data().status}`);
      // Check subcollections
      const catsSnap = await getDocs(collection(db, 'restaurants', d.id, 'menuCategories'));
      console.log(`  - menuCategories count: ${catsSnap.size}`);
      catsSnap.forEach(cat => console.log(`    - Category: ${cat.data().name}`));

      const itemsSnap = await getDocs(collection(db, 'restaurants', d.id, 'menuItems'));
      console.log(`  - menuItems count: ${itemsSnap.size}`);
      itemsSnap.forEach(item => console.log(`    - Item: ${item.data().name}`));
    }
  } catch (err) {
    console.error('Error querying DB:', err);
  }
}

checkDb();
