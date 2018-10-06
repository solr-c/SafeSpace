
//   var config = {
//     apiKey: "AIzaSyBvoP1Ymio1QdAedieiC_LRXV4hTuapJZQ",
//     authDomain: "yanproject-1.firebaseapp.com",
//     databaseURL: "https://yanproject-1.firebaseio.com",
//     projectId: "yanproject-1",
//     storageBucket: "yanproject-1.appspot.com",
//     messagingSenderId: "4976412073"
//   };
//   firebase.initializeApp(config);
//   var database = firebase.database();

var limit = 1000;
var searchCoords = null; //global for the coordinates of the searched address
var shootingResponse = null; //this is a global var for shooting response


//function to get records for shooting history with two parameters(lattitude and longtitude)
function getShootingRecords(srcLat, srcLng) {
    console.log("shooting lat/long = " + srcLat + "/" + srcLng);
    records = []; //empty  array for records
    var queryURL = "https://www.dallasopendata.com/resource/s3jz-d6pf.json?$limit=" + limit + "&$$app_token=kDCDojjY922O36hyR8W6vQ2nl";

    // make the ajax query sync so that we can hang the response on the global to process in a function.
    $.ajax({
        url: queryURL,
        method: "GET",
        async: false,
        success: function (response) {
            shootingResponse = response;
        }
    });

    // loop the response data from JSON
    for (i = 0; i < shootingResponse.length; i++) {
        //console.log(shootingResponse[i]);

        var coords = null;

        //if the address has no geolocatin, get the lattitude and longtitude and convert to the nearest street location
        if (!shootingResponse[i].geolocation) {
            coords = getCoordinates(shootingResponse[i].location + " Dallas, TX");
            //console.log("found Coords: " + coords.lat + "/" + coords.lng);
        }
        else {
            //object that has the properties of lattitute and longitude from geolocation coordinates
            coords = {
                lat: shootingResponse[i].geolocation.coordinates[0],
                lng: shootingResponse[i].geolocation.coordinates[1]
            }
            //console.log("got Coords: " + coords.lat + "/" + coords.lng);
        }


        if (areCoordsWithinRegion(srcLat, srcLng, coords, 15)) {
            console.log("found one " + coords.lat + "/" + coords.lng);
            records.push({
                coords: coords,
                incident: shootingResponse[i]
            });
        }
    }

    return records;

}

var currentCalls = null;
function getCurrentCalls(srcLat, srcLng) {
    console.log("current lat/long = " + srcLat + "/" + srcLng);
    records = [];
    var queryURL = "https://www.dallasopendata.com/resource/are8-xahz.json?$limit=" + limit + "&$$app_token=kDCDojjY922O36hyR8W6vQ2nl";

    $.ajax({
        url: queryURL,
        method: "GET",
        async: false,
        success: function (response) {
            currentCalls = response;
        }
    });

    for (i = 0; i < currentCalls.length; i++) {
        console.log(currentCalls[i]);

        var address = "";
        if (currentCalls[i].block) {
            address += currentCalls[i].block + " ";
        }

        address += currentCalls[i].location + " Dallas, TX";

        var coords = getCoordinates(address);

        if (areCoordsWithinRegion(srcLat, srcLng, coords, 15)) {
            console.log("found one " + coords.lat + "/" + coords.lng);
            records.push({
                coords: coords,
                incident: currentCalls[i]
            });
        }
    }

    return records;
}


//function to point within X miles of the other point

function areCoordsWithinRegion(srcLat, srcLng, targetCoords, range) {
    return distance(srcLat, srcLng, targetCoords.lat, targetCoords.lng, "M") <= range;

}

