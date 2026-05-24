import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLFjZI2ZF3ZHGhULBGeL3Yn7cqIhWa980",
  authDomain: "dr-josh-therapy-centre.firebaseapp.com",
  projectId: "dr-josh-therapy-centre",
  storageBucket: "dr-josh-therapy-centre.firebasestorage.app",
  messagingSenderId: "706849670034",
  appId: "1:706849670034:web:62e0cd7d6ea6c0d211f74b",
  measurementId: "G-ELJ8F9L1F9"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);