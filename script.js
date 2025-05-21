<script>
  const supabaseClient = supabase.createClient(
    'https://tqrrmmbplwywmoyqdtui.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcnJtbWJwbHd5d213b3lxZHR1aSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE1MzQyNDYxLCJleHAiOjE3NDY4Nzg0NjF9.kD1iN5yYH1Y7i5KJ8NNoa8HXvM4ZJUQz3JX7T9fuhB4'
  );

  async function checkSession() {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (session) {
      loadUser(session.user.id);
    } else {
      showLogin();
    }
  }

  async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      alert('Fehler beim Login: ' + error.message);
    } else {
      checkSession();
    }
  }

  async function logout() {
    await supabaseClient.auth.signOut();
    showLogin();
  }

  function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('profile-form').style.display = 'none';
    document.getElementById('map').style.display = 'none';
  }

  function showProfile() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('profile-form').style.display = 'block';
    document.getElementById('map').style.display = 'block';
  }

  async function loadUser(userId) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      document.getElementById('full-name').value = data.full_name || '';
      document.getElementById('bio').value = data.bio || '';
      document.getElementById('location').value = data.location || '';
      document.getElementById('website').value = data.website || '';
    }

    showProfile();
    initializeMap(); // Karte laden
  }

  async function saveProfile() {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    const updates = {
      id: user.id,
      full_name: document.getElementById('full-name').value,
      bio: document.getElementById('bio').value,
      location: document.getElementById('location').value,
      website: document.getElementById('website').value,
      updated_at: new Date(),
    };

    const { error } = await supabaseClient.from('profiles').upsert(updates);

    if (error) {
      alert('Fehler beim Speichern: ' + error.message);
    } else {
      alert('Profil gespeichert!');
      initializeMap(); // Karte neu laden nach dem Speichern
    }
  }

  // 🔄 HIER ist die NEUE Map-Funktion
  async function initializeMap() {
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = ''; // Reset bei erneutem Aufruf
    const map = L.map('map').setView([51.1657, 10.4515], 6); // Deutschland-Zentrum

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap-Mitwirkende',
    }).addTo(map);

    const { data: profiles, error } = await supabaseClient
      .from('profiles')
      .select('full_name, location');

    if (error) {
      console.error("Fehler beim Laden der Standorte:", error);
      return;
    }

    profiles.forEach(profile => {
      if (!profile.location) return;

      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(profile.location)}`)
        .then(res => res.json())
        .then(locations => {
          if (locations && locations.length > 0) {
            const { lat, lon } = locations[0];
            L.marker([lat, lon])
              .addTo(map)
              .bindPopup(`${profile.full_name} (${profile.location})`);
          }
        })
        .catch(err => console.error("Geocoding-Fehler:", err));
    });
  }

  // Starte beim Laden der Seite
  checkSession();
</script>
