//#region firebase
var config = {
    apiKey: "AIzaSyBmy65eFPJ8elKkPkySIuBAk-z62R11NVA",
    authDomain: "project-myc.firebaseapp.com",
    databaseURL: "https://project-myc.firebaseio.com",
    projectId: "project-myc",
    storageBucket: "",
    messagingSenderId: "322670292591"
};
firebase.initializeApp(config);
var database = firebase.database();

//returns true if user registered, false if not.
function registerUser(username, password, email, callback) {
    this.user = username;
    this.pw = password;
    this.em = email;

    // Make sure this username is not in use.
    database.ref().orderByChild("username").equalTo(username).once("value", function (snapshot) {
        if (snapshot != null && snapshot.exists()) {
            callback(false);
        } else {
            var userPofile = {
                username: parent.user,
                password: parent.pw,
                email: parent.em
            };
            database.ref().push(userPofile);
            callback(true);
        }
    });

}

//return true if logged in, false if not
var pw;
function login(username, password, callback) {
    console.log("function login " + username + "/" + password);
    this.pw = password;

    if (username.length < 1 || password < 1) {
        callback(false);
    } else {
        database.ref().orderByChild("username").equalTo(username).once("value", function (snapshot) {
            if (snapshot != null && snapshot.exists()) {
                console.log("got record");
                snapshot.forEach(function (data) {
                    var valid = (snapshot.child(data.key).child("password").val() === parent.pw);
                    callback(valid);

                    // TODO: add a search to their location
                });
            } else { callback(false); }
        });
    }
}




//#endregion

//#region getSHootingsRecords
// ** GLOBALS **
var limit = 100; // global for the limit on all dallas data searches
var searchCoords = null; //global for the coordinates of the searched address
var shootingResponse = null; //this is a global var for shooting response
var markers = []; // array to hold the map markers.
var incidentArray = []; // array to hold the incidents that will be displayed
var searchRange = 15;


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


        if (areCoordsWithinRegion(srcLat, srcLng, coords, searchRange)) {
            console.log("found one " + coords.lat + "/" + coords.lng);
            records.push({
                coords: coords,
                incident: shootingResponse[i]
            });
        }
    }

    return records;

}

//#endregion

//#region getCurrentCallCount
function getCurrentCallCount() {
    currentCalls = null;
    var queryURL = "https://www.dallasopendata.com/resource/are8-xahz.json?$limit=" + limit + "&$$app_token=kDCDojjY922O36hyR8W6vQ2nl";

    $.ajax({
        url: queryURL,
        method: "GET",
        async: false,
        success: function (response) {
            currentCalls = response;
        }
    });

    return currentCalls.length;
}
//#endregion

//#region active Calls
var currentCalls = null;
function getCurrentCalls(srcLat, srcLng) {
    console.log("current lat/long = " + srcLat + "/" + srcLng);
    records = [];
    currentCalls = null;
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

        if (areCoordsWithinRegion(srcLat, srcLng, coords, searchRange)) {
            console.log("found one " + coords.lat + "/" + coords.lng);
            records.push({
                coords: coords,
                incident: currentCalls[i]
            });
        }
    }

    return records;
}
//#endregion

//#region crimeHistory
var crimeIncident = null;
function crimeHistory(srcLat, srcLng) {

    var history = [];
    var queryUrl = "https://www.dallasopendata.com/resource/9s22-2qus.json?$limit=" + limit + "&$$app_token=kDCDojjY922O36hyR8W6vQ2nl&$order=edate%20DESC";

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
            console.log("found coords! " + coords.lat + "/" + coords.lng);

        } else {
            coords = {
                lat: crimeIncident[i].geocoded_column.coordinates[0],
                lng: crimeIncident[i].geocoded_column.coordinates[1],
            }
            console.log("got coords: " + coords.lat + "/" + coords.lng);
        }

        if (areCoordsWithinRegion(srcLat, srcLng, coords, searchRange)) {
            history.push({
                coords: coords,
                incident: crimeIncident[i]
            });
        }

    }

    return history;
}


//#endregion

