const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyAnoMnJSnVk7hy6AEJOCsZeh7kA1d1ZKp4",
  authDomain: "food-at-door-b85bc.firebaseapp.com",
  projectId: "food-at-door-b85bc",
  storageBucket: "food-at-door-b85bc.firebasestorage.app",
  messagingSenderId: "1000832072653",
  appId: "1:1000832072653:web:0ae78f1a472749de8e2284",
  measurementId: "G-ELS3XM3Y7B"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  console.log("Signing in as partner...");
  await signInWithEmailAndPassword(auth, 'partner_test_owner@example.com', 'password123');
  console.log("Signed in. Fetching cancelled orders...");
  
  const q = query(collection(db, 'orders'), where('status', '==', 'cancelled'));
  const snap = await getDocs(q);
  console.log(`Cancelled orders found: ${snap.size}`);
  snap.forEach(doc => {
    console.log(`Order ID: ${doc.id} | Data:`, JSON.stringify(doc.data(), null, 2));
  });
}

run().catch(console.error);
