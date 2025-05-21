// Supabase initialisieren – hier deine Daten eintragen!
const supabaseUrl = 'https://DEIN_PROJEKT.supabase.co';
const supabaseKey = 'DEIN_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM-Elemente
const authSection = document.getElementById('auth-section');
const profilePage = document.getElementById('profile-page');
const navDropdown = document.getElementById('page-select');
const messageBox = document.getElementById('message-box');

const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const saveProfileBtn = document.getElementById('save-profile');

// Nachricht anzeigen
function showMessage(msg) {
  messageBox.textContent = msg;
  messageBox.classList.remove('hidden');
  setTimeout(() => messageBox.classList.add('hidden'), 4000);
}

// Login
loginBtn.addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    showMessage("❌ " + error.message);
  } else {
    showMessage("✅ Login erfolgreich");
    loadUser();
  }
});

// Registrierung
signupBtn.addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    showMessage("❌ " + error.message);
  } else {
    showMessage("✅ Registrierung erfolgreich – bitte einloggen.");
  }
});

// Profil speichern
saveProfileBtn.addEventListener('click', async () => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  const profile = {
    user_id: user.id,
    name: document.getElementById('name').value,
    age: document.getElementById('age').value,
    location: document.getElementById('location').value,
    gender: document.getElementById('gender').value,
    role: document.getElementById('role').value
  };

  const { error } = await supabase.from('profiles').upsert(profile);

  if (error) {
    showMessage("❌ " + error.message);
  } else {
    showMessage("✅ Profil gespeichert!");
  }
});

// Benutzeroberfläche nach Login
async function loadUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  authSection.classList.add('hidden');
  profilePage.classList.remove('hidden');
  navDropdown.classList.remove('hidden');

  // Daten laden
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();

  if (data) {
    document.getElementById('name').value = data.name || '';
    document.getElementById('age').value = data.age || '';
    document.getElementById('location').value = data.location || '';
    document.getElementById('gender').value = data.gender || '';
    document.getElementById('role').value = data.role || '';
  }
}

// Prüfen ob eingeloggt
(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) loadUser();
})();
