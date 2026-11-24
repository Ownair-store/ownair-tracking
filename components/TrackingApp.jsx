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
          <h1>Track your order</h1>
          <p className="sub">Enter your tracking number to see where your Ownair order is.</p>
          <form className="track-form" onSubmit={onSubmit}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter tracking / AWB number"
              value={awb}
              onChange={(e) => setAwb(e.target.value)}
              aria-label="Tracking number"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Tracking…" : "Track"}
            </button>
          </form>
        </section>

        {error && <div className="message error">{error}</div>}
        {data && <Result data={data} />}
      </main>
      <Footer />
    </div>
  );
}

function Result({ data }) {
  const exception = data.is_exception;
  return (
    <section className="result">
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
        <Row label="Tracking No." value={data.tracking_id} />
        <Row label="Order No." value={data.order_no} />
        <Row label="Destination" value={data.destination} />
        <Row label="Current Location" value={data.current_location} />
        <Row label="Expected Delivery" value={data.expected_delivery} />
      </div>

      {data.courier_link && (
        <a className="courier-link" href={data.courier_link} target="_blank" rel="noreferrer">
          View on Delhivery &rarr;
        </a>
      )}
    </section>
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
            <div className="dot">{completed ? "✓" : num}</div>
            <div className="step-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="row">
      <span className="row-label">{label}</span>
      <span className="row-value">{value}</span>
    </div>
  );
}

function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="/">
          <span className="brand-mark" />
          ownair
        </a>
        <a className="nav-support" href="#support">Support</a>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer" id="support">
      <div className="container footer-inner">
        <p>Need help with your order? Reach out to Ownair support.</p>
        <p className="muted">© {new Date().getFullYear()} Ownair. All rights reserved.</p>
      </div>
    </footer>
  );
}
