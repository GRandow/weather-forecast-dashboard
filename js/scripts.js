// graph JS: https://www.highcharts.com/demo
const apiKey = "327efba1eb178d8cb3fe604a81478a13";

async function localizationByIp() {
  try {
    //fetch to get the user IP
    const userIp = await fetch("https://ipapi.co/json/");
    const dataUser = await userIp.json();

    // Getting lat, long and the city
    if (dataUser.latitude && dataUser.longitude) {
      const lat = dataUser.latitude;
      const lon = dataUser.longitude;
      const cityByIp = dataUser.city;

      console.log(`Localization detected by IP: ${cityByIp} (${lat}, ${lon})`);

      // calling the API with coordinates
      searchWeatherByCoordinate(lat, lon, cityByIp);
    } else {
      // Setting the default city to São Paulo
      console.warn("Could not detect IP. Using default city.");
      searchWeather("São Paulo");
    }
  } catch (err) {
    console.error("Erro ao buscar IP:", err);
    // If the request fails, load a default city to prevent an empty screen
    searchWeather("São Paulo");
  }
}

async function searchWeatherByCoordinate(lat, lon, cityName) {
  try {
    const urlForecast = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${apiKey}`;

    const requestForecast = await fetch(urlForecast);
    const dataForecast = await requestForecast.json();

    const forecastArray = dataForecast.list;

    // Filter for the next 12 hours and 5 days
    const next12Hours = forecastArray.slice(0, 4);
    const next5Days = forecastArray.filter((item) =>
      item.dt_txt.includes("12:00:00"),
    );

    // Updates the interface
    attInterface(cityName, next12Hours, next5Days);
  } catch (err) {
    console.error("Error when searching weather by coordinates:", err);
  }
}

async function searchWeather(city) {
  try {
    // Geocoding
    const urlGeocoding = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`;
    const fetchGeo = await fetch(urlGeocoding);
    const dataGeo = await fetchGeo.json();

    if (dataGeo.length === 0) {
      alert("Could not find the city");
      return;
    }

    const { lat, lon, name } = dataGeo[0];

    // Next 5 days of forecast
    const urlForecast = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${apiKey}`;
    const fetchForecast = await fetch(urlForecast);
    const dataForecast = await fetchForecast.json();
    const arrayForecast = dataForecast.list;

    // Next 12 hours of forecast
    const next12Hours = arrayForecast.slice(0, 4);

    // Filter the list to get 12am of the next 5 days
    const next5Days = arrayForecast.filter((item) =>
      item.dt_txt.includes("12:00:00"),
    );

    // Updates the interface
    attInterface(name, next12Hours, next5Days);
  } catch (err) {
    console.error("Request error: ", err);
  }
}

function attInterface(city, hours, days) {
  console.log(`--- ${city} ---`);
  console.log("Next 12 hours: ", hours);
  console.log("PNext 5 days: ", days);
}

const searchForm = document.querySelector(".search-form");
const cityField = document.querySelector("#local");

function searchInput(evento) {
  evento.preventDefault();

  const cityTipped = cityField.value.trim();

  if (cityTipped === "") {
    alert("Please enter a city name.");
    return;
  }

  searchWeather(cityTipped);
  cityField.value = "";
}

// event listener for search
searchForm.addEventListener("submit", searchInput);

window.addEventListener("DOMContentLoaded", () => {
  localizationByIp();
});
