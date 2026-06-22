const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  const email = `test_menu_${Date.now()}@test.com`;
  const userCredential = await createUserWithEmailAndPassword(auth, email, "password123");
  console.log(`Logged in as: ${userCredential.user.uid}`);

  console.log("Querying top-level menu_items collection...");
  const snap = await getDocs(collection(db, 'menu_items'));
  console.log(`Found ${snap.size} top-level menu_items:`);
  snap.forEach(doc => {
    console.log(`ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });

  const restaurantId = "SsO9Y6K1x3PaPKkLgn7P";
  console.log(`Querying top-level menu_items for restaurantId: ${restaurantId}...`);
  const q = query(collection(db, 'menu_items'), where('restaurantId', '==', restaurantId));
  const snap2 = await getDocs(q);
  console.log(`Found ${snap2.size} items:`);
  snap2.forEach(doc => {
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}

run().catch(console.error);
