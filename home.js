import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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
document.getElementById("closeModal").onclick = () => modal.classList.add("hidden");

// --- Group Popup ---
async function openGroup(groupId) {
  try {
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
      try {
        await updateDoc(groupRef, { members: arrayUnion(auth.currentUser.uid) });
        alert("Joined group!");
        loadGroups(); // refresh
      } catch (err) {
        console.error("Error joining group:", err);
        alert("Failed to join group: " + err.message);
      }
    };

    modal.classList.remove("hidden");
  } catch (err) {
    console.error("Error opening group:", err);
  }
}

// --- Game Popup ---
async function openGame(gameId) {
  try {
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

    document.getElementById("likeBtn").onclick = async () => {
      try { await updateDoc(gameRef, { likes: increment(1) }); loadGames(); } 
      catch (err) { alert("Error liking game: "+err.message); }
    };
    document.getElementById("dislikeBtn").onclick = async () => {
      try { await updateDoc(gameRef, { dislikes: increment(1) }); loadGames(); } 
      catch (err) { alert("Error disliking game: "+err.message); }
    };

    document.getElementById("createPassBtn").onclick = async () => {
      try {
        const name = prompt("Gamepass name?");
        const price = parseInt(prompt("Price in Vixdust?"));
        if (!name || isNaN(price)) return;
        await addDoc(collection(gameRef, "gamepasses"), { name, price, createdAt: Date.now() });
        alert("Gamepass created!");
      } catch (err) {
        console.error("Error creating gamepass:", err);
        alert("Failed to create gamepass: " + err.message);
      }
    };

    modal.classList.remove("hidden");
  } catch (err) {
    console.error("Error opening game:", err);
  }
}

// --- Load Groups ---
async function loadGroups() {
  groupsList.innerHTML = "";
  try {
    const snap = await getDocs(collection(db, "groups"));
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const members = Array.isArray(data.members) ? data.members : [];
      const div = document.createElement("div");
      div.innerHTML = `<button>${data.name} (${members.length} members)</button>`;
      div.querySelector("button").onclick = () => openGroup(docSnap.id);
      groupsList.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading groups:", err);
    alert("Failed to load groups: " + err.message);
  }
}

// --- Load Games ---
async function loadGames() {
  gamesList.innerHTML = "";
  try {
    const snap = await getDocs(collection(db, "games"));
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const div = document.createElement("div");
      div.innerHTML = `<button>${data.name} by ${data.owner}</button>`;
      div.querySelector("button").onclick = () => openGame(docSnap.id);
      gamesList.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading games:", err);
    alert("Failed to load games: " + err.message);
  }
}

// --- Auth ---
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  try {
    // Load username + vixdust from users collection
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const userData = userSnap.exists() ? userSnap.data() : {};
    usernameDisplay.innerText = userData.username || user.email;
    vixdustDisplay.innerText = `Vixdust: ${userData.vixdust || 0}`;

    // Load groups + games
    loadGroups();
    loadGames();

    // Create group
    document.getElementById("createGroupBtn").onclick = async () => {
      try {
        const name = prompt("Group name?");
        if (!name) return;
        await addDoc(collection(db, "groups"), {
          name,
          owner: userData.username || user.email,
          members: [user.uid],
          createdAt: Date.now()
        });
        alert("Group created!");
        loadGroups();
      } catch (err) {
        console.error("Error creating group:", err);
        alert("Failed to create group: " + err.message);
      }
    };

    // Create game
    document.getElementById("createGameBtn").onclick = async () => {
      try {
        const name = prompt("Game name?");
        const desc = prompt("Game description?");
        if (!name) return;
        await addDoc(collection(db, "games"), {
          name,
          description: desc || "",
          owner: userData.username || user.email,
          createdAt: Date.now(),
          likes: 0,
          dislikes: 0
        });
        alert("Game created!");
        loadGames();
      } catch (err) {
        console.error("Error creating game:", err);
        alert("Failed to create game: " + err.message);
      }
    };

  } catch (err) {
    console.error("Error loading user data:", err);
  }
});
