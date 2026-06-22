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
  const email = `test_filter_${Date.now()}@test.com`;
  const userCredential = await createUserWithEmailAndPassword(auth, email, "password123");
  console.log(`Logged in as: ${userCredential.user.uid}`);

  console.log("Querying restaurants collection with status == approved, no orderBy...");
  const q = query(
    collection(db, "restaurants"),
    where("status", "==", "approved")
  );

  const snap = await getDocs(q);
  console.log(`Firestore returned ${snap.size} restaurants.`);

  const mapped = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    
    const cuisinesList = Array.isArray(data.cuisine) 
      ? data.cuisine 
      : (typeof data.cuisine === 'string' ? data.cuisine.split(',').map(c => c.trim()) : []);

    const mappedItem = {
      id: docSnap.id,
      name: data.name || "Unnamed Restaurant",
      cuisine: cuisinesList.join(", ") || "Indian",
      rating: data.rating || 4.5,
      deliveryTime: `${data.deliveryTime || 30} mins`,
      distance: `${data.distance || 2.0} km`,
      avgPrice: `₹${data.minOrder || 200} for one`,
      emoji: data.logo || "🍽️",
      isOpen: data.isOpen !== undefined ? data.isOpen : true,
      promo: data.promo || "",
      city: data.address?.city || "Hyderabad"
    };
    mapped.push(mappedItem);
  }

  // Sort in memory
  mapped.sort((a, b) => b.rating - a.rating);

  console.log("\nMapped and Sorted Restaurants:");
  console.log(JSON.stringify(mapped, null, 2));
}

run().catch(console.error);
