const form = document.getElementById("form");
const list = document.getElementById("list");
const placeInput = document.getElementById("place");
const actionInput = document.getElementById("action");
const showBoardBtn = document.getElementById("showBoard");
const showMapBtn = document.getElementById("showMap");
const mapView = document.getElementById("mapView");
const columns = document.querySelector(".columns");

let flights = JSON.parse(localStorage.getItem("oopsTripFlights")) || [];
let map;
let geocoder;
let markers = [];

/* Init Google Map */
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 20, lng: 0 },
    zoom: 2,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#020617" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#facc15" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#020617" }] }
    ]
  });

  geocoder = new google.maps.Geocoder();
  renderMap();
}

/* Save */
function save() {
  localStorage.setItem("oopsTripFlights", JSON.stringify(flights));
}

/* Stats */
function updateStats() {
  // Misiones completadas
  const completed = flights.filter(f => f.done);

  // Países únicos (usa country, no place)
  const countries = new Set(
    completed.map(f => f.country)
  );

  const countriesCount = countries.size;
  const missionsCount = completed.length;

  // Actualizar contador visual (estilo panel)
  document.getElementById("countriesCount").textContent =
    String(countriesCount).padStart(2, "0");

  document.getElementById("missionsCount").textContent =
    String(missionsCount).padStart(2, "0");
}


/* Plane animation */
function playFlightAnimation() {
  const plane = document.createElement("div");
  plane.textContent = "✈️";
  plane.className = "plane";
  document.body.appendChild(plane);
  setTimeout(() => plane.remove(), 1200);
}

/* Render board */
function renderBoard() {
  list.innerHTML = "";

  flights.forEach((flight, index) => {
    const li = document.createElement("li");
    if (flight.done) li.classList.add("done");

    li.innerHTML = `
      <span>${flight.place}</span>
      <span>${flight.action}</span>
      <span class="status">${flight.done ? "LANDED" : "BOARDING"}</span>
      <span class="actions">
        <button class="done-btn">✔</button>
        <button class="delete-btn">✖</button>
      </span>
    `;

    li.querySelector(".done-btn").onclick = () => {
      flight.done = !flight.done;
      save();
      renderBoard();
      renderMap();
      updateStats();
      if (flight.done) playFlightAnimation();
    };

    li.querySelector(".delete-btn").onclick = () => {
      flights.splice(index, 1);
      save();
      renderBoard();
      renderMap();
      updateStats();
    };

    list.appendChild(li);
  });
}

/* Geocode */
function geocodePlace(place) {
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address: place }, (results, status) => {
      if (status === "OK") {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else {
        reject();
      }
    });
  });
}

/* Render map */
function renderMap() {
  if (!map) return;

  markers.forEach(m => m.setMap(null));
  markers = [];

  flights.forEach(flight => {
    if (!flight.lat) return;

    const marker = new google.maps.Marker({
      position: { lat: flight.lat, lng: flight.lng },
      map,
      title: flight.place,
      icon: flight.done
        ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        : "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
    });

    const info = new google.maps.InfoWindow({
      content: `<strong>${flight.place}</strong><br>${flight.action}`
    });

    marker.addListener("mouseover", () => info.open(map, marker));
    marker.addListener("mouseout", () => info.close());

    markers.push(marker);
  });
}

/* View switch */
showBoardBtn.addEventListener("click", () => {
  columns.classList.remove("hidden");
  list.classList.remove("hidden");
  mapView.classList.add("hidden");
});

showMapBtn.addEventListener("click", () => {
  columns.classList.add("hidden");
  list.classList.add("hidden");
  mapView.classList.remove("hidden");
  renderMap();
});


/* Submit */
form.onsubmit = async e => {
  e.preventDefault();

  try {
    const coords = await geocodePlace(placeInput.value);

    flights.push({
      place: placeInput.value,
      action: actionInput.value,
      lat: coords.lat,
      lng: coords.lng,
      done: false
    });

    save();
    renderBoard();
    renderMap();
    updateStats();
    form.reset();
  } catch {
    alert("No se pudo localizar ese lugar 😢");
  }
};

/* Init */
renderBoard();
updateStats();
