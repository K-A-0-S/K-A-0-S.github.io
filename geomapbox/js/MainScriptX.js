


// Preset timeline sequences
const MORNING = [{name: "Now", subpages: [{name: "current-page", duration: 9000}, {name: "radar-page", duration: 12000}]},{name: "Today", subpages: [{name: "today-page", duration: 10000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 10000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 10000}, {name: "7day-page", duration: 10000}]},]
const NIGHT = [{name: "Now", subpages: [{name: "current-page", duration: 9000}, {name: "radar-page", duration: 12000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 10000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 10000}, {name: "tomorrow-night-page", duration: 10000}, {name: "7day-page", duration: 10000}]},]
const SINGLE = [{name: "Alert", subpages: [{name: "single-alert-page", duration: 7000}]},{name: "Now", subpages: [{name: "current-page", duration: 8000}, {name: "radar-page", duration: 12000}, {name: "zoomed-radar-page", duration: 11000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 8000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 8000}, {name: "7day-page", duration: 10000}]},]
const MULTIPLE = [{name: "Alerts", subpages: [{name: "multiple-alerts-page", duration: 7000}]},{name: "Now", subpages: [{name: "current-page", duration: 8000}, {name: "radar-page", duration: 12000}, {name: "zoomed-radar-page", duration: 11000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 8000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 8000}, {name: "7day-page", duration: 10000}]},]
const WEEKDAY = ["SUN",  "MON", "TUES", "WED", "THU", "FRI", "SAT"];



window.onload = function () {

  CONFIG.addLocationOption('airport-code', 'Airport', 'ATL or KATL')
  CONFIG.addLocationOption('zip-code', 'Postal', '00000')


  CONFIG.load();
  //preLoadMusic();
  setMainBackground();
  resizeWindow();
  setClockTime();
  if (!CONFIG.loop) {
    getElement("settings-container").style.display = 'block';
    guessZipCode();
  }
}






function scheduleTimeline(){

  setInformation();
}


function setInformation(){

  hideSettings();

}

function setMainBackground(){
  getElement('background-image');
}

function hideSettings(){
  // Animate settings prompt out
  getElement('settings-prompt').classList.add('hide');
  getElement('settings-container').style.pointerEvents = 'none';

}


function setClockTime(){

}

const baseSize = {
    w: 1,
    h: 1
}


window.onresize = resizeWindow;
function resizeWindow(){
  var ww = window.innerWidth;
  var wh = window.innerHeight;
  var newScale = 1;

  // compare ratios
  if(ww/wh < baseSize.w/baseSize.h) { // tall ratio
      newScale = ww / baseSize.w;
  } else { // wide ratio
      newScale = wh / baseSize.h;
  }

  getElement('render-frame').style.transform = 'scale(' + newScale + ',' +  newScale + ')';
}

function getElement(id){
  return document.getElementById(id);
}











