
var shootingResponse = null; //this is a global var for shooting response


//function to get records for shooting history with two parameters(lattitude and longtitude)
function getShootingRecords(srcLat, srcLng) {
    console.log("shooting lat/long = " + srcLat + "/" + srcLng);
    records = []; //empty  array for records
    var queryURL = "https://www.dallasopendata.com/resource/s3jz-d6pf.json?$limit=5000&$$app_token=kDCDojjY922O36hyR8W6vQ2nl";

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
        console.log(shootingResponse[i]);

        var coords = null;

        //if the address has no geolocatin, get the lattitude and longtitude and convert to the nearest street location
        if (!shootingResponse[i].geolocation) {
            coords = getCoordinates(shootingResponse[i].location + " Dallas, TX");
            console.log("found Coords: " + coords.lat + "/" + coords.lng);
        }
        else {
            //object that has the properties of lattitute and longitude from geolocation coordinates
            coords = {
                lat: shootingResponse[i].geolocation.coordinates[0],
                lng: shootingResponse[i].geolocation.coordinates[1]
            }
            console.log("got Coords: " + coords.lat + "/" + coords.lng);
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
    var queryURL = "https://www.dallasopendata.com/resource/are8-xahz.json?$limit=100&$$app_token=kDCDojjY922O36hyR8W6vQ2nl";

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


// function with 4 parameters. This checks to see if the target coordinates are no further
// away from the source than the range. Range will be added to lat and long
// function areCoordsWithinRegion(srcLat, srcLng, targetCoords, range) {

//     return (targetCoords.lat < srcLat + range &&
//         targetCoords.lat > srcLat - range &&
//         targetCoords.lng < srcLng + range &&
//         targetCoords.lng > srcLng - range);

// }

//function to point within X miles of the other point

function areCoordsWithinRegion(srcLat, srcLng, targetCoords, range) {
    return distance(srcLat, srcLng, targetCoords.lat, targetCoords.lng, "M") <= range;
   
}

//  function takes two coordinates and tells you the distance in miles between them.
// distance function is a bunch of crazy math. basically, it takes two global coordinates and does a bunch of geometer to tell you how many miles, it is crazy geometry because the distance changes based upon how high up or down on the globe you are.
function distance(lat1, lon1, lat2, lon2, unit) {
    var radlat1 = Math.PI * lat1/180
    var radlat2 = Math.PI * lat2/180
    var theta = lon1-lon2
    var radtheta = Math.PI * theta/180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
        dist = 1;
    }
    dist = Math.acos(dist)
    dist = dist * 180/Math.PI
    dist = dist * 60 * 1.1515
    if (unit=="K") { dist = dist * 1.609344 }
    if (unit=="N") { dist = dist * 0.8684 }
    return dist
}

// this is to add a mark to the location that user search location including the lattitude and longtitude
function addLocationMark(lat, lng) {

    $(function () {

        $("#map").addMarker({
            coords: [lat, lng], // GPS coords
            title: "Search Location"
        });
    })
}

function addMark(lat, lng, title, txt) {
    $(function () {

        $("#map").addMarker({
            coords: [lat, lng], // GPS coords
            title: title, // Title
            text: txt,// HTML content
            icon: "assets/images/icons8-shooting-30.png"
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
$("#search").on("click", function (e) {
    e.preventDefault();
    var search = $("#map-input").val().trim();
    console.log("Shooting: " + search);
    var coords = getCoordinates(search);

    centerMap(coords.lat, coords.lng);
    addLocationMark(coords.lat, coords.lng);


})


$("#shootings").on("click", function (e) {
    e.preventDefault();
    var search = $("#map-input").val().trim();
    console.log("Shooting: " + search);
    var coords = getCoordinates(search);

    var recs = getShootingRecords(coords.lat, coords.lng);

    centerMap(coords.lat, coords.lng);
    addLocationMark(coords.lat, coords.lng);

    for (i = 0; i < recs.length; i++) {

        var html = "<p>Date: " + recs[i].incident.date +
            "</p><p>Suspect: " + recs[i].incident.suspect_s +
            "</p><p>Weapon: " + recs[i].incident.suspect_weapon +
            "</p><p>Result: " + recs[i].incident.suspect_deceased_injured_or_shoot_and_miss + "</p>";

        addMark(recs[i].coords.lat, recs[i].coords.lng, recs[i].incident.case, html);
    }
});

$("#current").on("click", function () {
    var search = $("#map-input").val().trim();
    console.log("Current: " + search);
    var coords = getCoordinates(search);

    var recs = getCurrentCalls(coords.lat, coords.lng);

    centerMap(coords.lat, coords.lng);
    addLocationMark(coords.lat, coords.lng);

    for (i = 0; i < recs.length; i++) {
        var html = "<p>Date: " + recs[i].incident.date_time +
            "</p><p>Priority: " + recs[i].incident.priority +
            "</p><p>Unit: " + recs[i].incident.unit_number +
            "</p><p>Status: " + recs[i].incident.status + "</p>";

        addMark(recs[i].coords.lat, recs[i].coords.lng, recs[i].incident.nature_of_call, html);
    }
});




var lastResp = null;

function getCoordinates(address) {
    console.log("converting: " + address);
    var queryURL = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDlLaXHzolEt6dE-_eZi6llI_m5uRKQu-c&address=" + address;
    var lat = 0;
    var lng = 0;

    $.ajax
        ({
            type: "GET",
            url: queryURL,
            async: false,
            success: function (response) {
                lastResp = response;
            }
        });

    lat = lastResp.results[0].geometry.location.lat;
    lng = lastResp.results[0].geometry.location.lng;

    return { lat: lat, lng: lng };
}

$("#crime").on("click", function (event) {
    event.preventDefault();
    $("#shootings").hide();
    $("#current").hide();
    crimeHistory();
})

var crimeIncident = null;
function crimeHistory() {
    var history = [];
    var queryUrl = "https://www.dallasopendata.com/resource/9s22-2qus.json?$limit=500&$$app_token=kDCDojjY922O36hyR8W6vQ2nl&$order=edate%20DESC";

    $.ajax({
        url: queryUrl,
        method: "GET",
        async: false,
        success: function (response) {
            crimeIncident = response;
        }
    });

    for (i = 0; i < crimeIncident.length; i++) {
        var crimeAddress = crimeIncident[i].geocoded_column_address + " " + crimeIncident[i].geocoded_column_city + " " + crimeIncident[i].geocoded_column_state + " " + crimeIncident[i].geocoded_column_zip;

        var address = crimeAddress;
        var caseMo = crimeIncident[i].mo;
        var name = crimeIncident[i].ro1name;
        var offense = crimeIncident[i].nibrs_crime_category;
        var date = crimeIncident[i].reporteddate;


        var container = $(".container");
        var createP = $("<p>");
        createP.addClass("address");
        createP.html(offense + "<br />" + address + "<br />" + date + "<br />" + name + "<br />" + caseMo);

        container.append(createP);



        console.log(address, caseMo, name, offense, date);

    }

    return history;
}



var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 32.7766642, lng: -96.79698789999999 },
        zoom: 10
    });
}