//#region shootingButton
//var shootingArray = null;
$("#shootingButton").on("click", function (e) {
    e.preventDefault();
    resetState();
    incidentArray = getShootingRecords(searchCoords.lat, searchCoords.lng);

    for (i = 0; i < incidentArray.length; i++) {


        var incidentDateTime = moment(incidentArray[i].incident.date).format("MMMM Do YYYY, h:mm:ss a");
        var incidentSuspect = incidentArray[i].incident.suspect_s;
        var incidentWeapon = incidentArray[i].incident.suspect_weapon;
        var suspectCondition = incidentArray[i].incident.suspect_deceased_injured_or_shoot_and_miss;
        var incidentLocation = incidentArray[i].incident.location;


        var container = $("#shootingTableItem");
        var createP = $("<tr>");
        createP.addClass("shooting");
        createP.attr("data-id", i);
        container.append(createP);
        createP.html(incidentLocation + "<br />" + incidentDateTime + "<br />" + incidentSuspect + "<br />" + "Suspect: " + suspectCondition + "<br />" + incidentWeapon);

        container.append(createP);


        var newMarker = addMark(incidentArray[i].coords.lat, incidentArray[i].coords.lng, "assets/images/icons8-shooting-40.png", i);

        google.maps.event.addListener(newMarker, "click", function () {
            var marker = this;
            $("#shootingTableItem > .shooting").each(function () {
                //console.log("comparing " + $(this).attr("data-id") + "=" + marker.id)
                if ($(this).attr("data-id") == marker.id) {
                    var i = parseInt(marker.id);
                    var incidentDateTime = moment(incidentArray[i].incident.date).format("MMMM Do YYYY, h:mm:ss a");
                    var incidentSuspect = incidentArray[i].incident.suspect_s;
                    var incidentWeapon = incidentArray[i].incident.suspect_weapon;
                    var suspectCondition = incidentArray[i].incident.suspect_deceased_injured_or_shoot_and_miss;
                    var incidentLocation = incidentArray[i].incident.location;

                    var infowindow = new google.maps.InfoWindow({
                        content: incidentLocation + "<br />" + incidentDateTime + "<br />" + incidentSuspect + "<br />" + "Suspect: " + suspectCondition + "<br />" + incidentWeapon
                    });

                    infowindow.open(map, marker);

                }
            });
        });

        markers.push(newMarker);
    }
});

$(document).on("click", ".shooting", itemClick);

function shootingClick() {
    var item = parseInt($(this).attr("data-id"));
    var coords = shootingArray[item].coords;
    console.log("item: " + item);
    console.log(coords.lat + "/" + coords.lng);
    centerMap(coords.lat, coords.lng);

    for (i = 0; i < shootingArray.length; i++) {
        addMark(shootingArray[i].coords.lat, shootingArray[i].coords.lng, "assets/images/icons8-shooting-40.png");

    }
}

//#endregion

//#region activeCallsButton

//var currentArray = null;
$("#callsButton").on("click", function (e) {
    e.preventDefault();
    resetState();


    incidentArray = getCurrentCalls(searchCoords.lat, searchCoords.lng);

    // centerMap(searchCoords.lat, searchCoords.lng);
    // addLocationMark(searchCoords.lat, searchCoords.lng);

    for (i = 0; i < incidentArray.length; i++) {

        var incidentDate = moment(incidentArray[i].incident.date_time).format("MMMM Do YYYY, h:mm:ss a");
        var block = incidentArray[i].incident.block ? incidentArray[i].incident.block + " " : "";
        var incidentLocation = block + incidentArray[i].incident.location;
        var incidentNatureCall = incidentArray[i].incident.nature_of_call;


        var container = $("#callsTableItem");
        var createP = $("<tr>");
        createP.addClass("calls");
        createP.attr("data-id", i);
        createP.html(incidentLocation + "<br />" + incidentNatureCall + "<br />" + incidentDate);
        container.append(createP);

        var newMarker = addMark(incidentArray[i].coords.lat, incidentArray[i].coords.lng, "", i);


         google.maps.event.addListener(newMarker, "click", function () {
            var marker = this;
            $("#callsTableItem > .calls").each(function () {
                console.log("comparing " + $(this).attr("data-id") + "=" + marker.id)
                if ($(this).attr("data-id") == marker.id) {
                    var i = parseInt(marker.id);
                    var incidentDate = moment(incidentArray[i].incident.date_time).format("MMMM Do YYYY, h:mm:ss a");
                    var block = incidentArray[i].incident.block ? incidentArray[i].incident.block + " " : "";
                    var incidentLocation = block + incidentArray[i].incident.location;
                    var incidentNatureCall = incidentArray[i].incident.nature_of_call;

                    var infowindow = new google.maps.InfoWindow({
                        content: incidentLocation + "<br />" + incidentNatureCall + "<br />" + incidentDate
                    });
                    
                    infowindow.open(map, marker);

                }
            });
         });

        markers.push(newMarker);
    }
});


