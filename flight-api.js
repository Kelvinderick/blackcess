/**
 * Blackcess Airlines - Booking & Route Calculator Helper
 * This script calculates flight distances, durations, and simulates flight searches and bookings.
 * It also demonstrates how to connect to Flight Search APIs and a custom routing API.
 */

// 1. Airport Database with Coordinates (Latitude and Longitude)
const AIRPORTS = {
    los: { code: "LOS", name: "Murtala Muhammed International Airport", city: "Lagos", country: "Nigeria", lat: 6.5774, lon: 3.3210 },
    abv: { code: "ABV", name: "Nnamdi Azikiwe International Airport", city: "Abuja", country: "Nigeria", lat: 9.0068, lon: 7.2631 },
    phc: { code: "PHC", name: "Port Harcourt International Airport", city: "Port Harcourt", country: "Nigeria", lat: 5.0152, lon: 6.9497 },
    kan: { code: "KAN", name: "Mallam Aminu Kano International Airport", city: "Kano", country: "Nigeria", lat: 12.0483, lon: 8.5247 },
    bni: { code: "BNI", name: "Benin Airport", city: "Benin City", country: "Nigeria", lat: 6.3176, lon: 5.5995 },
    acc: { code: "ACC", name: "Kotoka International Airport", city: "Accra", country: "Ghana", lat: 5.6051, lon: -0.1668 },
    dss: { code: "DSS", name: "Blaise Diagne International Airport", city: "Dakar", country: "Senegal", lat: 14.6708, lon: -17.0733 },
    lhr: { code: "LHR", name: "London Heathrow Airport", city: "London", country: "United Kingdom", lat: 51.4700, lon: -0.4543 },
    lgw: { code: "LGW", name: "London Gatwick Airport", city: "London", country: "United Kingdom", lat: 51.1537, lon: -0.1821 },
    dxb: { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates", lat: 25.2532, lon: 55.3657 },
    jfk: { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "United States", lat: 40.6413, lon: -73.7781 },
    cdg: { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", lat: 49.0097, lon: 2.5479 },
    ams: { code: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands", lat: 52.3105, lon: 4.7683 },
    bom: { code: "BOM", name: "Chhatrapati Shivaji Maharaj Airport", city: "Mumbai", country: "India", lat: 19.0896, lon: 72.8656 }
};

// 2. Haversine Formula: Calculates Great-Circle distance between two coordinates in Kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c); // Distance in km
}

// 3. Flight Duration Estimator based on Distance
// Formula: Time = (Distance / Cruise Speed) + Buffer (for Takeoff, Landing, Taxiing)
function estimateDuration(distanceKm) {
    const averageSpeedKmh = 800; // Average commercial jet cruise speed (800 km/h)
    const bufferHours = 0.5;     // 30-minute buffer for ascent, descent, and taxiing
    
    const totalHours = (distanceKm / averageSpeedKmh) + bufferHours;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    
    return {
        hours: hours,
        minutes: minutes,
        formatted: `${hours}h ${minutes}m`,
        decimal: totalHours
    };
}

// 4. API Simulation wrapper
// In production, this would make fetch() requests to your node/Express backend or a third-party flight search API.
const BookingAPI = {
    // Simulates calling custom backend API for distance and travel time
    async getRouteDetails(fromCode, toCode) {
        // Simulating network latency
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const origin = AIRPORTS[fromCode.toLowerCase()];
        const destination = AIRPORTS[toCode.toLowerCase()];
        
        if (!origin || !destination) {
            throw new Error("Invalid origin or destination code.");
        }
        
        const distance = calculateDistance(origin.lat, origin.lon, destination.lat, destination.lon);
        const duration = estimateDuration(distance);
        
        return {
            origin: origin,
            destination: destination,
            distanceKm: distance,
            duration: duration,
            timestamp: new Date().toISOString()
        };
    },

    // Simulates calling a Flight Search API (e.g. Amadeus) for available flights
    async searchFlights(fromCode, toCode, date) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Network delay simulation
        
        const route = await this.getRouteDetails(fromCode, toCode);
        const distance = route.distanceKm;
        
        // Generate simulated pricing based on distance
        const basePriceNgn = Math.round(50000 + (distance * 120)); // Base price + NGN 120 per km
        
        // Determine aircraft type based on distance
        let aircraft = "Embraer E195";
        if (distance > 3000) {
            aircraft = "Airbus A330-900neo";
        } else if (distance > 1000) {
            aircraft = "Boeing 737-800";
        }
        
        // Return 3 flight options (Morning, Afternoon, Evening)
        return [
            {
                flightNumber: `BC ${Math.floor(100 + Math.random() * 900)}`,
                departureTime: "08:15",
                arrivalTime: calculateArrivalTime("08:15", route.duration.decimal),
                duration: route.duration.formatted,
                aircraft: aircraft,
                price: basePriceNgn,
                class: "Economy",
                route: route
            },
            {
                flightNumber: `BC ${Math.floor(100 + Math.random() * 900)}`,
                departureTime: "13:30",
                arrivalTime: calculateArrivalTime("13:30", route.duration.decimal),
                duration: route.duration.formatted,
                aircraft: aircraft,
                price: Math.round(basePriceNgn * 1.15), // Biz class or high demand
                class: "Business",
                route: route
            },
            {
                flightNumber: `BC ${Math.floor(100 + Math.random() * 900)}`,
                departureTime: "18:45",
                arrivalTime: calculateArrivalTime("18:45", route.duration.decimal),
                duration: route.duration.formatted,
                aircraft: aircraft,
                price: Math.round(basePriceNgn * 0.95), // Evening discount
                class: "Economy",
                route: route
            }
        ];
    }
};

// Helper: Calculate arrival time based on departure time and flight duration hours
function calculateArrivalTime(depTimeStr, durationHours) {
    const [h, m] = depTimeStr.split(":").map(Number);
    const depMinutes = h * 60 + m;
    const durMinutes = Math.round(durationHours * 60);
    const arrMinutes = (depMinutes + durMinutes) % 1440; // 24 hours wrap
    
    const arrHours = Math.floor(arrMinutes / 60);
    const arrMins = arrMinutes % 60;
    
    return `${String(arrHours).padStart(2, '0')}:${String(arrMins).padStart(2, '0')}`;
}

// 5. Initialize Page Interactions
document.addEventListener("DOMContentLoaded", () => {
    const searchBtn = document.querySelector(".search-btn");
    const departureSelect = document.getElementById("departure");
    const arrivalSelect = document.getElementById("arrival");
    const departureDateInput = document.getElementById("departure-date");
    
    // Trip Type Radio Toggles (One Way vs Round Trip)
    const tripRadios = document.querySelectorAll('input[name="trip"]');
    const returnDateGroup = document.getElementById("return-date-group");
    
    if (tripRadios.length > 0 && returnDateGroup) {
        // Initial setup based on checked radio
        const checkedRadio = document.querySelector('input[name="trip"]:checked');
        if (checkedRadio && checkedRadio.value === "oneway") {
            returnDateGroup.style.display = "none";
        } else {
            returnDateGroup.style.display = "flex";
        }
        
        tripRadios.forEach(radio => {
            radio.addEventListener("change", (e) => {
                if (e.target.value === "roundtrip") {
                    returnDateGroup.style.display = "flex";
                } else {
                    returnDateGroup.style.display = "none";
                }
            });
        });
    }
    
    // Inject Results Container and Modal styles dynamically if not defined in style2.css
    injectCustomStyles();
    
    if (searchBtn) {
        searchBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            
            const originCode = departureSelect.value;
            const destCode = arrivalSelect.value;
            const depDate = departureDateInput.value;
            
            // Validations
            if (!originCode || !destCode) {
                alert("Please select both Departure and Destination airports.");
                return;
            }
            if (originCode === destCode) {
                alert("Departure and Destination airports cannot be the same.");
                return;
            }
            if (!depDate) {
                alert("Please select a travel date.");
                return;
            }
            
            // Show loading state
            searchBtn.disabled = true;
            searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
            
            // Remove previous results
            const oldResults = document.getElementById("search-results-section");
            if (oldResults) oldResults.remove();
            
            try {
                // Call our API Simulator
                const flights = await BookingAPI.searchFlights(originCode, destCode, depDate);
                renderSearchResults(flights);
            } catch (error) {
                console.error("Flight Search Error:", error);
                alert("Failed to retrieve flights. Please try again.");
            } finally {
                searchBtn.disabled = false;
                searchBtn.innerHTML = "Search Flights";
            }
        });
    }
});

