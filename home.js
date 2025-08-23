import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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

const groupsList = document.getElementById("groupsList");
const gamesList = document.getElementById("gamesList");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
document.getElementById("closeModal").onclick = () => modal.classList.add("hidden");

// --- Render a group popup ---
async function openGroup(groupId) {
  const groupRef = doc(db, "groups", groupId);
  const snap = await getDoc(groupRef);
  if (!snap.exists()) return;

  const data = snap.data();
  modalBody.innerHTML = `
    <h2>${data.name}</h2>
    <p>Owner: ${data.owner}</p>
    <p>Members: ${data.members.length}</p>
    <button id="joinGroup">Join Group</button>
  `;
  document.getElementById("joinGroup").onclick = async () => {
    await updateDoc(groupRef, { members: arrayUnion(auth.currentUser.uid) });
    alert("Joined group!");
  };
  modal.classList.remove("hidden");
}

// --- Render a game popup ---
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
    <button id="likeBtn">👍 Like</button>
    <button id="dislikeBtn">👎 Dislike</button>
    <h3>Gamepasses</h3>
    <button id="createPassBtn">➕ Add Gamepass</button>
    <div id="passesList"></div>
  `;

  // Like/Dislike
  document.getElementById("likeBtn").onclick = () => updateDoc(gameRef, { likes: increment(1) });
  document.getElementById("dislikeBtn").onclick = () => updateDoc(gameRef, { dislikes: increment(1) });

  // Add gamepass
  document.getElementById("createPassBtn").onclick = async () => {
    const name = prompt("Gamepass name?");
    const price = parseInt(prompt("Price in Vixdust?"));
    if (!name || isNaN(price)) return;
    await addDoc(collection(gameRef, "gamepasses"), {
      name, price, createdAt: Date.now()
    });
    alert("Gamepass created!");
  };

  modal.classList.remove("hidden");
}

// --- Load all groups ---
async function loadGroups() {
  groupsList.innerHTML = "";
  const snap = await getDocs(collection(db, "groups"));
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.innerHTML = `<button>${data.name} (${data.members.length} members)</button>`;
    div.querySelector("button").onclick = () => openGroup(docSnap.id);
    groupsList.appendChild(div);
  });
}

// --- Load all games ---
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
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  document.getElementById("username").innerText = user.email;

  // Load
  loadGroups();
  loadGames();

  // Create group
  document.getElementById("createGroupBtn").onclick = async () => {
    const name = prompt("Group name?");
    await addDoc(collection(db, "groups"), {
      name,
      owner: user.email,
      members: [user.uid],
      createdAt: Date.now()
    });
    loadGroups();
  };

  // Create game
  document.getElementById("createGameBtn").onclick = async () => {
    const name = prompt("Game name?");
    const desc = prompt("Game description?");
    await addDoc(collection(db, "games"), {
      name,
      description: desc,
      owner: user.email,
      createdAt: Date.now(),
      likes: 0,
      dislikes: 0
    });
    loadGames();
  };
});
