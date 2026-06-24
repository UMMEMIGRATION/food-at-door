const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');
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
const auth = getAuth(app);

async function createRefund() {
  try {
    const userCred = await signInAnonymously(auth);
    const uid = userCred.user.uid;
    console.log('Signed in with UID:', uid);

    const refundId = 'ref_TEST_' + Date.now();
    await setDoc(doc(db, 'refundRequests', refundId), {
      id: refundId,
      orderId: 'FAD-123456',
      customerId: uid, // Use the authenticated UID
      customerName: 'Test Customer (Anon)',
      restaurantId: 'test-restaurant-id',
      amount: 15.99,
      type: 'Full',
      reason: 'Food was cold.',
      evidenceUrl: '',
      items: [{ name: 'Burger', price: 15.99, quantity: 1 }],
      status: 'Pending',
      createdAt: new Date().toLocaleString(),
      timestamp: new Date()
    });
    console.log(`Successfully created test refund: ${refundId}`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createRefund();
