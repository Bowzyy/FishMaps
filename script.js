// USING Overpass Api, a read only API that gathers selected parts of Open Street Map data

async function getLocation() {
    // async - asyncronous function for network requests
    const RESULT = document.getElementById("result");
    const MY_LOCATION = document.getElementById("mycoords");
    RESULT.innerText = "Getting your location...";

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const LAT = pos.coords.latitude;
            const LON = pos.coords.longitude;
            MY_LOCATION.innerText = LAT + ", " + LON;
            checkWater(LAT, LON);
        },

        (err) => {
            console.warn("Geolocation failed:", err.message);
            RESULT.innerText =
                "Could not get your location. Using default location for testing...";
            // Default coordinates to test (Bristol City)
            const LAT = 51.4545;
            const LON = -2.5879;
            MY_LOCATION.innerText = LAT + ", " + LON;
            checkWater(LAT, LON);
        },
        { enableHighAccuracy: true, timeout: 10000 },
    );
}

// Use latitude and longitude as parameters, gathered from users location
async function checkWater(lat, lon) {
    const RESULT = document.getElementById("result");
    RESULT.innerText = "Checking nearby water features...";

    // QUERY
    // Filter for different water data:
    // NODE - a single point on a map (coordinates)
    // WAY - an ordered list of nodes to make a line or polygon
    // RELATION - a group of nodes to describe complex features

    // [out:json] - return results in json format
    // around: 800 -> within 800m
    // final out; return matching elements

    const QUERY = `[out:json];(
        way(around:500,${lat},${lon})["waterway"~"river|stream|canal"];
        way(around:500,${lat},${lon})["natural"="water"];
        way(around:500,${lat},${lon})["natural"="coastline"];
    );out;`;

    try {
        // Fetch - sends a http request to the overpass api interpreter endpoint**
        // POST method is used because it can return longer data (GET has a length limit)
        // Use QUERY - the query language stated above used to filter the data
        const RESPONSE = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method: "POST",
                body: QUERY,
            },
        );

        // Convert response from JSON text into a JavaScript object
        const DATA = await RESPONSE.json();

        // If not near water, return
        if (!DATA.elements || DATA.elements.length === 0) {
            RESULT.innerText = "Not near water! (800 meters)";
            return;
        }

        let RIVERS = 0,
            LAKES = 0,
            SEAS = 0;

        // WATER_TYPE.tags - contains OSM data describing the features
        // natural - lakes and ponds
        // waterway - running water such as rivers
        // Currently increments counters, will implement a smaller range and speicific water body
        DATA.elements.forEach((WATER_TYPE) => {
            // Some data is missing a tag property, so by going tags?.waterway, it first checks if the tags property exists and is not undefined or null
            // Mega useful because API overpass elements arent guarnteed to have tags
            if (WATER_TYPE.tags?.waterway) RIVERS++;
            if (WATER_TYPE.tags?.natural === "water") LAKES++;
            if (WATER_TYPE.tags?.natural === "coastline") SEAS++;
        });

        // Update UI based on the information

        RESULT.innerHTML = `
      Nearby water detected:<br>
      Rivers: ${RIVERS}<br>
      Lakes/Pond: ${LAKES}<br>
      Sea: ${SEAS}
    `;

        // If the API or network fails show this error.
    } catch (err) {
        console.error(err);
        RESULT.innerText = "Error querying water data from Overpass API.";
    }
}
