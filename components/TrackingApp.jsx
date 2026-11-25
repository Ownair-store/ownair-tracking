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
            <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 17h4V5H2v12h3" />
              <path d="M20 17h2v-3.3a2 2 0 0 0-.6-1.4L18 9h-4v8h2" />
              <circle cx="7.5" cy="17.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
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
        <a className="sbtn" href="tel:+919226267775">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" /></svg>
          Call Us
        </a>
        <a className="sbtn" href="https://wa.me/919226267775" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4z" /><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm0 18.3c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.3 8.3 0 1 1 12 20.3z" /></svg>
          WhatsApp
        </a>
        <a className="sbtn" href="mailto:support@ownairstore.com">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
          Email Support
        </a>
      </div>
    </section>
  );
}
