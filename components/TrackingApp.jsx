"use client";

import { useEffect, useState } from "react";

// Your live Cloudflare Worker (Delhivery proxy)
const WORKER_URL = "https://ownair-tracking-proxy.dawn-silence-2578.workers.dev";

const STAGES = ["Order Confirmed", "In Transit", "Out for Delivery", "Delivered"];

export default function TrackingApp({ initialAwb = "" }) {
  const [awb, setAwb] = useState(initialAwb);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function track(value) {
    const clean = (value || "").trim();
    if (!clean) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(`${WORKER_URL}/?awb=${encodeURIComponent(clean)}`);
      const json = await res.json();
      if (!json.found) {
        setError(json.message || "No shipment found for this tracking number.");
      } else {
        setData(json);
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    const clean = awb.trim();
    if (!clean) return;
    window.history.pushState({}, "", `/track/${clean}`);
    track(clean);
  }

  useEffect(() => {
    if (initialAwb) track(initialAwb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <section className="hero">
          <div className="hero-icon">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <h1>Track Your Order</h1>
          <p className="sub">
            Your order is on its way! Enter your tracking number below to check the latest shipment updates.
          </p>
        </section>

        <section className="form-wrap">
          <div className="form-card">
            <h2 className="form-title">Where is your order?</h2>
            <form className="track-form" onSubmit={onSubmit}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter your tracking number"
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                aria-label="Tracking number"
              />
              <button type="submit" disabled={loading}>
                {loading ? <span className="spinner" aria-label="Loading" /> : <>Track Order &rarr;</>}
              </button>
            </form>

            {error && <div className="message error">{error}</div>}
            {data && <Result data={data} />}
          </div>
        </section>

        <SupportCard />
      </main>
    </div>
  );
}

function Result({ data }) {
  const exception = data.is_exception;
  const rows = [
    ["Tracking No.", data.tracking_id],
    ["Order No.", data.order_no],
    ["Destination", data.destination],
    ["Current Location", data.current_location],
    ["Expected Delivery", data.expected_delivery],
  ].filter(([, v]) => v);

  return (
    <div className="result">
      <div className="result-head">
        <span className="hi">Hi {data.customer_name || "there"},</span>
        <span className={`badge ${exception ? "badge-ex" : ""}`}>{data.stage_label}</span>
      </div>

      {exception ? (
        <div className="message error">
          This shipment is marked <strong>{data.stage_label}</strong>. Please contact support for help.
        </div>
      ) : (
        <Timeline stage={data.stage} />
      )}

      <div className="details">
        {rows.map(([label, value], i) => (
          <div className="row" key={label} style={{ animationDelay: `${0.15 + i * 0.07}s` }}>
            <span className="row-label">{label}</span>
            <span className="row-value">{value}</span>
          </div>
        ))}
      </div>

      {data.courier_link && (
        <a className="courier-link" href={data.courier_link} target="_blank" rel="noreferrer">
          View on Delhivery &rarr;
        </a>
      )}
    </div>
  );
}

function Timeline({ stage }) {
  return (
    <div className="timeline">
      {STAGES.map((label, i) => {
        const num = i + 1;
        const completed = num < stage;
        const active = num === stage;
        const done = num <= stage;
        return (
          <div key={i} className={`step ${done ? "done" : ""} ${active ? "active" : ""}`}>
            <div className="dot" style={{ animationDelay: `${i * 0.1}s` }}>
              {completed ? "✓" : num}
            </div>
            <div className="step-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="/">
          <img className="brand-logo" src="/ownair-logo.png" alt="Ownair" />
        </a>
        <a className="nav-support" href="#support">Support</a>
      </div>
    </header>
  );
}

function SupportCard() {
  return (
    <section className="support-card" id="support">
      <h3>Need Help With Your Order?</h3>
      <p>Our support team is here to help you. Reach out to us for any questions regarding your shipment.</p>
      <div className="support-btns">
        <a className="sbtn" href="tel:+919226267775">Call Us</a>
        <a className="sbtn" href="https://wa.me/919226267775" target="_blank" rel="noreferrer">WhatsApp</a>
        <a className="sbtn" href="mailto:support@ownairstore.com">Email Support</a>
      </div>
    </section>
  );
}
