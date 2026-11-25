"use client";

import { useEffect, useState, useCallback } from "react";

const WORKER_URL = "https://ownair-tracking-proxy.dawn-silence-2578.workers.dev";

const STAGES = ["Order Confirmed", "In Transit", "Out for Delivery", "Delivered"];

export default function TrackingApp({ initialAwb = "" }) {
  const [awb, setAwb] = useState(initialAwb);
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");

  /* Dynamic WhatsApp support message */
  const getWhatsAppLink = () => {
    const phone = "919226267775";
    const shipment = status === "ok" ? data : null;

    const details = [
      shipment?.tracking_id ? `Tracking Number: ${shipment.tracking_id}` : "",
      shipment?.order_no ? `Order No: ${shipment.order_no}` : "",
      shipment?.stage_label ? `Status: ${shipment.stage_label}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const text = [
      "Hello Ownair Support,",
      "I need help with my shipment.",
      details,
      "Kindly assist me and provide an update.",
      "Thank you.",
    ]
      .filter(Boolean)
      .join("\n\n");

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const track = useCallback(async (value) => {
    const n = (value || "").trim();
    if (!n) return;

    setStatus("loading");
    setData(null);
    setMessage("");

    const animationDelay = new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const res = await fetch(`${WORKER_URL}/?awb=${encodeURIComponent(n)}`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);

      const d = await res.json();
      await animationDelay;

      if (!d.found) {
        setMessage(d.message || "No shipment found for this tracking number.");
        setStatus("notfound");
        return;
      }

      setData(d);
      setStatus("ok");
    } catch (error) {
      await animationDelay;
      setMessage("Unable to fetch shipment details. Please try again.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (initialAwb) track(initialAwb);
  }, [initialAwb, track]);

  const onSubmit = (e) => {
    e.preventDefault();
    const n = awb.trim();
    if (!n) return;
    window.history.pushState(null, "", "/track/" + encodeURIComponent(n));
    track(n);
  };

  return (
    <>
      {/* Navigation */}
      <header className="navbar">
        <a href="https://ownairstore.com" className="brand">
          <img src="/ownair-logo.png" alt="Ownair" />
        </a>
        <nav className="nav-links">
          <a href="https://ownairstore.com">Home</a>
          <a href="https://ownairstore.com/collections/frontpage">Shop</a>
        </nav>
      </header>

      <main className="main">
        <div className="container">

          {/* Hero */}
          <section className="hero">
            <HeroTruck />
            <div className="hero-eyebrow">SEAMLESS SHIPMENT TRACKING</div>
            <h1>Track Your <span>Order</span></h1>
            <p>
              Your order is on its way! Enter your tracking number below to check the latest shipment updates.
            </p>
          </section>

          {/* Tracking form */}
          <section className="tracking-card">
            <div className="tracking-card-header">
              <div className="package-icon"><SupportIcon type="package" /></div>
              <div>
                <h2 className="card-heading">Where is your order?</h2>
                <p className="card-description">Enter your shipment tracking number below.</p>
              </div>
            </div>

            <form className="tracking-form" onSubmit={onSubmit}>
              <input
                id="awb"
                name="awb"
                className="tracking-input"
                type="text"
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                placeholder="Enter your AWB / tracking number"
                aria-label="Tracking number"
                autoComplete="off"
                maxLength={100}
              />
              <button className="track-btn" type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Checking..." : "Track Order →"}
              </button>
            </form>

            {/* Result */}
            <div className="result" aria-live="polite">
              {status === "loading" && <TruckLoader />}
              {status === "notfound" && <p className="message">{message}</p>}
              {status === "error" && (
                <p className="message">{message || "Something went wrong. Please try again."}</p>
              )}
              {status === "ok" && data && <Result d={data} />}
            </div>
          </section>

          {/* Support */}
          <section className="support-section">
            <h2>We&rsquo;re here to help.</h2>
            <p>Our support team is here to help you. Reach out to us for any questions regarding your shipment.</p>
            <div className="support-actions">
              <a href="tel:+919226267775" className="support-btn">
                <SupportIcon type="phone" />
                Call Us
              </a>
              <a href={getWhatsAppLink()} className="support-btn" target="_blank" rel="noopener noreferrer">
                <SupportIcon type="whatsapp" />
                WhatsApp
              </a>
              <a href="mailto:support@ownairstore.com" className="support-btn">
                <SupportIcon type="email" />
                Email Support
              </a>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}

/* ====================== RESULT ====================== */

function Result({ d }) {
  if (d.is_exception) {
    return (
      <div className="exception">
        {d.stage_label || "Your shipment is currently on hold. Please contact support."}
      </div>
    );
  }

  const stage = Math.max(1, Math.min(4, Number(d.stage) || 1));
  const isDelivered = stage === 4;
  const progress = ((stage - 1) / 3) * 100;

  const customerName = String(d.customer_name || "").trim().replace(/[,!]+$/, "").trim();

  const rows = [
    ["Order No.", d.order_no],
    ["Destination", d.destination],
    ["Current Location", d.current_location],
    ["Expected Delivery", d.expected_delivery],
    ["Tracking No.", d.tracking_id],
  ].filter(([, v]) => v);

  let courier = null;
  if (d.courier_link) {
    try {
      const u = new URL(d.courier_link);
      if (["https:", "http:"].includes(u.protocol)) {
        courier = (
          <a className="courier-link" href={u.href} target="_blank" rel="noopener noreferrer">
            View on Courier Website ↗
          </a>
        );
      }
    } catch (e) {
      courier = null;
    }
  }

  return (
    <>
      <div className="result-header">
        <p className="greeting">
          {customerName ? `Hello, ${customerName}!` : "Your Shipment Details"}
        </p>
      </div>

      {isDelivered && (
        <div className="delivered-banner">
          <div className="delivered-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12l4 4L19 6" />
            </svg>
          </div>
          <div className="delivered-content">
            <h3>Successfully Delivered</h3>
            <p>Your shipment has been delivered successfully.</p>
          </div>
          <span className="delivered-badge">Delivered</span>
        </div>
      )}

      <div className="timeline-section">
        <div className="timeline-title">Shipment Progress</div>
        <div className="timeline">
          <div className="timeline-progress" style={{ width: `${progress * 0.75}%` }} />
          {STAGES.map((label, i) => {
            const n = i + 1;
            const isCompleted = n < stage;
            const isCurrent = n === stage;
            const cls = isCompleted ? "done" : isCurrent ? "active" : "pending";
            return (
              <div className={`step ${cls}`} key={label} aria-current={isCurrent ? "step" : undefined}>
                <div className="dot">
                  {isCurrent && (stage === 4 ? <CheckMark /> : <PackageIcon />)}
                </div>
                <div className="step-label">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="details">
        <div className="details-title">Shipment Information</div>
        {rows.map(([k, v]) => (
          <div className="detail-row" key={k}>
            <b>{k}</b>
            <span>{v}</span>
          </div>
        ))}
      </div>

      {courier}
    </>
  );
}

/* ====================== TRUCK LOADER ====================== */

function TruckLoader() {
  return (
    <div className="truck-loader" role="status">
      <div className="truck-animation" aria-hidden="true">
        <div className="truck-speed-lines"><span /><span /><span /></div>
        <div className="truck-road" />
        <svg className="loading-truck" viewBox="0 0 140 90" fill="none">
          <rect x="5" y="7" width="84" height="57" rx="7" fill="#ffffff" stroke="#e4ddf7" strokeWidth="2" />
          <rect x="5" y="7" width="84" height="9" rx="4" fill="#7c5cd6" />
          <path d="M89 24H110Q115 24 118 29L133 48V64H89Z" fill="#7c5cd6" />
          <path d="M98 31H110L122 47H98Z" fill="#e9e3fb" />
          <rect x="4" y="60" width="131" height="8" rx="3" fill="#2a1a52" />
          <image href="/ownair-logo.png" x="14" y="30" width="66" height="22" preserveAspectRatio="xMidYMid meet" />
          <g className="truck-wheel">
            <circle cx="30" cy="68" r="13" fill="#1e1b2e" />
            <circle cx="30" cy="68" r="6" fill="#cfc7e6" />
            <path d="M30 63V73M25 68H35" stroke="#7c5cd6" strokeWidth="2" />
          </g>
          <g className="truck-wheel">
            <circle cx="110" cy="68" r="13" fill="#1e1b2e" />
            <circle cx="110" cy="68" r="6" fill="#cfc7e6" />
            <path d="M110 63V73M105 68H115" stroke="#7c5cd6" strokeWidth="2" />
          </g>
          <rect x="127" y="51" width="8" height="5" rx="2" fill="#fbbf24" />
        </svg>
      </div>
      <h3 className="truck-loader-title">Locating your shipment...</h3>
      <p className="truck-loader-description">Fetching the latest tracking updates.</p>
      <div className="truck-loading-dots" aria-hidden="true"><span /><span /><span /></div>
    </div>
  );
}

/* ====================== HERO TRUCK ====================== */

function HeroTruck() {
  return (
    <div className="hero-truck" aria-hidden="true">
      <svg viewBox="0 0 260 120" fill="none">
        <ellipse cx="130" cy="104" rx="91" ry="6" fill="#e2dbf4" />
        <g className="hero-truck-speed" stroke="#b7a4e6" strokeWidth="3" strokeLinecap="round">
          <path d="M12 38H40M3 52H32M18 66H40" />
        </g>
        <g className="hero-truck-body">
          <rect x="42" y="15" width="119" height="66" rx="9" fill="white" stroke="#ded4f5" strokeWidth="2" />
          <rect x="42" y="15" width="119" height="8" rx="4" fill="#7c5cd6" />
          <path d="M161 39H190L213 62V83H161Z" fill="#7c5cd6" />
          <path d="M169 45H187L202 62H169Z" fill="#e9e3fb" />
          <rect x="38" y="77" width="178" height="10" rx="4" fill="#2a1a52" />
          <rect x="208" y="69" width="7" height="7" rx="2" fill="#fbbf24" />
          <image href="/ownair-logo.png" x="56" y="34" width="92" height="30" preserveAspectRatio="xMidYMid meet" />
          {[72, 186].map((x) => (
            <g key={x} className="hero-truck-wheel">
              <circle cx={x} cy="86" r="14" fill="#1e1b2e" />
              <circle cx={x} cy="86" r="7" fill="#cfc7e6" />
              <path d={`M${x} 80V92M${x - 6} 86H${x + 6}`} stroke="#7c5cd6" strokeWidth="2" />
            </g>
          ))}
        </g>
      </svg>
      <div className="hero-truck-road" />
    </div>
  );
}

/* ====================== ICONS ====================== */

function SupportIcon({ type }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {type === "package" && <path d="M3 7L12 2L21 7V17L12 22L3 17Z M3 7L12 12L21 7M12 12V22M7.5 4.5L16.5 9.5" />}
      {type === "phone" && <path d="M5 3H9L11 8L8 11Q10 15 14 17L17 14L22 16V20Q22 23 18 22Q3 18 2 6Q2 3 5 3Z" />}
      {type === "whatsapp" && (
        <>
          <path d="M3 21L4.5 16.5A9 9 0 1 1 8 20Z" />
          <path d="M8 7Q5 12 14 16Q17 17 17 13L14 12L12 14Q9 12 10 10Z" fill="currentColor" stroke="none" />
        </>
      )}
      {type === "email" && (
        <>
          <rect x="2" y="4" width="20" height="16" rx="3" />
          <path d="M2 6L12 13L22 6" />
        </>
      )}
    </svg>
  );
}
function PackageIcon() {
  return (
    <svg className="stage-pkg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
function CheckMark() {
  return (
    <svg className="stage-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l4 4L19 6" />
    </svg>
  );
}
