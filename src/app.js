
document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");

  app.innerHTML = `
    <header class="navbar">
      <a class="logo" href="#">AppSyed<span>.</span></a>
      <button class="profile-btn">My Profile</button>
    </header>

    <main class="platform">
      <section class="welcome">
        <span class="eyebrow">WELCOME TO APPSYED</span>
        <h1>Your digital world,<br><span>all in one place.</span></h1>
        <p>Discover applications and explore new possibilities.</p>
      </section>

      <section class="your-apps">
        <div class="section-heading">
          <h2>Your Apps</h2>
          <span>1 app</span>
        </div>

        <article class="app-card">
          <div class="app-icon">✓</div>
          <h3>Productivity App</h3>
          <p>Tasks, calendar, habits, goals and more.</p>
          <a class="open-app-btn" href="src/apps/productivity.html">Open App</a>
        </article>
      </section>

      <section class="creator-section">
        <h2>Creator Studio</h2>
        <p>Have an idea? Create your own application and publish it on AppSyed.</p>
        <button class="create-app-btn">＋ Create an App</button>
        <small>Publishing subscription: 1 KWD/month or 10 KWD/year.</small>
      </section>
    </main>

    <nav class="bottom-nav">
      <a class="active" href="#">⌂<span>Home</span></a>
      <a href="#discover">◇<span>Discover</span></a>
      <a href="#create">＋<span>Create</span></a>
      <a href="#library">▤<span>Library</span></a>
      <a href="#profile">○<span>Profile</span></a>
    </nav>
  `;
});

