const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey:            "AIzaSyBMnW0A1JZshjrKxk2abjibXIhVBzgSz-U",
  authDomain:        "food-at-door-b85bc.firebaseapp.com",
  projectId:         "food-at-door-b85bc",
  storageBucket:     "food-at-door-b85bc.firebasestorage.app",
  messagingSenderId: "1000832072653",
  appId:             "1:1000832072653:web:0ae78f1a472749de8e2284",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function runInvestigation() {
  await signInWithEmailAndPassword(auth, 'partner_test_owner@example.com', 'password123');

  const q = collection(db, 'driverLocations');
  const snap = await getDocs(q);
  console.log(`driverLocations count: ${snap.size}`);
  snap.forEach(doc => {
    console.log(`DriverID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}

runInvestigation().catch(console.error);
