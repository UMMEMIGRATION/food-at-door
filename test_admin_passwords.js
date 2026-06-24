const { initializeApp } = require('firebase/app');
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
const auth = getAuth(app);

const passwords = ['admin123', 'admin@123', 'admin12345', 'password123', '123456', 'admin1234', 'admin'];

async function run() {
  for (const pwd of passwords) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, 'admin@foodatdoor.com', pwd);
      console.log(`SUCCESS! Password is: ${pwd}`);
      console.log(`UID: ${userCred.user.uid}`);
      return;
    } catch (err) {
      console.log(`Failed for password '${pwd}': ${err.message}`);
    }
  }
}

run().catch(console.error);