// 6. UI Rendering Functions
function renderSearchResults(flights) {
    const bookingSection = document.querySelector(".booking-section");
    const route = flights[0].route;
    
    const resultsHtml = `
        <div id="search-results-section" class="results-section">
            <div class="results-header">
                <div class="route-info-bar">
                    <h2>Available Flights</h2>
                    <p class="route-meta">
                        <strong>${route.origin.city} (${route.origin.code})</strong> 
                        <i class="fas fa-arrow-right"></i> 
                        <strong>${route.destination.city} (${route.destination.code})</strong>
                    </p>
                </div>
                <div class="route-stats-badge">
                    <span><i class="fas fa-route"></i> Distance: <strong>${route.distanceKm.toLocaleString()} km</strong></span>
                    <span class="separator">|</span>
                    <span><i class="fas fa-clock"></i> Est. Flight Duration: <strong>${route.duration.formatted}</strong></span>
                </div>
            </div>
            
            <div class="flights-list">
                ${flights.map(flight => `
                    <div class="flight-result-card">
                        <div class="flight-main-info">
                            <div class="airline-brand">
                                <div class="mini-logo-crown">👑</div>
                                <div>
                                    <span class="result-flight-num">${flight.flightNumber}</span>
                                    <span class="result-aircraft">${flight.aircraft}</span>
                                </div>
                            </div>
                            <div class="time-timeline">
                                <div class="time-node departure">
                                    <span class="time-value">${flight.departureTime}</span>
                                    <span class="airport-code">${flight.route.origin.code}</span>
                                </div>
                                <div class="flight-timeline-connector">
                                    <span class="timeline-duration">${flight.duration}</span>
                                    <div class="plane-line">
                                        <div class="line"></div>
                                        <i class="fas fa-plane"></i>
                                    </div>
                                    <span class="timeline-stops">Non-stop</span>
                                </div>
                                <div class="time-node arrival">
                                    <span class="time-value">${flight.arrivalTime}</span>
                                    <span class="airport-code">${flight.route.destination.code}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flight-price-action">
                            <div class="price-container">
                                <span class="price-label">${flight.class} Fares from</span>
                                <span class="price-amount">₦${flight.price.toLocaleString()}</span>
                                <span class="taxes-label">incl. taxes & fees</span>
                            </div>
                            <button class="book-now-btn" onclick="triggerBooking('${flight.flightNumber}', '${flight.route.origin.code}', '${flight.route.destination.code}', '${flight.departureTime}', '${flight.arrivalTime}', '${flight.duration}', ${flight.price}, '${flight.aircraft}', '${flight.class}')">
                                Book Flight
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Append the search results inside the booking section
    bookingSection.insertAdjacentHTML("beforeend", resultsHtml);
    
    // Smooth scroll to results
    document.getElementById("search-results-section").scrollIntoView({ behavior: "smooth" });
}