//  function takes two coordinates and tells you the distance in miles between them.
// distance function is a bunch of crazy math. basically, it takes two global coordinates and does a bunch of geometer to tell you how many miles, it is crazy geometry because the distance changes based upon how high up or down on the globe you are.
function distance(lat1, lon1, lat2, lon2, unit) {
    var radlat1 = Math.PI * lat1 / 180
    var radlat2 = Math.PI * lat2 / 180
    var theta = lon1 - lon2
    var radtheta = Math.PI * theta / 180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
        dist = 1;
    }
    dist = Math.acos(dist)
    dist = dist * 180 / Math.PI
    dist = dist * 60 * 1.1515
    if (unit == "K") { dist = dist * 1.609344 }
    if (unit == "N") { dist = dist * 0.8684 }
    return dist
}

// this is to add a mark to the location that user search location including the lattitude and longtitude
function addLocationMark(lat, lng) {

    $(function () {

        $("#map").addMarker({
            coords: [lat, lng], // GPS coords
            title: "Search Location",
            // icon: "assets/images/map_mark_small.png",
            animation: google.maps.Animation.DROP
        });
    })
}

function addMark(lat, lng, title, txt, icon) {
    $(function () {

        $("#map").addMarker({
            coords: [lat, lng], // GPS coords
            title: title, // Title
            text: txt, // HTML content
            animation: google.maps.Animation.DROP,
            icon: icon

        });
    })
}

function centerMap(lat, lng) {
    $(function () {
        $("#map").googleMap({
            zoom: 10, // Initial zoom level (optional)
            coords: [lat, lng], // Map center (optional)
            type: "ROADMAP" // Map type (optional)
        });
    });
}
$("#formSubmit").on("click", function (event) {
    event.preventDefault();
    var street = $("#streetName-input").val().trim();
    var city = $("#city-input").val().trim();
    var state = $("#state-input").val().trim();
    var zipCode = $("#zipCode-input").val().trim();
    console.log("Shooting: " + street, city, state, zipCode);
    searchCoords = getCoordinates(street + " " + city + ", " + state + " " + zipCode);
    // console.log(search)
    // console.log("Shooting: " + street, city, state, zipCode));
    // var coords = getCoordinates(street, city, state, zipCode);

    centerMap(searchCoords.lat, searchCoords.lng);
    addLocationMark(searchCoords.lat, searchCoords.lng);


})


$("#shootingButton").on("click", function (e) {
    e.preventDefault();
    var street = $("#streetName-input").val().trim();
    var city = $("#city-input").val().trim();
    var state = $("#state-input").val().trim();
    var zipCode = $("#zipCode-input").val().trim();
    console.log("Shooting: " + street + city + state + zipCode);
    //searchCoords  = getCoordinates(street + " " + city + ", " + state + " " + zipCode);

    var recs = getShootingRecords(searchCoords.lat, searchCoords.lng);

    centerMap(searchCoords.lat, searchCoords.lng);
    addLocationMark(searchCoords.lat, searchCoords.lng);

    var container = $("#shootingTab");
    var createP = $("<p>");
    createP.addClass("shooting");
    createP.html("Shooting: " + street + " " + city + ", " + state + " " + zipCode);

    container.append(createP);


    for (i = 0; i < recs.length; i++) {

        var html = "<p>Date: " + recs[i].incident.date +
            "</p><p>Suspect: " + recs[i].incident.suspect_s +
            "</p><p>Weapon: " + recs[i].incident.suspect_weapon +
            "</p><p>Result: " + recs[i].incident.suspect_deceased_injured_or_shoot_and_miss + "</p>";


            var caseMo = recs[i].incident.date_time ;
            var name = recs[i].incident.suspect_s;
            var offense = recs[i].incident.suspect_weapon ;
            var date = recs[i].incident.suspect_deceased_injured_or_shoot_and_miss 
    
    
            var container = $("#crimeTabs");
            var createP = $("<p>");
            createP.addClass("address");
            createP.html(offense + "<br />" + date + "<br />" + name + "<br />" + caseMo);
    
            container.append(createP);


        addMark(recs[i].coords.lat, recs[i].coords.lng, recs[i].incident.case, html, "assets/images/icons8-shooting-40.png");
    }
});

