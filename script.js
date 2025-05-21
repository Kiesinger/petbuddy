// Supabase Initialisierung
const supabaseClient = supabase.createClient(
  'https://YOUR_PROJECT_ID.supabase.co',
  'YOUR_PUBLIC_ANON_KEY'
);

let currentUserId = null;

// Login
document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    alert('Login fehlgeschlagen: ' + error.message);
  } else {
    loadUser();
  }
});

// Registrierung
document.getElementById('signup-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    alert('Registrierung fehlgeschlagen: ' + error.message);
  } else {
    alert('Registrierung erfolgreich! Bitte einloggen.');
  }
});

// Profil speichern
document.getElementById('save-profile').addEventListener('click', async () => {
  const fullName = document.getElementById('full-name').value;
  const age = document.getElementById('age').value;
  const location = document.getElementById('location').value;
  const gender = document.getElementById('gender').value;
  const role = document.getElementById('role').value;

  const { error } = await supabaseClient
    .from('profiles')
    .upsert([{ id: currentUserId, full_name: fullName, age, location, gender, role }]);

  if (error) {
    alert('Fehler beim Speichern des Profils');
  } else {
    alert('Profil gespeichert!');
    loadUsers();
    loadSitters();
  }
});

// Tier hinzufügen
document.getElementById('pet-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const petName = document.getElementById('pet-name').value;
  const petType = document.getElementById('pet-type').value;
  const description = document.getElementById('pet-description').value;
  const petRole = document.getElementById('pet-role').value;

  const { error } = await supabaseClient.from('pets').insert([
    {
      user_id: currentUserId,
      name: petName,
      type: petType,
      description: description,
      role: petRole
    }
  ]);

  if (error) {
    alert('Fehler beim Hinzufügen des Tiers');
  } else {
    alert('Tier hinzugefügt!');
    loadMyPets();
  }
});

// Seite laden
async function loadUser() {
  const userData = await supabaseClient.auth.getUser();
  const user = userData.data.user;
  if (!user) return;

  currentUserId = user.id;

  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('page-select').classList.remove('hidden');
  document.getElementById('profile-page').classList.remove('hidden');

  await loadProfile();
  loadMyPets();
  loadUsers();
  loadSitters();
  initializeMap();
}

// Profil laden
async function loadProfile() {
  const { data } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', currentUserId)
    .single();

  if (data) {
    document.getElementById('full-name').value = data.full_name || '';
    document.getElementById('age').value = data.age || '';
    document.getElementById('location').value = data.location || '';
    document.getElementById('gender').value = data.gender || '';
    document.getElementById('role').value = data.role || '';
  }
}

// Eigene Tiere laden
async function loadMyPets() {
  const { data } = await supabaseClient
    .from('pets')
    .select('*')
    .eq('user_id', currentUserId);

  const list = document.getElementById('pet-list');
  list.innerHTML = '';

  data.forEach((pet) => {
    const item = document.createElement('li');
    item.textContent = `${pet.name} (${pet.type}) – ${pet.description}`;
    list.appendChild(item);
  });
}

// Nutzer laden
async function loadUsers() {
  const { data } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('role', 'owner');

  const list = document.getElementById('users-list');
  list.innerHTML = '';

  data.forEach((user) => {
    const item = document.createElement('li');
    item.textContent = `${user.full_name} (${user.location})`;
    list.appendChild(item);
  });
}

// Sitter laden
async function loadSitters() {
  const { data } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('role', 'sitter');

  const list = document.getElementById('sitters-list');
  list.innerHTML = '';

  data.forEach((user) => {
    const item = document.createElement('li');
    item.textContent = `${user.full_name} (${user.location})`;
    list.appendChild(item);
  });
}

// Seitenwechsel Dropdown
document.getElementById('page-select').addEventListener('change', (e) => {
  const pages = document.querySelectorAll('.page');
  pages.forEach((page) => page.classList.add('hidden'));

  const selectedPage = document.getElementById(e.target.value);
  if (selectedPage) selectedPage.classList.remove('hidden');
});

// Karte initialisieren
function initializeMap() {
  const map = L.map('map').setView([51.1657, 10.4515], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap-Mitwirkende'
  }).addTo(map);

  // Beispiel-Marker
  L.marker([52.52, 13.405]).addTo(map).bindPopup('Berlin');
}

// Beim Start prüfen ob User eingeloggt ist
loadUser();
