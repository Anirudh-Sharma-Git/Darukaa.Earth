import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSiteAnalytics } from "../api/analytics";
import { createMeasurement } from "../api/measurements";

function SiteDetails() {
  const { siteId } = useParams();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showMeasurementForm, setShowMeasurementForm] =
    useState(false);

  const [measurementDate, setMeasurementDate] =
    useState("");
  const [carbonStock, setCarbonStock] = useState("");
  const [carbonSequestered, setCarbonSequestered] =
    useState("");
  const [biodiversityScore, setBiodiversityScore] =
    useState("");
  const [treeCover, setTreeCover] = useState("");

  const [creatingMeasurement, setCreatingMeasurement] =
    useState(false);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      const data = await getSiteAnalytics(siteId);

      setAnalytics(data);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to load site analytics.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, [siteId]);

  async function handleCreateMeasurement(event) {
    event.preventDefault();

    try {
      setCreatingMeasurement(true);
      setError("");

      await createMeasurement(
        analytics.project_id,
        siteId,
        {
          measurement_date: measurementDate,
          carbon_stock:
            carbonStock === ""
              ? null
              : Number(carbonStock),
          carbon_sequestered:
            carbonSequestered === ""
              ? null
              : Number(carbonSequestered),
          biodiversity_score:
            biodiversityScore === ""
              ? null
              : Number(biodiversityScore),
          tree_cover:
            treeCover === ""
              ? null
              : Number(treeCover),
        },
      );

      setMeasurementDate("");
      setCarbonStock("");
      setCarbonSequestered("");
      setBiodiversityScore("");
      setTreeCover("");

      setShowMeasurementForm(false);

      await loadAnalytics();
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to create measurement.",
      );
    } finally {
      setCreatingMeasurement(false);
    }
  }

  if (loading) {
    return (
      <main className="site-details-page">
        <p>Loading site...</p>
      </main>
    );
  }

  if (error && !analytics) {
    return (
      <main className="site-details-page">
        <p className="form-error">{error}</p>
      </main>
    );
  }

  if (!analytics) {
    return null;
  }

  const { summary, time_series } = analytics;

  return (
    <main className="site-details-page">
      <nav className="dashboard-navbar">
        <Link to="/" className="brand">
          Darukaa<span>.Earth</span>
        </Link>

        <Link
          to="/dashboard"
          className="secondary-button"
        >
          Back to Dashboard
        </Link>
      </nav>

      <section className="site-details-content">
        <header className="site-details-header">
          <div>
            <p className="eyebrow">SITE ANALYTICS</p>

            <h1>{analytics.site_name}</h1>

            <p>
              Environmental monitoring and performance
              data for this geographical site.
            </p>
          </div>
        </header>

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        <section className="analytics-grid">
          <div className="stat-card">
            <span>Area</span>

            <strong>
              {analytics.area_hectares.toFixed(2)} ha
            </strong>
          </div>

          <div className="stat-card">
            <span>Carbon Stock</span>

            <strong>
              {summary.latest_carbon_stock ?? "—"}
            </strong>
          </div>

          <div className="stat-card">
            <span>Biodiversity</span>

            <strong>
              {summary.latest_biodiversity_score ?? "—"}
            </strong>
          </div>

          <div className="stat-card">
            <span>Tree Cover</span>

            <strong>
              {summary.latest_tree_cover != null
                ? `${summary.latest_tree_cover}%`
                : "—"}
            </strong>
          </div>
        </section>

        <section className="measurements-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                HISTORICAL DATA
              </p>

              <h2>Measurements</h2>
            </div>

            <button
              className="primary-button"
              onClick={() => {
                setShowMeasurementForm(
                  (value) => !value,
                );
                setError("");
              }}
            >
              {showMeasurementForm
                ? "Cancel"
                : "+ Add Measurement"}
            </button>
          </div>

          {showMeasurementForm && (
            <div className="measurement-form-panel">
              <h3>
                Add Environmental Measurement
              </h3>

              <form onSubmit={handleCreateMeasurement}>
                <label htmlFor="measurement-date">
                  Measurement Date
                </label>

                <input
                  id="measurement-date"
                  type="date"
                  value={measurementDate}
                  onChange={(event) =>
                    setMeasurementDate(
                      event.target.value,
                    )
                  }
                  required
                />

                <label htmlFor="carbon-stock">
                  Carbon Stock
                </label>

                <input
                  id="carbon-stock"
                  type="number"
                  min="0"
                  step="any"
                  value={carbonStock}
                  onChange={(event) =>
                    setCarbonStock(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. 125.5"
                />

                <label htmlFor="carbon-sequestered">
                  Carbon Sequestered
                </label>

                <input
                  id="carbon-sequestered"
                  type="number"
                  min="0"
                  step="any"
                  value={carbonSequestered}
                  onChange={(event) =>
                    setCarbonSequestered(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. 12.4"
                />

                <label htmlFor="biodiversity-score">
                  Biodiversity Score
                </label>

                <input
                  id="biodiversity-score"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={biodiversityScore}
                  onChange={(event) =>
                    setBiodiversityScore(
                      event.target.value,
                    )
                  }
                  placeholder="0 - 100"
                />

                <label htmlFor="tree-cover">
                  Tree Cover (%)
                </label>

                <input
                  id="tree-cover"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={treeCover}
                  onChange={(event) =>
                    setTreeCover(
                      event.target.value,
                    )
                  }
                  placeholder="0 - 100"
                />

                <button
                  type="submit"
                  className="primary-button"
                  disabled={creatingMeasurement}
                >
                  {creatingMeasurement
                    ? "Saving..."
                    : "Save Measurement"}
                </button>
              </form>
            </div>
          )}

          {time_series.length === 0 ? (
            <div className="empty-state">
              <h2>No measurements yet</h2>

              <p>
                Add your first environmental measurement
                using the button above.
              </p>
            </div>
          ) : (
            <div className="measurement-list">
              {time_series.map((measurement) => (
                <div
                  className="measurement-card"
                  key={measurement.measurement_date}
                >
                  <strong>
                    {measurement.measurement_date}
                  </strong>

                  <span>
                    Carbon Stock:{" "}
                    {measurement.carbon_stock ?? "—"}
                  </span>

                  <span>
                    Carbon Sequestered:{" "}
                    {measurement.carbon_sequestered ?? "—"}
                  </span>

                  <span>
                    Biodiversity:{" "}
                    {measurement.biodiversity_score ?? "—"}
                  </span>

                  <span>
                    Tree Cover:{" "}
                    {measurement.tree_cover != null
                      ? `${measurement.tree_cover}%`
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default SiteDetails;