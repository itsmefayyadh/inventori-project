// src/pages/LoginPage.jsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ReCAPTCHA from "react-google-recaptcha";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [captchaToken, setCaptchaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validasi captcha
    if (!captchaToken) {
      setError("Silakan selesaikan verifikasi reCAPTCHA.");
      return;
    }

    setLoading(true);
    try {
      await login(form.email, form.password, captchaToken);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Email atau password salah.");
      // Reset captcha jika login gagal
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setCaptchaToken("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        {/* Logo + nama aplikasi */}
        <div className="login-brand">
          <div className="brand-icon">INV</div>
          <div className="brand-text">
            <div className="brand-title">INVENTORI KANTOR</div>
            <div className="brand-subtitle">Sistem Manajemen Stok Barang</div>
          </div>
        </div>

        {/* Card login */}
        <div className="login-card">
          <h1 className="login-title">Masuk ke akun anda</h1>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email / Username</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="admin@example.com"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>

            {/* Google reCAPTCHA */}
            <div className="form-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="btn-primary"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <button
            type="button"
            className="link-small"
            onClick={() => alert("Fitur lupa password belum tersedia")}
          >
            Lupa password?
          </button>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <button type="button" className="link-footer">
            Ketentuan Penggunaan
          </button>
          <span>|</span>
          <button type="button" className="link-footer">
            Kebijakan Privasi
          </button>
        </div>
      </div>
    </div>
  );
}
