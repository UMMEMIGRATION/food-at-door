const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
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
  try {
    const userCred = await signInWithEmailAndPassword(auth, 'admin@foodatdoor.com', 'password123');
    const uid = userCred.user.uid;
    console.log(`Signed in successfully! UID: ${uid}`);

    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("User Document Data:", JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log(`No document found in 'users' collection for UID: ${uid}`);
    }
  } catch (err) {
    console.error("Sign in failed:", err.message);
  }
}

run().catch(console.error);
