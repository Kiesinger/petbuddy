// Supabase-Initialisierung
const SUPABASE_URL = 'https://rkghjywutskfwwtuzpnt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrZ2hqeXd1dHNrZnd3dHV6cG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMjQwMDAsImV4cCI6MjA2MjgwMDAwMH0.QpRLi5TzPsvpFCzOilHqsaXw9Y4dv1NWflmO6Z0EkI0';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Login und Registrierung
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert('Fehler beim Einloggen: ' + error.message);
  } else {
    console.log('Erfolgreich eingeloggt:', data);
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('profileSection').classList.remove('hidden');
  }
});

document.getElementById('registerBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert('Fehler bei der Registrierung: ' + error.message);
  } else {
    alert('Registrierung erfolgreich! Bitte einloggen.');
  }
});

// Profil speichern
document.getElementById('saveProfileBtn').addEventListener('click', async () => {
  const user = supabase.auth.user();
  const role = document.getElementById('role').value;
  const pet = document.getElementById('pet').value;
  const age = document.getElementById('age').value;
  const gender = document.getElementById('gender').value;
  const location = document.getElementById('location').value;

  const { data, error } = await supabase
    .from('profiles')
    .upsert([{ id: user.id, role, pet, age, gender, location }]);

  if (error) {
    alert('Fehler beim Speichern des Profils: ' + error.message);
  } else {
    alert('Profil gespeichert!');
  }
});

// Abmelden
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.reload();
});

// Überprüfen, ob der Benutzer eingeloggt ist
const user = supabase.auth.user();
if (user) {
  document.getElementById('authSection').classList.add('hidden');
  document.getElementById('profileSection').classList.remove('hidden');
} else {
  document.getElementById('authSection').classList.remove('hidden');
  document.getElementById('profileSection').classList.add('hidden');
}
