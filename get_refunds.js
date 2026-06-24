const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey:            "AIzaSyAnoMnJSnVk7hy6AEJOCsZeh7kA1d1ZKp4",
  authDomain:        "food-at-door-b85bc.firebaseapp.com",
  projectId:         "food-at-door-b85bc",
  storageBucket:     "food-at-door-b85bc.firebasestorage.app",
  messagingSenderId: "1000832072653",
  appId:             "1:1000832072653:web:0ae78f1a472749de8e2284",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  await signInWithEmailAndPassword(auth, 'partner_test_owner@example.com', 'password123');
  const snap = await getDocs(collection(db, 'refundRequests'));
  console.log(`Total refundRequests: ${snap.size}`);
  snap.forEach(doc => {
    console.log(`ID: ${doc.id} | Data:`, JSON.stringify(doc.data()));
  });
}

run().catch(console.error);
