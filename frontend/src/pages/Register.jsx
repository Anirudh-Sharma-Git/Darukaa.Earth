import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function Register() {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);


  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await register(email, password);
      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to create account.",
      );
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link to="/" className="brand">
          Darukaa<span>.Earth</span>
        </Link>

        <h1>Create your account</h1>

        <p className="auth-description">
          Start managing carbon and biodiversity projects.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            required
          />

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

export default Register;