$("#callsButton").on("click", function (e) {
    e.preventDefault();
    var street = $("#streetName-input").val().trim();
    var city = $("#city-input").val().trim();
    var state = $("#state-input").val().trim();
    var zipCode = $("#zipCode-input").val().trim();
    console.log("Current: " + street + " " + city + ", " + state + " " + zipCode);
    var coords = getCoordinates(street + " " + city + ", " + state + " " + zipCode);

    var recs = getCurrentCalls(coords.lat, coords.lng);

    centerMap(coords.lat, coords.lng);
    addLocationMark(coords.lat, coords.lng);

    var container = $("#callsTab");
    var createP = $("<p>");
    createP.addClass("calls");
    createP.html("Current: " + street + " " + city + ", " + state + " " + zipCode);

    container.append(createP);

    for (i = 0; i < recs.length; i++) {
        var html = "<p>Date: " + recs[i].incident.date_time +
            "</p><p>Priority: " + recs[i].incident.priority +
            "</p><p>Unit: " + recs[i].incident.unit_number +
            "</p><p>Status: " + recs[i].incident.status + "</p>";



     
            var caseMo = recs[i].incident.date_time ;
            var name = recs[i].incident.priority;
            var offense = recs[i].incident.unit_number;
            var date = recs[i].incident.status
    
    
            var container = $("#crimeTabs");
            var createP = $("<p>");
            createP.addClass("address");
            createP.html(offense + "<br />" + date + "<br />" + name + "<br />" + caseMo);
    
            container.append(createP);



        addMark(recs[i].coords.lat, recs[i].coords.lng, recs[i].incident.nature_of_call, html, "");
    }
});


function getIcon(crime) {
    var img = "";
    var root = "assets/images/";
    if (crime == "DRUNKENNESS") {
        img = root + "icons8-drunk-48.png";
    } else if (crime == "LARCENY/ THEFT OFFENSES") {
        img = root + "icons8-bandit-filled-50.png";
    } else if (crime == "MISCELLANEOUS") {
        img = root + "";
    } else if (crime == "ROBBERY") {
        img = root + "icons8-burglary-48.png";
    }



    return img;
}

var lastResp = null;

function getCoordinates(address) {
    console.log("converting: " + address);
    var queryURL = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDlLaXHzolEt6dE-_eZi6llI_m5uRKQu-c&address=" + address;
    var lat = 0;
    var lng = 0;
    lastResp = null;
    $.ajax
        ({
            type: "GET",
            url: queryURL,
            async: false,
            success: function (response) {
                lastResp = response;
            }
        });

    //console.log(JSON.stringify(lastResp));
    if (lastResp.status == "ZERO_RESULTS") {
        lat = 0;
        lng = 0;
    }
    else {
        lat = lastResp.results[0].geometry.location.lat;
        lng = lastResp.results[0].geometry.location.lng;
    }

    return { lat: lat, lng: lng };
}

// $("#crimeButton").on("click", function (event) {
//     event.preventDefault();
//     var 
//     // $("#shootingButton").hide();
//     // $("#callsButton").hide();
//     crimeHistory();
// })

