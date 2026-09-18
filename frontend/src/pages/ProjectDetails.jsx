import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProject } from "../api/projects";
import { createSite, getSites } from "../api/sites";
import ProjectSitesMap from "../components/ProjectSitesMap";
import SiteMap from "../components/SiteMap";

function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [sites, setSites] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddSite, setShowAddSite] = useState(false);

  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [geometry, setGeometry] = useState(null);
  const [creatingSite, setCreatingSite] = useState(false);

  const fetchProjectData = useCallback(async () => {
    const [projectData, sitesData] = await Promise.all([
      getProject(projectId),
      getSites(projectId),
    ]);

    return {
      project: projectData,
      sites: sitesData,
    };
  }, [projectId]);

  const loadProjectData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fetchProjectData();

      setProject(data.project);
      setSites(data.sites);
    } catch (error) {
      setError(error.response?.data?.detail || "Unable to load project.");
    } finally {
      setLoading(false);
    }
  }, [fetchProjectData]);

  useEffect(() => {
    let cancelled = false;

    async function initializeProject() {
      try {
        const data = await fetchProjectData();

        if (cancelled) return;

        setProject(data.project);
        setSites(data.sites);
      } catch (error) {
        if (cancelled) return;

        setError(error.response?.data?.detail || "Unable to load project.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initializeProject();

    return () => {
      cancelled = true;
    };
  }, [fetchProjectData]);

  async function handleCreateSite(event) {
    event.preventDefault();

    if (!geometry) {
      setError("Please draw a polygon on the map.");
      return;
    }

    try {
      setCreatingSite(true);
      setError("");

      await createSite(projectId, {
        name: siteName.trim(),
        description: siteDescription.trim() || null,
        geometry,
      });

      setSiteName("");
      setSiteDescription("");
      setGeometry(null);
      setShowAddSite(false);

      await loadProjectData();
    } catch (error) {
      setError(error.response?.data?.detail || "Unable to create site.");
    } finally {
      setCreatingSite(false);
    }
  }

  const totalArea = sites.reduce(
    (total, site) => total + site.area_hectares,
    0,
  );

  if (loading) {
    return (
      <main className="project-details-page">
        <p>Loading project...</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="project-details-page">
        <p>Project not found.</p>
      </main>
    );
  }

  return (
    <main className="project-details-page">
      <nav className="dashboard-navbar">
        <Link to="/" className="brand">
          Darukaa<span>.Earth</span>
        </Link>

        <Link to="/dashboard" className="secondary-button">
          Back to Dashboard
        </Link>
      </nav>

      <section className="project-details-content">
        <header className="project-details-header">
          <div>
            <p className="eyebrow">PROJECT</p>

            <h1>{project.name}</h1>

            <p>{project.description || "No description provided."}</p>
          </div>

          <span className="project-status">{project.status}</span>
        </header>

        {error && <div className="dashboard-error">{error}</div>}

        <section className="dashboard-stats">
          <div className="stat-card">
            <span>Sites</span>
            <strong>{sites.length}</strong>
          </div>

          <div className="stat-card">
            <span>Total Area</span>
            <strong>{totalArea.toFixed(2)} ha</strong>
          </div>

          <div className="stat-card">
            <span>Project Status</span>
            <strong>{project.status}</strong>
          </div>
        </section>

        <section className="project-map-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SITE MAP</p>

              <h2>Project Geography</h2>
            </div>
          </div>

          {sites.length === 0 ? (
            <div className="empty-state">
              <p>Add a site to see it on the project map.</p>
            </div>
          ) : (
            <ProjectSitesMap
              sites={sites}
              onSiteClick={(siteId) => {
                navigate(`/sites/${siteId}`);
              }}
            />
          )}
        </section>

        <section className="sites-section">
          <div>
            <p className="eyebrow">GEOGRAPHICAL DATA</p>

            <h2>Project Sites</h2>

            <p>Define and monitor geographical areas within this project.</p>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              setShowAddSite((value) => !value);
              setError("");
            }}
          >
            {showAddSite ? "Cancel" : "+ Add Site"}
          </button>
        </section>

        {showAddSite && (
          <section className="add-site-panel">
            <p className="eyebrow">NEW SITE</p>

            <h2>Add Geographical Site</h2>

            <form onSubmit={handleCreateSite}>
              <label htmlFor="site-name">Site Name</label>

              <input
                id="site-name"
                type="text"
                value={siteName}
                onChange={(event) => setSiteName(event.target.value)}
                placeholder="e.g. Northern Forest Zone"
                required
              />

              <label htmlFor="site-description">Description</label>

              <textarea
                id="site-description"
                value={siteDescription}
                onChange={(event) => setSiteDescription(event.target.value)}
                placeholder="Describe this site..."
                rows={3}
              />

              <p className="map-instruction">
                Draw the geographical boundary using the polygon tool.
              </p>

              <SiteMap
                onPolygonCreated={(newGeometry) => {
                  setGeometry(newGeometry);
                  setError("");
                }}
              />

              {geometry && (
                <p className="geometry-success">
                  Polygon selected. Ready to create site.
                </p>
              )}

              <button
                type="submit"
                className="primary-button"
                disabled={creatingSite}
              >
                {creatingSite ? "Creating Site..." : "Create Site"}
              </button>
            </form>
          </section>
        )}

        <section className="sites-list">
          {sites.length === 0 ? (
            <div className="empty-state">
              <h2>No sites yet</h2>

              <p>Add your first geographical site to this project.</p>
            </div>
          ) : (
            <div className="project-grid">
              {sites.map((site) => (
                <Link
                  key={site.id}
                  to={`/sites/${site.id}`}
                  className="project-card"
                >
                  <div className="project-card-top">
                    <span>{site.area_hectares.toFixed(2)} ha</span>
                  </div>

                  <h2>{site.name}</h2>

                  <p>{site.description || "No description provided."}</p>

                  <span className="project-card-link">View site →</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default ProjectDetails;