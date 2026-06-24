const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
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
  console.log("Signing in as admin...");
  await signInWithEmailAndPassword(auth, 'admin@foodatdoor.com', 'password123');
  console.log("Signed in successfully. Fetching refundRequests...");

  const snap = await getDocs(collection(db, 'refundRequests'));
  console.log(`Total refundRequests documents: ${snap.size}`);
  snap.forEach(doc => {
    console.log(`ID: ${doc.id} | Data:`, JSON.stringify(doc.data(), null, 2));
  });
}

run().catch(console.error);