$(document).on("click", ".calls", itemClick);

function itemClick() {
    console.log(map);
    var item = parseInt($(this).attr("data-id"));
    var coords = incidentArray[item].coords;

    panToAndBounceMarker(markers[item], coords);
}

function panToAndBounceMarker(marker, coords) {
    var latLng = new google.maps.LatLng(coords.lat, coords.lng);
    map.panTo(latLng);
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function () { marker.setAnimation(null); }, 750 * 3);
}

//#endregion

//#region crimHistoryButton
//var historyArray = null;
$("#crimeButton").on("click", function (e) {
    e.preventDefault();
    resetState();

    incidentArray = crimeHistory(searchCoords.lat, searchCoords.lng);

    for (i = 0; i < incidentArray.length; i++) {

        var crimeAddress = incidentArray[i].incident.geocoded_column_address + " " + incidentArray[i].incident.geocoded_column_city + " " + incidentArray[i].incident.geocoded_column_state + " " + incidentArray[i].incident.geocoded_column_zip;

        var address = crimeAddress;
        var incidentMo = incidentArray[i].incident.mo;
        var officerName = incidentArray[i].incident.ro1name;
        var crimeCategory = incidentArray[i].incident.nibrs_crime_category;
        var reportDate = moment(incidentArray[i].incident.reporteddate).format("MMMM Do YYYY, h:mm:ss a");


        var container = $("#crimeTableItem");
        var createP = $("<tr>");
        createP.addClass("history");
        createP.attr("data-id", i);
        createP.html(crimeCategory + "<br />" + address + "<br />" + reportDate + "<br />" + officerName + "<br />" + incidentMo);

        container.append(createP);

        var newMarker = addMark(incidentArray[i].coords.lat, incidentArray[i].coords.lng, getIcon(incidentArray[i].incident.nibrs_crime_category), i);

        google.maps.event.addListener(newMarker, "click", function () {
            var marker = this;
            $("#crimeTableItem > .history").each(function () {
                //console.log("comparing " + $(this).attr("data-id") + "=" + marker.id)
                if ($(this).attr("data-id") == marker.id) {
                    var i = parseInt(marker.id);
                    var crimeAddress = incidentArray[i].incident.geocoded_column_address + " " + incidentArray[i].incident.geocoded_column_city + " " + incidentArray[i].incident.geocoded_column_state + " " + incidentArray[i].incident.geocoded_column_zip;

                    var address = crimeAddress;
                    var incidentMo = incidentArray[i].incident.mo;
                    var officerName = incidentArray[i].incident.ro1name;
                    var crimeCategory = incidentArray[i].incident.nibrs_crime_category;
                    var reportDate = moment(incidentArray[i].incident.reporteddate).format("MMMM Do YYYY, h:mm:ss a");

                    var infowindow = new google.maps.InfoWindow({
                        content: crimeCategory + "<br />" + address + "<br />" + reportDate + "<br />" + officerName + "<br />" + incidentMo
                    });

                    infowindow.open(map, marker);

                }
            });
        });

        markers.push(newMarker);

    }
});


$(document).on("click", ".history", itemClick);

function historyClick() {
    var item = parseInt($(this).attr("data-id"));
    console.log("item: " + item);
    var coords = historyArray[item].coords;
    centerMap(coords.lat, coords.lng);


    for (i = 0; i < historyArray.length; i++) {
        addMark(historyArray[i].coords.lat, historyArray[i].coords.lng, "assets/images/icons8-shooting-40.png");

    }
}

//#endregion

//#region resetState
function resetState() {
    // Clear the map markers
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];

    //recenter to the searchCoords if they exist
    if (searchCoords) {
        centerMap(searchCoords.lat, searchCoords.lng);
    }

    //remove all the data
    $("#callsTableItem").empty();
    $("#shootingTableItem").empty();
    $("#crimeTableItem").empty();
    incidentArray = [];
}

//#endregion

