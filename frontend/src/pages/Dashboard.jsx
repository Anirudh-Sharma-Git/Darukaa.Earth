import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createProject, getProjects } from "../api/projects";
import { getSites } from "../api/sites";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();

  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] =
    useState("");

  const [creating, setCreating] = useState(false);

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const projectData = await getProjects();

      setProjects(projectData);

      const siteResults = await Promise.all(
        projectData.map(async (project) => {
          try {
            const sites = await getSites(project.id);

            const totalArea = sites.reduce(
              (total, site) =>
                total + Number(site.area_hectares || 0),
              0,
            );

            return {
              projectId: project.id,
              siteCount: sites.length,
              totalArea,
            };
          } catch {
            return {
              projectId: project.id,
              siteCount: 0,
              totalArea: 0,
            };
          }
        }),
      );

      const stats = {};

      siteResults.forEach((result) => {
        stats[result.projectId] = {
          siteCount: result.siteCount,
          totalArea: result.totalArea,
        };
      });

      setProjectStats(stats);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to load projects.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleCreateProject(event) {
    event.preventDefault();

    if (!projectName.trim()) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      await createProject({
        name: projectName.trim(),
        description:
          projectDescription.trim() || null,
      });

      setProjectName("");
      setProjectDescription("");
      setShowCreateModal(false);

      await loadProjects();
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to create project.",
      );
    } finally {
      setCreating(false);
    }
  }

  const activeProjects = projects.filter(
    (project) => project.status === "active",
  ).length;

  const totalSites = Object.values(projectStats).reduce(
    (total, stats) => total + stats.siteCount,
    0,
  );

  const totalArea = Object.values(projectStats).reduce(
    (total, stats) => total + stats.totalArea,
    0,
  );

  return (
    <main className="dashboard-page">
      <nav className="dashboard-navbar">
        <Link to="/" className="brand">
          Darukaa<span>.Earth</span>
        </Link>

        <div className="dashboard-nav-right">
          <span>{user?.email}</span>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </nav>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">
              ENVIRONMENTAL INTELLIGENCE
            </p>

            <h1>Project Dashboard</h1>

            <p>
              Manage your environmental projects and
              geographical sites.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              setShowCreateModal(true);
              setError("");
            }}
          >
            + Create Project
          </button>
        </header>

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        <section className="dashboard-stats">
          <div className="stat-card">
            <span>Total Projects</span>

            <strong>{projects.length}</strong>
          </div>

          <div className="stat-card">
            <span>Active Projects</span>

            <strong>{activeProjects}</strong>
          </div>

          <div className="stat-card">
            <span>Environmental Sites</span>

            <strong>{totalSites}</strong>
          </div>

          <div className="stat-card">
            <span>Monitored Area</span>

            <strong>
              {totalArea.toFixed(2)} ha
            </strong>
          </div>
        </section>

        <section className="projects-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                YOUR WORKSPACE
              </p>

              <h2>Projects</h2>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <h2>No projects yet</h2>

              <p>
                Create your first environmental project
                to start monitoring sites and analytics.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setShowCreateModal(true)
                }
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="project-grid">
              {projects.map((project) => {
                const stats =
                  projectStats[project.id] || {
                    siteCount: 0,
                    totalArea: 0,
                  };

                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="project-card"
                  >
                    <div className="project-card-top">
                      <span className="project-status">
                        {project.status}
                      </span>
                    </div>

                    <h2>{project.name}</h2>

                    <p>
                      {project.description ||
                        "No description provided."}
                    </p>

                    <div className="project-card-meta">
                      <span>
                        {stats.siteCount}{" "}
                        {stats.siteCount === 1
                          ? "site"
                          : "sites"}
                      </span>

                      <span>
                        {stats.totalArea.toFixed(2)} ha
                      </span>
                    </div>

                    <span className="project-card-link">
                      View project →
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </section>

      {showCreateModal && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setShowCreateModal(false)
          }
        >
          <div
            className="create-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">
                  NEW PROJECT
                </p>

                <h2>Create Project</h2>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowCreateModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <label htmlFor="project-name">
                Project Name
              </label>

              <input
                id="project-name"
                type="text"
                value={projectName}
                onChange={(event) =>
                  setProjectName(event.target.value)
                }
                placeholder="e.g. Western Ghats Restoration"
                required
              />

              <label htmlFor="project-description">
                Description
              </label>

              <textarea
                id="project-description"
                value={projectDescription}
                onChange={(event) =>
                  setProjectDescription(
                    event.target.value,
                  )
                }
                placeholder="Describe your environmental project..."
                rows={4}
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={creating}
                >
                  {creating
                    ? "Creating..."
                    : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Dashboard;