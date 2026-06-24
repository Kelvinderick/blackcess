// 1. Mock Backend API (Simulating a server processing the request)
const mockFlightServer = async (departureCode, arrivalCode) => {
    // Coordinates Database hidden safely on the "server"
    const airports = {
        los: { name: "Lagos", lat: 6.5774, lon: 3.3210 },
        abv: { name: "Abuja", lat: 9.0068, lon: 7.2631 },
        phc: { name: "Port Harcourt", lat: 5.0151, lon: 6.9497 },
        kan: { name: "Kano", lat: 12.0483, lon: 8.5247 },
        bni: { name: "Benin City", lat: 6.3176, lon: 5.5995 },
        acc: { name: "Accra", lat: 5.6052, lon: -0.1668 },
        dss: { name: "Dakar", lat: 14.6715, lon: -17.0733 },
        lhr: { name: "London Heathrow", lat: 51.4700, lon: -0.4543 },
        lgw: { name: "London Gatwick", lat: 51.1481, lon: -0.1903 },
        dxb: { name: "Dubai", lat: 25.2532, lon: 55.3657 },
        jfk: { name: "New York", lat: 40.6413, lon: -73.7781 },
        cdg: { name: "Paris", lat: 49.0097, lon: 2.5479 },
        ams: { name: "Amsterdam", lat: 52.3105, lon: 4.7683 },
        bom: { name: "Mumbai", lat: 19.0896, lon: 72.8656 }
    };

    // Simulate a 1-second network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const origin = airports[departureCode];
    const destination = airports[arrivalCode];

    // Haversine formula calculation
    const R = 6371; 
    const dLat = (destination.lat - origin.lat) * Math.PI / 180;
    const dLon = (destination.lon - origin.lon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(R * c);

    // Calculate time taken
    const totalHours = (distanceKm / 850) + 0.5;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    // Return JSON response payload
    return {
        status: "success",
        data: {
            origin: origin.name,
            destination: destination.name,
            distance: `${distanceKm} km`,
            duration: `${hours}h ${minutes}m`
        }
    };
};

// 2. The Main Async Booking Function
async function handleFlightSearch(departure, arrival) {
    try {
        // Change the button state to show it's loading
        const searchBtn = document.querySelector(".search-btn");
        searchBtn.innerText = "Calculating Route...";
        searchBtn.disabled = true;

        /* If you have a real backend API, you would replace the line below with:
          const response = await fetch(`/api/distance?from=${departure}&to=${arrival}`);
          const result = await response.json();
        */
        const result = await mockFlightServer(departure, arrival);

        // UI Alert update
        alert(
            `✈️ Route: ${result.data.origin} to ${result.data.destination}\n` +
            `📏 Distance: ${result.data.distance}\n` +
            `⏳ Flight Duration: ${result.data.duration}`
        );

        // Reset button state
        searchBtn.innerText = "Search Flights";
        searchBtn.disabled = false;

    } catch (error) {
        console.error("Error fetching flight metrics:", error);
        alert("Something went wrong calculating your flight path.");
    }
}

// 3. Form Submission Interceptor
document.addEventListener("DOMContentLoaded", () => {
    const searchBtn = document.querySelector(".search-btn");
    const departureSelect = document.getElementById("departure");
    const arrivalSelect = document.getElementById("arrival");

    if (searchBtn) {
        searchBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            const fromCode = departureSelect.value;
            const toCode = arrivalSelect.value;

            if (!fromCode || !toCode) {
                alert("Please select both airports.");
                return;
            }

            if (fromCode === toCode) {
                alert("Departure and destination cannot be identical.");
                return;
            }

            // Await the asynchronous UI handling function
            await handleFlightSearch(fromCode, toCode);
        });
    }
});