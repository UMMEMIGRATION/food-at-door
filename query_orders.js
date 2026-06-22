const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');
const fs = require('fs');

const envFile = fs.readFileSync('C:/Users/DELL 7390 2in1/.gemini/antigravity/scratch/food-at-door/.env.local', 'utf8');
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

async function checkOrders() {
  try {
    console.log('Querying latest orders...');
    const q = query(collection(db, 'orders'), limit(5));
    const snap = await getDocs(q);
    console.log(`Found ${snap.size} orders:`);
    snap.forEach(d => {
      console.log(`Order ID: ${d.id}`);
      console.log(JSON.stringify(d.data(), null, 2));
    });
  } catch (err) {
    console.error('Error querying orders:', err);
  }
}

checkOrders();
