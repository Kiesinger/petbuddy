const SUPABASE_URL = 'https://rkghjywutskfwwtuzpnt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrZ2hqeXd1dHNrZnd3dHV6cG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMjQwMDAsImV4cCI6MjA2MjgwMDAwMH0.QpRLi5TzPsvpFCzOilHqsaXw9Y4dv1NWflmO6Z0EkI0';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    document.querySelector('.login-form').classList.add('hidden');
    document.getElementById('userInfo').classList.remove('hidden');
    document.getElementById('userEmail').textContent = data.user.email;
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.reload();
});
