import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, updateDoc, arrayUnion, increment } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCga58FAppW68zxbVuPNPCiTsnqX4YzN4U",
  authDomain: "vixem-5c2e1.firebaseapp.com",
  projectId: "vixem-5c2e1",
  storageBucket: "vixem-5c2e1.firebasestorage.app",
  messagingSenderId: "107703363696",
  appId: "1:107703363696:web:a2171648c5221bedc6ecb5",
  measurementId: "G-2EH3SV2YDB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const usernameDisplay = document.getElementById("username");
const vixdustDisplay = document.getElementById("vixdust");
const groupsList = document.getElementById("groupsList");
const gamesList = document.getElementById("gamesList");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");

closeModal.onclick = () => modal.classList.add("hidden");

// --- Group Popup ---
async function openGroup(groupId) {
  const groupRef = doc(db, "groups", groupId);
  const snap = await getDoc(groupRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const members = Array.isArray(data.members) ? data.members : [];

  modalBody.innerHTML = `
    <h2>${data.name}</h2>
    <p>Owner: ${data.owner}</p>
    <p>Members: ${members.length}</p>
    <button id="joinGroupBtn">Join Group</button>
  `;

  document.getElementById("joinGroupBtn").onclick = async () => {
    await updateDoc(groupRef, { members: arrayUnion(auth.currentUser.uid) });
    alert("Joined group!");
    loadGroups();
    modal.classList.add("hidden");
  };

  modal.classList.remove("hidden");
}

// --- Game Popup ---
async function openGame(gameId) {
  const gameRef = doc(db, "games", gameId);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) return;

  const data = snap.data();
  modalBody.innerHTML = `
    <h2>${data.name}</h2>
    <p>${data.description}</p>
    <p>Owner: ${data.owner}</p>
    <p>Likes: ${data.likes || 0} | Dislikes: ${data.dislikes || 0}</p>
    <button id="likeBtn">👍</button>
    <button id="dislikeBtn">👎</button>
    <h3>Gamepasses</h3>
    <button id="createPassBtn">➕ Add Gamepass</button>
    <div id="passesList"></div>
  `;

  document.getElementById("likeBtn").onclick = async () => {
    await updateDoc(gameRef, { likes: increment(1) });
    loadGames();
  };
  document.getElementById("dislikeBtn").onclick = async () => {
    await updateDoc(gameRef, { dislikes: increment(1) });
    loadGames();
  };

  document.getElementById("createPassBtn").onclick = async () => {
    const name = prompt("Gamepass name?");
    const price = parseInt(prompt("Price in Vixdust?"));
    if (!name || isNaN(price)) return;
    await addDoc(collection(gameRef, "gamepasses"), { name, price, createdAt: Date.now() });
    alert("Gamepass created!");
  };

  modal.classList.remove("hidden");
}

// --- Load Groups ---
async function loadGroups() {
  groupsList.innerHTML = "";
  const snap = await getDocs(collection(db, "groups"));
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const members = Array.isArray(data.members) ? data.members : [];
    const div = document.createElement("div");
    div.innerHTML = `<button>${data.name} (${members.length} members)</button>`;
    div.querySelector("button").onclick = () => openGroup(docSnap.id);
    groupsList.appendChild(div);
  });
}

// --- Load Games ---
async function loadGames() {
  gamesList.innerHTML = "";
  const snap = await getDocs(collection(db, "games"));
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.innerHTML = `<button>${data.name} by ${data.owner}</button>`;
    div.querySelector("button").onclick = () => openGame(docSnap.id);
    gamesList.appendChild(div);
  });
}

// --- Auth ---
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  // Ensure user document exists
  const userRef = doc(db, "users", user.uid);
  let userSnap = await getDoc(userRef);
  let userData;
  if (!userSnap.exists()) {
    await setDoc(userRef, { username: user.email.split("@")[0], vixdust: 0 });
    userSnap = await getDoc(userRef);
  }
  userData = userSnap.data();
  usernameDisplay.innerText = userData.username;
  vixdustDisplay.innerText = `Vixdust: ${userData.vixdust}`;

  // Load lists
  loadGroups();
  loadGames();

  // Create Group
  document.getElementById("createGroupBtn").onclick = async () => {
    const name = prompt("Group name?");
    if (!name) return;
    await addDoc(collection(db, "groups"), {
      name,
      owner: userData.username,
      members: [user.uid],
      createdAt: Date.now()
    });
    loadGroups();
  };

  // Create Game
  document.getElementById("createGameBtn").onclick = async () => {
    const name = prompt("Game name?");
    const desc = prompt("Game description?");
    if (!name) return;
    await addDoc(collection(db, "games"), {
      name,
      description: desc || "",
      owner: userData.username,
      createdAt: Date.now(),
      likes: 0,
      dislikes: 0
    });
    loadGames();
  };
});
