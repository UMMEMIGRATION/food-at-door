const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');

// Timeout after 30 seconds
setTimeout(() => {
  console.error('TEST TIMEOUT REACHED: 30 seconds exceeded.');
  process.exit(1);
}, 30000);

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
const auth = getAuth(app);
const db = getFirestore(app);

async function testSignup() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'Password123!';
  console.log(`Attempting to sign up email: ${email}`);
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    console.log(`Auth user created successfully. UID: ${uid}`);
    
    console.log(`Attempting to write Firestore document to users/${uid}...`);
    await setDoc(doc(db, 'users', uid), {
      name: 'Test User',
      phone: '1234567890',
      email: email,
      photoURL: '',
      role: 'customer',
      addresses: [],
      uid: uid,
      createdAt: new Date(),
    });
    console.log('Firestore write SUCCESS!');
    process.exit(0);
  } catch (err) {
    console.error('Signup failed with exception:', err);
    process.exit(1);
  }
}

testSignup();