// 7. Booking Action Handler
window.triggerBooking = function(flightNum, fromCode, toCode, depTime, arrTime, duration, price, aircraft, cabinClass) {
    const origin = AIRPORTS[fromCode.toLowerCase()];
    const destination = AIRPORTS[toCode.toLowerCase()];
    const distanceKm = calculateDistance(origin.lat, origin.lon, destination.lat, destination.lon);
    
    // Generate simple PNR (Passenger Name Record) Booking Reference
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pnr = '';
    for (let i = 0; i < 6; i++) {
        pnr += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    const randomSeat = `${Math.floor(Math.random() * 20) + 1}${['A', 'B', 'C', 'D', 'F'].sort(() => 0.5 - Math.random())[0]}`;
    const randomGate = `${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 15) + 1}`;
    
    // Render Booking Confirmation Card Overlay
    const modalHtml = `
        <div id="booking-modal-overlay" class="modal-overlay">
            <div class="booking-confirmation-modal">
                <button class="close-modal-btn" onclick="closeBookingModal()">&times;</button>
                <div class="modal-header">
                    <div class="modal-header-accent"></div>
                    <i class="fas fa-circle-check success-icon"></i>
                    <h2>Flight Successfully Booked!</h2>
                    <p>Your booking details have been calculated by the Custom Routing Engine.</p>
                </div>
                
                <!-- Premium Digital Boarding Pass -->
                <div class="boarding-pass">
                    <div class="pass-top">
                        <div class="brand">
                            <span class="brand-text">BLACKCESS</span>
                            <span class="sub-brand">ROYAL AVIATION</span>
                        </div>
                        <div class="pnr-box">
                            <span class="pnr-title">BOOKING REF (PNR)</span>
                            <span class="pnr-value">${pnr}</span>
                        </div>
                    </div>
                    
                    <div class="pass-middle">
                        <div class="airport-label">
                            <span class="city">${origin.city}</span>
                            <span class="code">${origin.code}</span>
                            <span class="airport-name">${origin.name}</span>
                        </div>
                        <div class="plane-connector">
                            <i class="fas fa-plane"></i>
                        </div>
                        <div class="airport-label align-right">
                            <span class="city">${destination.city}</span>
                            <span class="code">${destination.code}</span>
                            <span class="airport-name">${destination.name}</span>
                        </div>
                    </div>
                    
                    <div class="pass-details-grid">
                        <div class="detail-cell">
                            <span class="detail-label">FLIGHT</span>
                            <span class="detail-val">${flightNum}</span>
                        </div>
                        <div class="detail-cell">
                            <span class="detail-label">CABIN CLASS</span>
                            <span class="detail-val">${cabinClass}</span>
                        </div>
                        <div class="detail-cell">
                            <span class="detail-label">SEAT</span>
                            <span class="detail-val">${randomSeat}</span>
                        </div>
                        <div class="detail-cell">
                            <span class="detail-label">GATE</span>
                            <span class="detail-val">${randomGate}</span>
                        </div>
                        <div class="detail-cell">
                            <span class="detail-label">DEP TIME</span>
                            <span class="detail-val">${depTime}</span>
                        </div>
                        <div class="detail-cell">
                            <span class="detail-label">ARR TIME</span>
                            <span class="detail-val">${arrTime}</span>
                        </div>
                    </div>
                    
                    <!-- The Custom API calculation statistics -->
                    <div class="pass-api-metrics">
                        <div class="metric-title">
                            <i class="fas fa-gears"></i> Custom Routing API Computations
                        </div>
                        <div class="metrics-row">
                            <div class="metric-item">
                                <span class="m-label">Route Distance</span>
                                <span class="m-value"><i class="fas fa-route"></i> ${distanceKm.toLocaleString()} km</span>
                            </div>
                            <div class="metric-item">
                                <span class="m-label">Flight Duration</span>
                                <span class="m-value"><i class="fas fa-clock"></i> ${duration}</span>
                            </div>
                            <div class="metric-item">
                                <span class="m-label">Cruise Speed</span>
                                <span class="m-value"><i class="fas fa-gauge"></i> 800 km/h</span>
                            </div>
                        </div>
                        <div class="api-logs">
                            <span><i class="fas fa-terminal"></i> Response Status: 200 OK</span>
                            <span>Calculated using coordinates: Origin (${origin.lat.toFixed(4)}, ${origin.lon.toFixed(4)}) &rarr; Dest (${destination.lat.toFixed(4)}, ${destination.lon.toFixed(4)})</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="confirm-done-btn" onclick="closeBookingModal()">Done</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    document.body.style.overflow = "hidden"; // Disable background scrolling
};

window.closeBookingModal = function() {
    const overlay = document.getElementById("booking-modal-overlay");
    if (overlay) {
        overlay.remove();
        document.body.style.overflow = "auto";
    }
};

// 8. Dynamically Inject styles for Search Results and Boarding Pass Modal
function injectCustomStyles() {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
        /* Results Section Styling */
        .results-section {
            max-width: 1000px;
            margin: 3rem auto 1rem;
            padding: 2rem;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            animation: fadeInUp 0.5s ease-out;
        }
        
        .results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 1.5rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1rem;
        }
        
        .route-info-bar h2 {
            font-size: 1.6rem;
            color: #0f172a;
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
        }
        
        .route-meta {
            font-size: 1.1rem;
            color: #64748b;
            margin-top: 0.25rem;
        }
        
        .route-meta i {
            color: #d4af37;
            margin: 0 0.5rem;
        }
        
        .route-stats-badge {
            background: linear-gradient(135deg, #1e293b, #0f172a);
            color: #ffffff;
            padding: 0.75rem 1.25rem;
            border-radius: 30px;
            font-size: 0.9rem;
            display: flex;
            gap: 0.8rem;
            align-items: center;
            border: 1px solid #d4af37;
        }
        
        .route-stats-badge strong {
            color: #d4af37;
        }
        
        .route-stats-badge .separator {
            color: #475569;
        }
        
        /* Flight Card Styling */
        .flight-result-card {
            display: grid;
            grid-template-columns: 1fr 280px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 1.5rem;
            transition: all 0.3s ease;
            background: #ffffff;
        }
        
        .flight-result-card:hover {
            box-shadow: 0 8px 30px rgba(0,0,0,0.06);
            border-color: #d4af37;
            transform: translateY(-2px);
        }
        
        .flight-main-info {
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 1.2rem;
            border-right: 1px dashed #e2e8f0;
        }
        
        .airline-brand {
            display: flex;
            align-items: center;
            gap: 0.8rem;
        }
        
        .mini-logo-crown {
            width: 32px;
            height: 32px;
            background: #0f172a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #d4af37;
            font-size: 0.9rem;
            border: 1px solid #d4af37;
        }
        
        .result-flight-num {
            display: block;
            font-weight: 700;
            color: #0f172a;
            font-size: 1.1rem;
        }
        
        .result-aircraft {
            display: block;
            font-size: 0.75rem;
            color: #64748b;
        }
        
        .time-timeline {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
        }
        
        .time-node {
            display: flex;
            flex-direction: column;
            width: 90px;
        }
        
        .time-node.align-right {
            text-align: right;
        }
        
        .time-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0f172a;
        }
        
        .airport-code {
            font-size: 0.9rem;
            color: #64748b;
            font-weight: 600;
        }
        
        .flight-timeline-connector {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            padding: 0 1.5rem;
        }
        
        .timeline-duration {
            font-size: 0.8rem;
            color: #64748b;
            margin-bottom: 0.3rem;
            font-weight: 500;
        }
        
        .plane-line {
            width: 100%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .plane-line .line {
            position: absolute;
            width: 100%;
            height: 2px;
            background: #cbd5e1;
            top: 50%;
            left: 0;
            transform: translateY(-50%);
            z-index: 1;
        }
        
        .plane-line i {
            color: #d4af37;
            background: #ffffff;
            padding: 0 0.5rem;
            z-index: 2;
            font-size: 0.9rem;
            transform: rotate(90deg);
        }
        
        .timeline-stops {
            font-size: 0.75rem;
            color: #10b981;
            margin-top: 0.3rem;
            font-weight: 600;
        }
        
        .flight-price-action {
            padding: 1.5rem;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 1rem;
        }
        
        .price-container {
            text-align: center;
        }
        
        .price-label {
            display: block;
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .price-amount {
            display: block;
            font-size: 1.8rem;
            font-weight: 800;
            color: #0f172a;
            margin: 0.1rem 0;
        }
        
        .taxes-label {
            font-size: 0.7rem;
            color: #94a3b8;
        }
        
        .book-now-btn {
            background: linear-gradient(135deg, #d4af37, #ba8b02);
            color: #0f172a;
            border: none;
            padding: 0.8rem 1.8rem;
            font-size: 0.95rem;
            font-weight: 700;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            transition: all 0.2s ease;
            box-shadow: 0 4px 10px rgba(212, 175, 55, 0.25);
        }
        
        .book-now-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(212, 175, 55, 0.35);
        }
        
        /* Modal Overlay Styling */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 1rem;
            overflow-y: auto;
        }
        
        .booking-confirmation-modal {
            background: #ffffff;
            width: 100%;
            max-width: 600px;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
            position: relative;
            animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .close-modal-btn {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 2rem;
            color: #94a3b8;
            cursor: pointer;
            line-height: 1;
            transition: color 0.2s;
        }
        
        .close-modal-btn:hover {
            color: #0f172a;
        }
        
        .modal-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .success-icon {
            font-size: 3rem;
            color: #10b981;
            margin-bottom: 0.75rem;
        }
        
        .modal-header h2 {
            font-family: 'Outfit', sans-serif;
            color: #0f172a;
            font-size: 1.6rem;
            font-weight: 700;
        }
        
        .modal-header p {
            color: #64748b;
            font-size: 0.9rem;
            margin-top: 0.25rem;
        }
        
        /* Boarding Pass Card Styling */
        .boarding-pass {
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            background: #ffffff;
            box-shadow: 0 4px 15px rgba(0,0,0,0.02);
        }
        
        .pass-top {
            background: linear-gradient(135deg, #1e293b, #0f172a);
            color: #ffffff;
            padding: 1.25rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #d4af37;
        }
        
        .pass-top .brand {
            display: flex;
            flex-direction: column;
        }
        
        .pass-top .brand-text {
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            font-size: 1.2rem;
            letter-spacing: 1px;
        }
        
        .pass-top .sub-brand {
            font-size: 0.6rem;
            color: #94a3b8;
            letter-spacing: 3px;
        }
        
        .pnr-box {
            text-align: right;
        }
        
        .pnr-title {
            display: block;
            font-size: 0.6rem;
            color: #94a3b8;
            letter-spacing: 0.5px;
        }
        
        .pnr-value {
            font-family: monospace;
            font-size: 1.3rem;
            font-weight: 700;
            color: #d4af37;
        }
        
        .pass-middle {
            padding: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #faf8f2;
            border-bottom: 1px dashed #cbd5e1;
        }
        
        .airport-label {
            display: flex;
            flex-direction: column;
            max-width: 40%;
        }
        
        .airport-label.align-right {
            align-items: flex-end;
            text-align: right;
        }
        
        .airport-label .city {
            font-size: 0.75rem;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        
        .airport-label .code {
            font-size: 2.2rem;
            font-weight: 800;
            color: #0f172a;
            line-height: 1;
            margin: 0.2rem 0;
        }
        
        .airport-label .airport-name {
            font-size: 0.65rem;
            color: #94a3b8;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 150px;
        }
        
        .plane-connector {
            font-size: 1.5rem;
            color: #d4af37;
        }
        
        .pass-details-grid {
            padding: 1.25rem 1.5rem;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem 0.5rem;
            background: #ffffff;
            border-bottom: 1px dashed #cbd5e1;
        }
        
        .detail-cell {
            display: flex;
            flex-direction: column;
        }
        
        .detail-label {
            font-size: 0.65rem;
            color: #94a3b8;
            font-weight: 600;
        }
        
        .detail-val {
            font-size: 0.95rem;
            font-weight: 700;
            color: #0f172a;
        }
        
        /* Metrics Box Styling (Calculated by the Custom API) */
        .pass-api-metrics {
            background: #f8fafc;
            padding: 1.25rem 1.5rem;
            border-top: 1px solid #e2e8f0;
        }
        
        .metric-title {
            font-size: 0.75rem;
            font-weight: 700;
            color: #334155;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            margin-bottom: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .metric-title i {
            color: #0052a3;
        }
        
        .metrics-row {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
        }
        
        .metric-item {
            flex: 1;
            background: #ffffff;
            padding: 0.6rem 0.8rem;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
        }
        
        .m-label {
            display: block;
            font-size: 0.6rem;
            color: #94a3b8;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .m-value {
            font-size: 0.9rem;
            font-weight: 700;
            color: #0052a3;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            margin-top: 0.15rem;
        }
        
        .m-value i {
            color: #d4af37;
        }
        
        .api-logs {
            margin-top: 0.8rem;
            padding-top: 0.6rem;
            border-top: 1px solid #f1f5f9;
            font-family: monospace;
            font-size: 0.65rem;
            color: #64748b;
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
        }
        
        .api-logs i {
            color: #10b981;
        }
        
        .modal-footer {
            margin-top: 1.5rem;
            text-align: center;
        }
        
        .confirm-done-btn {
            background: #0f172a;
            color: #ffffff;
            border: none;
            padding: 0.75rem 2.5rem;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.2s;
            border: 1px solid #d4af37;
        }
        
        .confirm-done-btn:hover {
            background: #1e293b;
            color: #d4af37;
        }
        
        /* Keyframes */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes zoomIn {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        /* Responsiveness */
        @media (max-width: 768px) {
            .flight-result-card {
                grid-template-columns: 1fr;
            }
            
            .flight-main-info {
                border-right: none;
                border-bottom: 1px dashed #e2e8f0;
            }
            
            .time-timeline {
                flex-direction: column;
                gap: 1rem;
                align-items: flex-start;
            }
            
            .time-node {
                width: 100%;
                flex-direction: row;
                gap: 0.5rem;
                align-items: center;
            }
            
            .time-node.align-right {
                text-align: left;
                align-items: center;
            }
            
            .flight-timeline-connector {
                width: 100%;
                padding: 0;
                align-items: flex-start;
            }
            
            .plane-line {
                width: 120px;
                justify-content: flex-start;
            }
            
            .plane-line .line {
                width: 100px;
                left: 0;
            }
            
            .plane-line i {
                left: 90px;
                position: absolute;
            }
            
            .pass-details-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .metrics-row {
                flex-direction: column;
                gap: 0.5rem;
            }
        }
    `;
    document.head.appendChild(styleEl);
}
