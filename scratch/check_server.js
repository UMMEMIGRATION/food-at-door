const http = require('http');

const paths = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/search',
  '/restaurant',
  '/cart',
  '/orders',
  '/profile'
];

async function checkPath(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      resolve({ path, statusCode: res.statusCode });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
}

async function run() {
  console.log("Starting server verification pings...");
  for (const path of paths) {
    const res = await checkPath(path);
    console.log(`Path: ${res.path} -> Status: ${res.statusCode || 'Error: ' + res.error}`);
  }
}

run();
