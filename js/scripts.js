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
      const stateByIp = dataUser.region_code;
      const countryByIp = dataUser.country_code;
      const locationString = `${cityByIp}, ${stateByIp} - ${countryByIp}`;

      // calling the API with coordinates
      searchWeatherByCoordinate(lat, lon, locationString);
    } else {
      // Setting the default city to São Paulo
      console.warn("Could not detect IP. Using default city.");
      searchWeather("São Paulo");
    }
  } catch (err) {
    console.error("Error when looking for IP:", err);
    // If the request fails, load a default city to prevent an empty screen
    searchWeather("São Paulo");
  }
}

async function searchWeatherByCoordinate(lat, lon, locationName) {
  try {
    const urlForecast = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    const requestForecast = await fetch(urlForecast);
    const dataForecast = await requestForecast.json();

    const forecastArray = dataForecast.list;

    // Filter for the next 24 hours and 5 days
    const next24Hours = forecastArray.slice(0, 8);
    const next5Days = forecastArray.filter((item) =>
      item.dt_txt.includes("12:00:00"),
    );

    let finalLocation = locationName;

    // Updates the interface
    attInterface(finalLocation, next24Hours, next5Days);
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

    const { lat, lon, name, state, country } = dataGeo[0];
    // some countries dont return the state, so we have to check it
    const locationString = state
      ? `${name}, ${state} - ${country}`
      : `${name} - ${country}`;

    // Next 5 days of forecast
    const urlForecast = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const fetchForecast = await fetch(urlForecast);
    const dataForecast = await fetchForecast.json();
    const arrayForecast = dataForecast.list;

    // Next 24 hours of forecast
    const next24Hours = arrayForecast.slice(0, 8);

    // Filter the list to get 12am of the next 5 days
    const next5Days = arrayForecast.filter((item) =>
      item.dt_txt.includes("12:00:00"),
    );

    // Updates the interface
    attInterface(locationString, next24Hours, next5Days);
  } catch (err) {
    console.error("Request error: ", err);
  }
}

function attInterface(locationInfo, hours, days) {
  document.querySelector("#texto_local").innerText = locationInfo;
  document.querySelector("#texto_clima").innerText =
    hours[0].weather[0].description;

  const tempAtual = hours[0].main.temp;
  document.querySelector("#texto_temperatura").innerText =
    `${Math.round(tempAtual)}°C`;

  const dailyTemp = hours.map((bloco) => bloco.main.temp);
  const tempMin = Math.min(...dailyTemp);
  const tempMax = Math.max(...dailyTemp);

  document.querySelector("#texto_max_min").innerText =
    `${Math.round(tempMin)}° / ${Math.round(tempMax)}°`;

  // Get the weather ID and icon code (to determine day or night)
  const weatherId = hours[0].weather[0].id;
  const iconCode = hours[0].weather[0].icon;

  // Check if the icon code ends with "d" (day) or "n" (night)
  const period = iconCode.endsWith("d") ? "day" : "night";

  const elementIcon = document.querySelector("#weather_icon");

  // Clear old classes to prevent icon overlap on new searches
  elementIcon.className = "wi";

  // Build the dynamic class based on the API ID
  const classIcon = `wi-owm-${period}-${weatherId}`;

  elementIcon.classList.add(classIcon);
  renderHourlyChart(hours);
  renderFiveDays(days);
}

function renderHourlyChart(hours) {
  // Extract and format the hours for the X axis
  const hoursLabels = hours.map((block) => {
    const time = block.dt_txt.split(" ")[1];
    return time.substring(0, 5);
  });

  // Extract and round the temperatures for the Y axis
  const targetTemperatures = hours.map((block) => Math.round(block.main.temp));

  // Render the Highcharts graph inside #hourly_chart
  Highcharts.chart("hourly_chart", {
    chart: {
      type: "spline",
      backgroundColor: "transparent",
      height: 370,
      reflow: true,
    },
    title: {
      text: null,
    },
    xAxis: {
      categories: hoursLabels,
      labels: {
        style: { color: "#333333" },
      },
    },
    yAxis: {
      title: { text: null },
      labels: {
        format: "{value}°",
        style: { color: "#333333" },
      },
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      valueSuffix: "°C",
    },
    credits: {
      enabled: false,
    },
    series: [
      {
        name: "Temperature",
        data: targetTemperatures,
        color: "#4a90e2",
        marker: {
          enabled: true,
          radius: 5,
        },
      },
    ],
  });
}

function renderFiveDays(days) {
  const container = document.querySelector("#info_5dias");

  // Loop through the days array and build an array of HTML strings
  const cardsHtml = days.map((currentDayData) => {
    // Format day name
    const dateMilliseconds = currentDayData.dt * 1000;
    const dateObject = new Date(dateMilliseconds);

    let dayName = dateObject.toLocaleDateString("en-US", { weekday: "long" });

    // get weather icon
    const iconCode = currentDayData.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    // get temperatures
    const tempMax = Math.round(currentDayData.main.temp_max);
    const tempMin = Math.round(currentDayData.main.temp_min);

    // return the template string
    return `
      <div class="day col">
        <div class="day_inner">
          <div class="dayname">${dayName}</div>
          <div class="daily_weather_icon" style="background-image: url('${iconUrl}');"></div>
          <div class="max_min_temp">${tempMin}° / ${tempMax}°</div>
        </div>
      </div>
    `;
  });

  //Join all HTML strings together and inject them into the container
  container.innerHTML = cardsHtml.join("");
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
