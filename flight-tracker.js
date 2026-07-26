// Blackcess flight tracking helpers.
// This renders schedule-based live status immediately, then can enrich from
// the existing flight-status Edge Function when it is available.
(function () {
  const REFRESH_MS = 60000;

  function esc(value) {
    if (window.BlackcessDB && typeof window.BlackcessDB.escapeHtml === "function") {
      return window.BlackcessDB.escapeHtml(value);
    }
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    let normalized = String(value).trim();
    if (!normalized.includes("T")) normalized = normalized.replace(" ", "T");
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDateTime(value) {
    const date = parseDate(value);
    if (!date) return "-";
    return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  function formatTime(value) {
    const date = parseDate(value);
    if (!date) return "-";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function getFlight(booking) {
    return booking.flights || booking.flight || {};
  }

  function getDepartureTime(booking) {
    const flight = getFlight(booking);
    return flight.departure_time || flight.departing_at || booking.departure_time || booking.departing_at;
  }

  function getArrivalTime(booking) {
    const flight = getFlight(booking);
    return flight.arrival_time || flight.arriving_at || booking.arrival_time || booking.arriving_at || booking.arrival;
  }

  function getRoute(booking) {
    const flight = getFlight(booking);
    return {
      flightNumber: flight.flight_number || booking.flight_number || booking.number || "Flight",
      fromCode: flight.origin || flight.departure_code || booking.origin || booking.departure_code || "",
      toCode: flight.destination || flight.arrival_code || booking.destination || booking.arrival_code || "",
      fromCity: flight.departure_city || flight.origin_city || booking.departure_city || booking.origin_city || "Departure",
      toCity: flight.arrival_city || flight.destination_city || booking.arrival_city || booking.destination_city || "Arrival"
    };
  }

  function getProgress(booking, now) {
    const departure = parseDate(getDepartureTime(booking));
    const arrival = parseDate(getArrivalTime(booking));
    if (!departure || !arrival) return 0;
    const total = arrival.getTime() - departure.getTime();
    if (total <= 0) return 0;
    const elapsed = now.getTime() - departure.getTime();
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  }

  function getStatus(booking, liveData) {
    const raw = String(liveData?.status || booking.status || "Confirmed").trim();
    const now = new Date();
    const departure = parseDate(getDepartureTime(booking));
    const arrival = parseDate(getArrivalTime(booking));

    if (/cancel/i.test(raw)) return { label: "Cancelled", className: "tracker-status-alert" };
    if (/delay/i.test(raw)) return { label: raw, className: "tracker-status-warning" };
    if (/arrived|landed/i.test(raw) || (arrival && now >= arrival)) {
      return { label: "Arrived Successfully", className: "tracker-status-arrived" };
    }
    if (departure && arrival && now >= departure && now < arrival) {
      return { label: "In Flight", className: "tracker-status-live" };
    }
    if (departure) {
      const checkinOpen = departure.getTime() - now.getTime() <= 24 * 60 * 60 * 1000;
      if (checkinOpen && now < departure) return { label: "Check-In Open", className: "tracker-status-warning" };
    }
    if (/checked[- ]?in/i.test(raw)) return { label: "Checked-In", className: "tracker-status-warning" };
    return { label: raw || "Confirmed", className: "tracker-status-scheduled" };
  }

  function normalizeStops(value) {
    if (!value) return [];
    let stops = value;
    if (typeof stops === "string") {
      try {
        stops = JSON.parse(stops);
      } catch (_) {
        stops = stops.split(",").map((name) => ({ airport: name.trim() })).filter((s) => s.airport);
      }
    }
    if (!Array.isArray(stops)) return [];
    return stops.map((stop) => ({
      airport: stop.airport || stop.name || stop.city || stop.code || "Technical stop",
      arrival_time: stop.arrival_time || stop.arrives_at || stop.time || "",
      departure_time: stop.departure_time || stop.departs_at || "",
      reason: stop.reason || "Refuel / operations"
    }));
  }

  function getRefuelStops(booking) {
    const flight = getFlight(booking);
    return normalizeStops(
      booking.refuel_stops ||
      booking.flight_stops ||
      booking.stops ||
      flight.refuel_stops ||
      flight.flight_stops ||
      flight.stops
    );
  }

  function renderStops(booking) {
    const stops = getRefuelStops(booking);
    if (!stops.length) {
      return `
        <div class="tracker-stop-empty">
          <i class="fas fa-gas-pump"></i>
          <span>No refuel stop is published for this booking yet.</span>
        </div>
      `;
    }

    return stops.map((stop) => `
      <div class="tracker-stop">
        <div class="tracker-stop-icon"><i class="fas fa-gas-pump"></i></div>
        <div>
          <strong>${esc(stop.airport)}</strong>
          <span>${esc(stop.reason)}</span>
          <small>${esc(formatDateTime(stop.arrival_time))}${stop.departure_time ? " - " + esc(formatTime(stop.departure_time)) : ""}</small>
        </div>
      </div>
    `).join("");
  }

  function render(booking, liveData) {
    const route = getRoute(booking);
    const status = getStatus(booking, liveData);
    const progress = getProgress(booking, new Date());
    const currentPosition = liveData?.current_position || liveData?.location || "";
    const lastUpdated = liveData?.updated_at || liveData?.last_updated || new Date();
    const liveNotice = liveData
      ? "Live updates synced from Blackcess flight operations."
      : "Live updates unavailable right now — showing the latest scheduled itinerary.";

    return `
      <div class="flight-tracker-card">
        <div class="tracker-head">
          <div>
            <span class="tracker-kicker">Live flight tracker</span>
            <h4>${esc(route.flightNumber)}: ${esc(route.fromCity)} to ${esc(route.toCity)}</h4>
          </div>
          <span class="tracker-status ${status.className}">${esc(status.label)}</span>
        </div>

        <div class="tracker-route">
          <div>
            <strong>${esc(route.fromCode || route.fromCity)}</strong>
            <span>${esc(formatDateTime(getDepartureTime(booking)))}</span>
          </div>
          <div class="tracker-progress" aria-label="Flight progress">
            <span style="width:${progress}%"></span>
          </div>
          <div>
            <strong>${esc(route.toCode || route.toCity)}</strong>
            <span>${esc(formatDateTime(getArrivalTime(booking)))}</span>
          </div>
        </div>

        <div class="tracker-grid">
          <div>
            <span class="tracker-label">Where it is now</span>
            <strong>${esc(currentPosition || (progress >= 100 ? route.toCity : progress > 0 ? "En route" : route.fromCity))}</strong>
          </div>
          <div>
            <span class="tracker-label">Journey progress</span>
            <strong>${progress}%</strong>
          </div>
          <div>
            <span class="tracker-label">Last updated</span>
            <strong>${esc(formatDateTime(lastUpdated))}</strong>
          </div>
        </div>

        <div class="tracker-footer">
          <small>${esc(liveNotice)}</small>
        </div>

        <div class="tracker-stops">
          <span class="tracker-label">Refuel / stop details</span>
          ${renderStops(booking)}
        </div>
      </div>
    `;
  }

  function normalizeLiveFlight(payload) {
    if (!payload) return null;
    if (Array.isArray(payload?.flights)) return payload.flights[0] || null;
    return payload.flight || payload;
  }

  async function fetchLiveDataLegacy(booking) {
    const route = getRoute(booking);
    const supabaseUrl = typeof SUPABASE_URL !== "undefined" ? SUPABASE_URL : window.SUPABASE_URL;
    const supabaseAnonKey = typeof SUPABASE_ANON_KEY !== "undefined" ? SUPABASE_ANON_KEY : window.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !route.flightNumber || route.flightNumber === "Flight") {
      return null;
    }

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/flight-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          flight_number: route.flightNumber,
          date: parseDate(getDepartureTime(booking))?.toISOString().slice(0, 10)
        })
      });
      const json = await res.json();
      if (!res.ok) return null;
      return Array.isArray(json.flights) ? json.flights[0] : json.flight || json;
    } catch (_) {
      return null;
    }
  }

  async function fetchLiveData(booking) {
    const route = getRoute(booking);
    const supabaseUrl = typeof SUPABASE_URL !== "undefined" ? SUPABASE_URL : window.SUPABASE_URL;
    const supabaseAnonKey = typeof SUPABASE_ANON_KEY !== "undefined" ? SUPABASE_ANON_KEY : window.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !route.flightNumber || route.flightNumber === "Flight") {
      return null;
    }

    const requestBody = {
      flight_number: route.flightNumber,
      date: parseDate(getDepartureTime(booking))?.toISOString().slice(0, 10)
    };

    const headers = {
      "Content-Type": "application/json"
    };

    if (supabaseAnonKey) {
      headers.Authorization = `Bearer ${supabaseAnonKey}`;
    }

    try {
      if (window.supabase?.functions?.invoke) {
        const { data, error } = await window.supabase.functions.invoke("flight-status", {
          body: requestBody,
          headers
        });
        if (error) return null;
        return normalizeLiveFlight(data);
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/flight-status`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody)
      });
      const json = await res.json();
      if (!res.ok) return null;
      return normalizeLiveFlight(json);
    } catch (_) {
      return null;
    }
  }

  function mount(container, booking) {
    if (!container || !booking) return null;
    let stopped = false;

    async function paint() {
      if (stopped) return;
      container.innerHTML = render(booking, null);
      const liveData = await fetchLiveData(booking);
      if (!stopped && liveData) {
        container.innerHTML = render(booking, liveData);
      }
    }

    paint();
    const timer = setInterval(paint, REFRESH_MS);
    return function stop() {
      stopped = true;
      clearInterval(timer);
    };
  }

  window.BlackcessFlightTracker = {
    mount,
    render,
    getStatus,
    getArrivalTime,
    getDepartureTime,
    hasArrived(booking) {
      return getStatus(booking).label === "Arrived Successfully";
    }
  };
})();