//#region search
var searchMarker = null;
function search(address) {
    // if there is an existing search marker clear it.
    if (searchMarker) {
        searchMarker.setMap(null);
        searchMarker = null;
    }

    // clear all the other markers and the data.
    resetState();

    //find the coordinates.
    searchCoords = getCoordinates(address);

    var latLng = new google.maps.LatLng(searchCoords.lat, searchCoords.lng);

    //set the search marker so we can clear in when there is a new search.
    searchMarker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: 'Search Location',
        icon: "assets/images/if_user 5_6712.png"
    });

    // center the map on the search location
    map.panTo(latLng);
}
//#endregion

//#region registerForm
$("#submitBtn").on("click", function (event) {
    event.preventDefault();

    var username = $("#regisUserName-input").val().trim();
    var password = $("#regisPass-input").val().trim();
    var password2 = $("#regisPass2-input").val().trim();
    var email = $("#regisEmail-input").val().trim();

    if (username.length < 1 || password.length < 1 || password2.length < 1 || email.length < 1) {
        $("#invalid").show();
    } else if (password !== password2) {
        $("#invalid").text("Passwords do not match");
        $("#regisPass-input").val("");
        $("#regisPass2-input").val("");
        $("#invalid").show();
    } 
    // else if(isValidEmail(email)) {
    //     $("#invalid").text("Email address invalid");
    //     $("#invalid").show();
    // } 
    else {
        registerUser(username, password, email, registrationComplete);
    }
});

function isValidEmail(s) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(s);
}

function registrationComplete(success) {
    if (success) {
        $("#wholeMap").show();
        $("#signUpPage").hide();
        $("#invalid").hide();
    } else {
        $("#invalid").text("User already exists");
        $("#invalid").show();
    }
}
$("#invalid").hide();

//#endregion

//#region loginButton
$("#loginBtn").on("click", function (event) {
    event.preventDefault();

    var username = $("#loginUserName-input").val().trim();
    var password = $("#loginPassword-input").val().trim();
    console.log("logging in: " + username + "/" + password);
    login(username, password, loggedIn);

})

function loggedIn(success) {
    console.log("login: " + success);
    if (success) {

        $("#wholeMap").show();
        $("#signUpPage").hide();
        $("#incorrect").hide();
        // hide otherdiv
    } else {
        $("#incorrect").show();
    }
}
$("#incorrect").hide();
//#endregion

//#region submitButton
$("#formSubmit").on("click", function (event) {
    event.preventDefault();
    var street = $("#streetName-input").val().trim();
    var city = $("#city-input").val().trim();
    var state = $("#state-input").val().trim();
    var zipCode = $("#zipCode-input").val().trim();
    searchRange = parseInt($("#radius-input").val().trim());
    console.log(searchRange);

    search(street + " " + city + ", " + state + " " + zipCode);

})
//#endregion

//#region getCoordinates
var lastResp = null;

function getCoordinates(address) {
    console.log("converting: " + address);
    var queryURL = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDlLaXHzolEt6dE-_eZi6llI_m5uRKQu-c&address=" + address;
    var lat = 0;
    var lng = 0;
    this.lastResp = null;
    $.ajax
        ({
            type: "GET",
            url: queryURL,
            async: false,
            success: function (response) {
                parent.lastResp = response;
            }
        });

    //console.log(JSON.stringify(lastResp));
    if (this.lastResp.status == "ZERO_RESULTS") {
        lat = 0;
        lng = 0;
    }
    else {
        lat = this.lastResp.results[0].geometry.location.lat;
        lng = this.lastResp.results[0].geometry.location.lng;
    }

    return { lat: lat, lng: lng };
}
//#endregion

//#region addLocation
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
//#endregion

//#region addMark
function addMark(lat, lng, icon, id) {
    var latLng = new google.maps.LatLng(lat, lng);
    //TODO: check for coords of 0/0 if so, the address was invalid
    // ALSO, the can only search Dallas area.

    var newMarker = new google.maps.Marker({
        position: latLng,
        map: map,
        id: id
    });

    return newMarker;

}
//#endregion

//#region centerMap
function centerMap(lat, lng) {
    var latLng = new google.maps.LatLng(lat, lng);
    map.panTo(latLng);
}
//#endregion

//#region addCoordinatesWithRegion
//function to point within X miles of the other point

function areCoordsWithinRegion(srcLat, srcLng, targetCoords, range) {
    return distance(srcLat, srcLng, targetCoords.lat, targetCoords.lng, "M") <= range;

}

//#endregion

//#region Distance

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
//#endregion

//#region getIcon
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

$("#activeCalls").text(getCurrentCallCount());
