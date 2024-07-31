

/////////////////////////////////////////////////////////






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
    }

  }));
  
  
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
      }
    }));
  }




  scheduleTimeline();
  //window.location.href = "https://radar.weather.gov/?settings=v1_"+mapSettings;

 
const frameCount = 10; // total intervals
const startMinutes = -60; // start time offset relative to now, where negative means past
const endMinutes = 0;

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmxhcmsiLCJhIjoiY2plaGZmaGR1MGZ3cTJ3bzZ6OHp5OGZzYyJ9.5dVrsWJk208YPShD-0HLsQ';
const AERIS_ID = 'wgE96YE3scTQLKjnqiMsv';
const AERIS_KEY = 'SVG2gQFV8y9DjKR0BRY9wPoSLvrMrIqF9Lq2IYaY';
const NUM_COLORS = '256'; // set to empty string for true color png
const TILE_SIZE = 256;

// layer to include on the map
// uncomment more layers or add more!
const layers = [
 	//'land-terrain',
    'alerts:50',
    //'satellite',
    'radar:75:blur(0)',
    //'stormcells',
	//'radar-global',
	//'satellite-infrared-color',
	//'stormreports',
	//'lightning-strike-density',
	//'lightning-strikes-5m-icons',
	//'lightning-flash-5m-icons',
	//'temperatures-text',
	//'dew-points-text',
	//'fires-obs-points',
	//'surface-analysis-pressure-text',
	//'surface-analysis-fronts',
	//'fradar'

];

function getTilePath(server, interval) {
	return `https://maps${server}.aerisapi.com/${AERIS_ID}_${AERIS_KEY}/${layers.join(',')}/{z}/{x}/{y}/${interval}min.png${NUM_COLORS}`;
}



// Create the Mapbox map instance
mapboxgl.accessToken = 'pk.eyJ1IjoiYmxhcmsiLCJhIjoiY2plaGZmaGR1MGZ3cTJ3bzZ6OHp5OGZzYyJ9.5dVrsWJk208YPShD-0HLsQ';
const map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/streets-v11',
	center: [longitude, latitude],
	zoom: 9,
	projection: 'mercator'
});



function addRasterLayer(map, interval, opacity = 0) {
	const id = `amp-${layers.join('::')}-${interval}`;
	map.addSource(id, {
		type: 'raster',
		tiles: [1, 2, 3, 4].map((s) => getTilePath(s, interval)),
		tileSize: TILE_SIZE,
		attribution: '<a href="https://www.aerisweather.com/">Xweather</a>'
	});
	map.addLayer({
		id, 
		type: 'raster',
		source: id,
		minzoom: 0,
		maxzoom: 22,
		paint: {
			'raster-opacity': opacity,
			'raster-opacity-transition': {
				duration: 0,
				delay: 0
			}
		}
	});

	return id;
}

function setRasterLayerOpacity(map, id, opacity) {
	map.setPaintProperty(id, 'raster-opacity', opacity);
}

map.on('load', () => {
	const interval = (endMinutes - startMinutes) / frameCount;
	// set up the animation frames and layers
	const frames = [];
	for (let i = 0; i < frameCount; i += 1) {
		const opacity = (i === 0) ? 1 : 0;
		const timeOffset = startMinutes + interval * i;
		const id = addRasterLayer(map, timeOffset, opacity);
		frames.push(id);
	}



	// wait time determines how long to wait and allow frames to load before
	// beginning animation playback
	const waitTime = 0;

	// step time determines the time in milliseconds each frame holds before advancing
	const stepTime = 1000;

	let currentOffset = 0;
	let previousOffset = currentOffset;

	setTimeout(() => {
		setInterval(() => {
			previousOffset = currentOffset;
			currentOffset += 1;
			if (currentOffset === frames.length - 1) {
				currentOffset = 0;
			}
			setRasterLayerOpacity(map, frames[previousOffset], 0);
			setRasterLayerOpacity(map, frames[currentOffset], 1);
		}, stepTime);
	}, waitTime);
});

map.setView(e.latlng, map.getZoom(), {
  "animate": true,
  "pan": {
    "duration": 10
  }
});
 



}



//////////////////////////////////////










