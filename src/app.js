
document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");

  app.innerHTML = `
    <header class="navbar">
      <a class="logo" href="#">AppSyed<span>.</span></a>

      <nav>
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#features">Features</a>
      </nav>

      <div class="nav-actions">
        <button class="login-btn">Sign In</button>
        <button class="signup-btn">Create Account</button>
      </div>
    </header>

    <main id="home">
      <section class="hero">
        <div class="hero-content">
          <span class="eyebrow">WELCOME TO APPSYED</span>
          <h1>One Platform.<br><span>Many Possibilities.</span></h1>
          <p>
            Discover useful apps, organise your life,
            and explore new possibilities — all in one place.
          </p>

          <div class="hero-actions">
            <button class="signup-btn">Get Started</button>
            <a class="learn-btn" href="#about">Explore AppSyed →</a>
          </div>
        </div>

        <div class="hero-card">
          <div class="card-icon">✦</div>
          <h2>Everything together.</h2>
          <p>Your digital world, organised in one platform.</p>
          <div class="card-line"></div>
          <div class="mini-item">✓ Productivity</div>
          <div class="mini-item">✓ Creativity</div>
          <div class="mini-item">✓ Everyday tools</div>
        </div>
      </section>

      <section class="intro" id="about">
        <span class="eyebrow">ONE PLATFORM</span>
        <h2>A place for all your possibilities.</h2>
        <p>
          AppSyed brings applications, tools and ideas together.
          Find what you need and make your everyday digital
          experience simpler.
        </p>
      </section>

      <section class="features" id="features">
        <h2>Explore what AppSyed offers</h2>
        <div class="feature-grid">
          <article class="feature-card">
            <span>▦</span>
            <h3>Discover Apps</h3>
            <p>Explore useful applications in one place.</p>
          </article>
          <article class="feature-card">
            <span>✧</span>
            <h3>Productivity</h3>
            <p>Tools to plan, organise and manage your day.</p>
          </article>
          <article class="feature-card">
            <span>＋</span>
            <h3>Creator Studio</h3>
            <p>A space for creators to build and publish apps.</p>
          </article>
        </div>
      </section>
    </main>

    <footer>
      <strong>AppSyed.</strong>
      <p>One Platform. Many Possibilities.</p>
      <small>© 2026 AppSyed. All rights reserved.</small>
    </footer>
  `;
});
