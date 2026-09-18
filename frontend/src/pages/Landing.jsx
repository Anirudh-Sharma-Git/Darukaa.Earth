import { Link } from "react-router-dom";

function Landing() {
  return (
    <main className="landing-page">
      <nav className="navbar">
        <Link to="/" className="brand">
          Darukaa<span>.Earth</span>
        </Link>

        <div className="nav-actions">
          <Link to="/login" className="nav-link">
            Login
          </Link>

          <Link to="/register" className="nav-button">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">GEOSPATIAL ENVIRONMENTAL INTELLIGENCE</p>

          <h1>
            Understand the Earth.
            <br />
            <span>Measure what matters.</span>
          </h1>

          <p className="hero-description">
            A geospatial platform for monitoring carbon, biodiversity, and
            environmental performance across real-world project sites.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="primary-button">
              Start Monitoring
            </Link>

            <Link to="/login" className="secondary-button">
              Sign In
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="earth-card">
            <div className="earth">EARTH</div>

            <div className="map-label label-one">Carbon</div>

            <div className="map-label label-two">Biodiversity</div>

            <div className="map-label label-three">Sites</div>
          </div>
        </div>
      </section>

      <section className="features">
        <article className="feature-card">
          <h2>Project Monitoring</h2>
          <p>
            Organize environmental projects and manage multiple geographical
            sites.
          </p>
        </article>

        <article className="feature-card">
          <h2>Interactive Mapping</h2>
          <p>
            Explore project boundaries and draw new sites directly on an
            interactive map.
          </p>
        </article>

        <article className="feature-card">
          <h2>Environmental Analytics</h2>
          <p>
            Track carbon, biodiversity, and tree-cover performance over time.
          </p>
        </article>
      </section>
    </main>
  );
}

export default Landing;