$("#crimeButton").on("click", function (e) {
    e.preventDefault();
    console.log("crime button");
    var street = $("#streetName-input").val().trim();
    var city = $("#city-input").val().trim();
    var state = $("#state-input").val().trim();
    var zipCode = $("#zipCode-input").val().trim();
    console.log("Crime: " + street + " " + city + ", " + state + " " + zipCode);
    var coords = getCoordinates(street + " " + city + ", " + state + " " + zipCode);

    var recs = crimeHistory(coords.lat, coords.lng);

    centerMap(coords.lat, coords.lng);
    addLocationMark(coords.lat, coords.lng);

    var container = $("#shootingTab");
    var createP = $("<p>");
    createP.addClass("shooting");
    createP.html("Shooting: " + street + " " + city + ", " + state + " " + zipCode);

    container.append(createP);


    for (i = 0; i < recs.length; i++) {

        var html = "<p>Date: " + recs[i].incident.upzdate +
            "</p><p>Suspect: " + recs[i].incident.ro1name +
            "</p><p>Status: " + recs[i].incident.status +
            "</p><p>Result: " + recs[i].incident.offincident + "</p>";

        var crimeAddress = crimeIncident[i].geocoded_column_address + " " + crimeIncident[i].geocoded_column_city + " " + crimeIncident[i].geocoded_column_state + " " + crimeIncident[i].geocoded_column_zip;

        var address = crimeAddress;
        var caseMo = crimeIncident[i].mo;
        var name = crimeIncident[i].ro1name;
        var offense = crimeIncident[i].nibrs_crime_category;
        var date = crimeIncident[i].reporteddate;


        var container = $("#crimeTabs");
        var createP = $("<p>");
        createP.addClass("address");
        createP.html(offense + "<br />" + address + "<br />" + date + "<br />" + name + "<br />" + caseMo);

        container.append(createP);




        addMark(recs[i].coords.lat, recs[i].coords.lng, recs[i].incident.day1 + "-" + recs[i].incident.day2, html, getIcon(recs[i].incident.nibrs_crime_category));

    }
});

var crimeIncident = null;
function crimeHistory(srcLat, srcLng) {

    var history = [];
    var queryUrl = "https://www.dallasopendata.com/resource/9s22-2qus.json?$limit=4000&$$app_token=kDCDojjY922O36hyR8W6vQ2nl&$order=edate%20DESC";

    $.ajax({
        url: queryUrl,
        method: "GET",
        async: false,
        success: function (response) {
            crimeIncident = response;

        }
    });

    for (i = 0; i < crimeIncident.length; i++) {


        var coords = null;

        console.log(crimeIncident[i].nibrs_crime_category)

        if (!crimeIncident[i].geocoded_column) {
            coords =
                coords = getCoordinates(crimeIncident[i].comphaddress + " Dallas, TX");
            console.log("found fucking coords! " + coords.lat + "/" + coords.lng);

        } else {
            coords = {
                lat: crimeIncident[i].geocoded_column.coordinates[0],
                lng: crimeIncident[i].geocoded_column.coordinates[1],
            }
            console.log("got coords: " + coords.lat + "/" + coords.lng);
        }

        if (areCoordsWithinRegion(srcLat, srcLng, coords, 15)) {
            history.push({
                coords: coords,
                incident: crimeIncident[i]
            });
        }

    }

    return history;
}



var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 32.7766642, lng: -96.79698789999999 },
        zoom: 10,
        mapTypeId: 'terrain'

    });

    marker = new google.maps.Marker({
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        position: { lat: 32.7766642, lng: -96.79698789999999 }
    });
    marker.addListener('click', toggleBounce);
}
function toggleBounce() {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

// google.maps.event.addListener(marker, 'click', function () {
//     // do something with this marker ...
//     var id = this.getId();

//     scrollToIncident(id); // you need to write the function
// });

// var neighborhoods = [
//     { lat: 52.511, lng: 13.447 },
//     { lat: 52.549, lng: 13.422 },
//     { lat: 52.497, lng: 13.396 },
//     { lat: 52.517, lng: 13.394 }
// ];

// var markers = [];
// var map;

// function initMap() {
//     map = new google.maps.Map(document.getElementById('map'), {
//         zoom: 12,
//         center: { lat: 52.520, lng: 13.410 }
//     });
// }

// function drop() {
//     clearMarkers();
//     for (var i = 0; i < neighborhoods.length; i++) {
//         addMarkerWithTimeout(neighborhoods[i], i * 200);
//     }
// }

// function addMarkerWithTimeout(position, timeout) {
//     window.setTimeout(function () {
//         markers.push(new google.maps.Marker({
//             position: position,
//             map: map,
//             animation: google.maps.Animation.DROP
//         }));
//     }, timeout);
// }

// function clearMarkers() {
//     for (var i = 0; i < markers.length; i++) {
//         markers[i].setMap(null);
//     }
//     markers = [];