function guessZipCode(){
  // Skip geolookup until replaced with TWC (wunderground api dead)
  return;

  var zipCodeElement = getElement("zip-code-text");
  // Before filling with auto zip, check and see if
  // there is already an input
  if(zipCodeElement.value != ""){
    return;
  }

  // always use wunderground API for geolookup
  // only valid equivalent is GET v3/location/search
  // TODO: use TWC API GET v3/location/search instead of wunderground geolookup
  fetch(`https://api.wunderground.com/api/${CONFIG.secrets.wundergroundAPIKey}/geolookup/q/autoip.json`)
    .then(function(response) {
      //check for error
      if (response.status !== 200) {
        console.log("zip code request error");
        return;
      }
      response.json().then(function(data) {
        // Only fill zip if the user didn't touch
        // the box while the zip was fetching
        if(zipCodeElement.value == ""){
          zipCodeElement.value = data.location.zip;
        }
      });
    })
}

function fetchAlerts(){
  var alertCrawl = "";
  fetch(`https://api.weather.gov/alerts/active?point=${latitude},${longitude}`)
    .then(function(response) {
        if (response.status !== 200) {
            console.warn("Alerts Error, no alerts will be shown");
        }
      response.json().then(function(data) {
        if (data.features == undefined){
          fetchForecast();
          return;
        }
        if (data.features.length == 1) {
          alerts[0] = data.features[0].properties.event + '<br>' + data.features[0].properties.description.replace("..."," ").replace(/\*/g, "")
          for(var i = 0; i < data.features.length; i++){
            /* Take the most important alert message and set it as crawl text
            This will supply more information i.e. tornado warning coverage */
            alertCrawl = alertCrawl + " " + data.features[i].properties.description.replace("...", " ");
          }
        }
        else {
          for(var i = 0; i < data.features.length; i++){
            /* Take the most important alert message and set it as crawl text
            This will supply more information i.e. tornado warning coverage */
            alertCrawl = alertCrawl + " " + data.features[i].properties.description.replace("...", " ");

            alerts[i] = data.features[i].properties.event
          }
        }
        if(alertCrawl != ""){
          CONFIG.crawl = alertCrawl;
        }
        alertsActive = alerts.length > 0;
        fetchForecast();
      });
    })
}

