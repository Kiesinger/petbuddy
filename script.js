// Supabase-Initialisierung
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth Event:', event);
  console.log('Session:', session);
});
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.11.0/+esm';
const SUPABASE_URL = 'https://rkghjywutskfwwtuzpnt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrZ2hqeXd1dHNrZnd3dHV6cG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMjQwMDAsImV4cCI6MjA2MjgwMDAwMH0.QpRLi5TzPsvpFCzOilHqsaXw9Y4dv1NWflmO6Z0EkI0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth-Buttons
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Fehler beim Einloggen: ' + error.message);
  } else {
    toggleSections(true);
  }
});

document.getElementById('registerBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    alert('Fehler bei der Registrierung: ' + error.message);
  } else {
    alert('Registrierung erfolgreich! Bitte einloggen.');
  }
});

// Profil speichern
document.getElementById('saveProfileBtn').addEventListener('click', async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    alert('Benutzer nicht gefunden.');
    return;
  }

  const profile = {
    id: user.id,
    role: document.getElementById('role').value,
    pet: document.getElementById('pet').value,
    age: parseInt(document.getElementById('age').value),
    gender: document.getElementById('gender').value,
    location: document.getElementById('location').value,
  };

  const { error } = await supabase.from('profiles').upsert([profile]);

  if (error) {
    alert('Fehler beim Speichern des Profils: ' + error.message);
  } else {
    alert('Profil gespeichert!');
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  toggleSections(false);
});

// Sichtbarkeit der Bereiche umschalten
async function toggleSections(isLoggedIn) {
  if (isLoggedIn) {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('profileSection').classList.remove('hidden');
  } else {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('profileSection').classList.add('hidden');
  }
}

// Beim Laden prüfen, ob Benutzer eingeloggt ist
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  toggleSections(!!user);
});