function fetchForecast(){
  fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/forecast/daily/10day.json?language=${CONFIG.language}&units=${CONFIG.units}&apiKey=${CONFIG.secrets.twcAPIKey}`)
    .then(function(response) {
      if (response.status !== 200) {
        console.log('forecast request error');
        return;
      }
      response.json().then(function(data) {
        let forecasts = data.forecasts
        // narratives
        isDay = forecasts[0].day; // If the API spits out a day forecast, use the day timings
        let ns = []
        ns.push(forecasts[0].day || forecasts[0].night); // there must be a day forecast so if the API doesn't provide one, just make it the night one. It won't show anyway.
        ns.push(forecasts[0].night);
        ns.push(forecasts[1].day);
        ns.push(forecasts[1].night);
        for (let i = 0; i <= 3; i++) {
          let n = ns[i]
          forecastTemp[i] = n.temp
          forecastIcon[i] = n.icon_code
          forecastNarrative[i] = n.narrative
          forecastPrecip[i] = `${n.pop}% Chance<br/> of ${n.precip_type.charAt(0).toUpperCase() + n.precip_type.substr(1).toLowerCase()}`
        }
        // 7 day outlook
        for (var i = 0; i < 7; i++) {
          let fc = forecasts[i+1]
          outlookHigh[i] = fc.max_temp
          outlookLow[i] = fc.min_temp
          outlookCondition[i] = (fc.day ? fc.day : fc.night).phrase_32char.split(' ').join('<br/>')
          // thunderstorm doesn't fit in the 7 day outlook boxes
          // so I multilined it similar to that of the original
          outlookCondition[i] = outlookCondition[i].replace("Thunderstorm", "Thunder</br>storm");
          outlookIcon[i] = (fc.day ? fc.day : fc.night).icon_code
        }
        fetchRadarImages();
      })
    })
}

function fetchCurrentWeather(){

  //Let's check what we're dealing with
  let location = "";
  console.log(CONFIG.locationMode)
  if(CONFIG.locationMode=="POSTAL") {location=`postalKey=${zipCode}:${CONFIG.countryCode}`}
  else if (CONFIG.locationMode=="AIRPORT") {
    //Determine whether this is an IATA or ICAO code
    let airportCodeLength=airportCode.length;
    if(airportCodeLength==3){location=`iataCode=${airportCode}`}
    else if (airportCodeLength==4){location=`icaoCode=${airportCode}`}
    else {
      alert("Please enter a valid ICAO or IATA Code")
      console.error(`Expected Airport Code Lenght to be 3 or 4 but was ${airportCodeLength}`)
      return;
    }
  }
  else {
    alert("Please select a location type");
    console.error("Unknown what to use for location")
    return;
  }
  

  fetch(`https://api.weather.com/v3/location/point?${location}&language=${CONFIG.language}&format=json&apiKey=${CONFIG.secrets.twcAPIKey}`)
      .then(function (response) {
          if (response.status == 404) {
              alert("Location not found!")
              console.log('conditions request error');
              return;
          }
          if (response.status !== 200) {
              alert("Something went wrong (check the console)")
              console.log('conditions request error');
              return;
          }
      response.json().then(function(data) {
        try {
          // which LOCALE?!
          //Not sure about the acuracy of this. Remove this if necessary
          if(CONFIG.locationMode=="AIRPORT"){
            cityName = data.location.airportName
            .toUpperCase() //Airport names are long
            .replace("INTERNATIONAL","INTL.") //If a city name is too long, info bar breaks
            .replace("AIRPORT","") //This is an attempt to fix it
            .trim();
            console.log(cityName);
          } else {
            //Shouldn't City Name be the field City Name, not Display Name?
            cityName = data.location.city.toUpperCase();
          }
          latitude = data.location.latitude;
          longitude = data.location.longitude;
        } catch (err) {
          alert('Enter valid ZIP code');
          console.error(err)
          getZipCodeFromUser();
          return;
        }
        fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/observations/current.json?language=${CONFIG.language}&units=${CONFIG.units}&apiKey=${CONFIG.secrets.twcAPIKey}`)
          .then(function(response) {
            if (response.status !== 200) {
              console.log("conditions request error");
              return;
            }
            response.json().then(function(data) {
              // cityName is set in the above fetch call and not this one
              let unit = data.observation[CONFIG.unitField];
              currentTemperature = Math.round(unit.temp);
              currentCondition = data.observation.phrase_32char;
              windSpeed = `${data.observation.wdir_cardinal} ${unit.wspd} ${CONFIG.units === 'm' ? 'km/h' : 'mph'}`;
              gusts = unit.gust || 'NONE';
              feelsLike = unit.feels_like
              visibility = Math.round(unit.vis)
              humidity = unit.rh
              dewPoint = unit.dewpt
              pressure = unit.altimeter.toPrecision(4);
              let ptendCode = data.observation.ptend_code
              pressureTrend = (ptendCode == 1 || ptendCode == 3) ? '▲' : ptendCode == 0 ? '' : '▼'; // if ptendCode == 1 or 3 (rising/rising rapidly) up arrow else its steady then nothing else (falling (rapidly)) down arrow
              currentIcon = data.observation.icon_code
              fetchAlerts();
            });
          });
      })
    });


}

function fetchRadarImages(){
  radarImage = document.createElement("iframe");
  radarImage.onerror = function () {
    getElement('radar-container').style.display = 'none';
  }

  mapSettings = btoa(JSON.stringify({
    "agenda": {
      "id": "weather",
      "center": [longitude, latitude],
      "location": null,
      "zoom": 10
    },
    "animating": true,
    "base": "standard",
    "artcc": false,
    "county": false,
    "cwa": false,
    "rfc": false,
    "state": false,
    "menu": false,
    "shortFusedOnly": false,
    "opacity": {
      "alerts": 0.0,
      "local": 0.0,
      "localStations": 0.0,
      "national": 0.6
    }
  }));
  
  radarImage.setAttribute("src", "https://kaosfactor.github.io/radar/radar.html");
  radarImage.style.width = "1239px"
  radarImage.style.height = "1200px"
  radarImage.style.marginTop = "-670px"
  radarImage.style.overflow = "hidden"




  //radarImage.setAttribute("src", "https://radar.weather.gov/?settings=v1_" + mapSettings);
  //radarImage.style.width = "1230px"
  //radarImage.style.height = "740px"
  //radarImage.style.marginTop = "-220px"
  //radarImage.style.overflow = "hidden"
  
  if(alertsActive){
    zoomedRadarImage = new Image();
    zoomedRadarImage.onerror = function () {
      getElement('zoomed-radar-container').style.display = 'none';
    }

    zoomedRadarImage = document.createElement("iframe");
    zoomedRadarImage.onerror = function () {
      getElement('zoomed-radar-container').style.display = 'none';
    }
  
    mapSettings = btoa(JSON.stringify({
      "agenda": {
        "id": "weather",
        "center": [longitude, latitude],
        "location": null,
        "zoom": 10
      },
      "animating": true,
      "base": "standard",
      "artcc": false,
      "county": false,
      "cwa": false,
      "rfc": false,
      "state": false,
      "menu": false,
      "shortFusedOnly": false,
      "opacity": {
        "alerts": 0.0,
        "local": 0.0,
        "localStations": 0.0,
        "national": 0.6
      }
    }));
    
   zoomedRadarImage.setAttribute("src", "https://kaosfactor.github.io/radar/radar1.html");
   zoomedRadarImage.style.width = "1239px"
   zoomedRadarImage.style.height = "1200px"
   zoomedRadarImage.style.marginTop = "-370px"
   zoomedRadarImage.style.overflow = "hidden"



    //zoomedRadarImage.setAttribute("src", "https://radar.weather.gov/?settings=v1_" + mapSettings);
    //zoomedRadarImage.style.width = "1230px"
    //zoomedRadarImage.style.height = "740px"
    //zoomedRadarImage.style.marginTop = "-220px"
    //zoomedRadarImage.style.overflow = "hidden"

  }

  scheduleTimeline();
      // set up API credentials
      mapboxgl.accessToken = "pk.eyJ1IjoiYmxhcmsiLCJhIjoiY2plaGZmaGR1MGZ3cTJ3bzZ6OHp5OGZzYyJ9.5dVrsWJk208YPShD-0HLsQ";
      const twcApiKey = "e1f10a1e78da46f5b10a1e78da96f525";

      // set up a promise for The Weather Company product metadata
      const timeSlices = fetch(
        "https://api.weather.com/v3/TileServer/series/productSet/PPAcore?apiKey=" +
          twcApiKey
      );

      // set DOM elements for the current conditions info
      const weatherWidget = document.getElementById("weather");
      const cityName = document.getElementById("city-name");
      const temp = document.getElementById("temp");
      const conditions = document.getElementById("conditions");

      // set up map and geocoder control
      const map = new mapboxgl.Map({
        container: "map", // container id
        style: "mapbox://styles/mapbox/streets-v11", // style URL
        center: [longitude, latitude], // starting position [lng, lat]
        zoom: 8, // starting zoom
      });

      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
      });

      map.addControl(geocoder);

      // this function resolves the metadata promise,
      // extracts the most recent publish time for radar data,
      // and adds the radar layer to the map
      const addRadarLayer = () => {
        timeSlices
          .then((res) => res.json())
          .then((res) => {
            const radarTimeSlices = res.seriesInfo.radar.series;
            const latestTimeSlice = radarTimeSlices[0].ts;

            // insert the latest time for radar into the source data URL
            map.addSource("twcRadar", {
              type: "raster",
              tiles: [
                "https://api.weather.com/v3/TileServer/tile/radar?ts=" +
                  latestTimeSlice +
                  "&xyz={x}:{y}:{z}&apiKey=" +
                  twcApiKey,
              ],
              tileSize: 256,
            });

            // place the layer before the "aeroway-line" layer
            map.addLayer(
              {
                id: "radar",
                type: "raster",
                source: "twcRadar",
                paint: {
                  "raster-opacity": 0.5,
                },
              },
              "aeroway-line"
            );
          });
      };

      // this function gets the current conditions
      // and displays data from the respons in the
      // DOM elements extracted above
      const getCurrentConditions = (e) => {
        // saving data from the Mapbox Search response
        const cityNameText = e.result.text;
        const longitude = e.result.geometry.coordinates[0];
        const latitude = e.result.geometry.coordinates[1];

        // set up the observations endpoint request URL
        // with the Search result coordinates
        const currentConditionsURL =
          "https://api.weather.com/v1/geocode/" +
          latitude +
          "/" +
          longitude +
          "/observations.json?language=en-US&units=e&apiKey=" +
          twcApiKey;

        fetch(currentConditionsURL)
          .then((res) => res.json())
          .then((res) => {
            const tempText = res.observation.temp;
            const conditionsText = res.observation.wx_phrase;

            weatherWidget.style.visibility = "visible";
            cityName.innerText = cityNameText;
            temp.innerText = tempText;
            conditions.innerText = conditionsText;
          });
      };

      map.on("load", () => {
        addRadarLayer();
      });

      geocoder.on("result", (e) => {
        getCurrentConditions(e);
      });

  scheduleTimeline();
}


