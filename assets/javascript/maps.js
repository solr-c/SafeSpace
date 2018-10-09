

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

// register a user
//returns true if user registered, false if not.
function registerUser(username, password, email, street, city, state, zip, range) {

    // Make sure this username is not in use.
    var snapshot = getRecord(username);
    if (snapshot.exists()) {
        return false;
    }

    var userPofile = {
        streetName: street,
        cityName: city,
        stateName: state,
        zip: zip,
        username: username,
        password: password,
        email: email,
        range: range
    };
    database.ref().push(userPofile);

    return true;

}

//return true if logged in, false if not
function login(username, password) {

    //todo: check that the username is in the database, if not return false, if it is, compare the password and return true or false.
    this.valid = false;
    this.pw = password;

    var snapshot = getRecord(username);

    if (snapshot.exists()) {
        snapshot.forEach(function (data) {
            parent.valid = (snapshot.child(data.key).child("password").val() === parent.pw);
        });
    }

    return this.valid;

}

// get's the stored users search location
// returns the following object:
// {
//     street
//     city
//     state
//     zip
//     range
function getUserSearchLocation(username) {
    var location = {
        street: "",
        city: "",
        state: "",
        zip: "",
        range: ""
    }

    var snapshot = getRecord(username);

    if (snapshot.exists()) {
        snapshot.forEach(function (data) {

            location.street = snapshot.child(data.key).child("streetName").val();
            location.city = snapshot.child(data.key).child("cityName").val();
            location.state = snapshot.child(data.key).child("state").val();
            location.zip = snapshot.child(data.key).child("zip").val();
            location.range = snapshot.child(data.key).child("range").val();
     
        });
    }

    console.log(JSON.stringify(location));
    return location;
}


// returns the snapshot for the user
function getRecord(username) {
    this.snap = null;
    database.ref().orderByChild("username").equalTo(username).once("value", function (snapshot) {
        //console.log(JSON.stringify(snapshot.val()));
        parent.snap = snapshot;
    });

    return this.snap;
}

//#endregion

//#region getshooting 

var limit = 50;
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
            // console.log("got Coords: " + coords.lat + "/" + coords.lng);
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
//#endregion

//#region activeCalls

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
        console.log(coords);

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

//#endregion

//#region History
var crimeIncident = null;
function getCrimeHistory(srcLat, srcLng) {

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
            // console.log("got coords: " + coords.lat + "/" + coords.lng);
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
//#endregion

//#region shootingButton
var shootingArray = null;
$("#shootingButton").on("click", function (e) {
    e.preventDefault();
    shootingArray = getShootingRecords(searchCoords.lat, searchCoords.lng);

    centerMap(searchCoords.lat, searchCoords.lng);
    addLocationMark(searchCoords.lat, searchCoords.lng);


    $("#crimeTabs").empty();
    for (i = 0; i < shootingArray.length; i++) {

        var incidentDateTime = shootingArray[i].incident.date_time;
        var incidentSuspect = shootingArray[i].incident.suspect_s;
        var incidentWeapon = shootingArray[i].incident.suspect_weapon;
        var suspectCondition = shootingArray[i].incident.suspect_deceased_injured_or_shoot_and_miss


        var container = $("#crimeTabs");
        var createP = $("<p>");
        createP.addClass("shooting");
        createP.attr("data-id", i);
        createP.html(incidentWeapon + "<br />" + suspectCondition + "<br />" + incidentSuspect + "<br />" + incidentDateTime);

        container.append(createP);


        addMark(shootingArray[i].coords.lat, shootingArray[i].coords.lng, "assets/images/icons8-shooting-40.png");
    }
});

$(document).on("click", ".shooting", shootingClick);

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

//#region activeButton
var currentArray = null;
$("#callsButton").on("click", function (e) {
    e.preventDefault();

    currentArray = getCurrentCalls(searchCoords.lat, searchCoords.lng);

    centerMap(searchCoords.lat, searchCoords.lng);
    addLocationMark(searchCoords.lat, searchCoords.lng);

    $("#crimeTabs").empty();

    for (i = 0; i < currentArray.length; i++) {

        var incidentDate = currentArray[i].incident.date_time;
        var incidentPriority = currentArray[i].incident.priority;
        var incidentNumber = currentArray[i].incident.unit_number;
        var incidentStatus = currentArray[i].incident.status


        var container = $("#crimeTabs");
        var createP = $("<p>");
        createP.addClass("calls");
        createP.attr("data-id", i);
        createP.html(incidentNumber + "<br />" + incidentStatus + "<br />" + incidentPriority + "<br />" + incidentDate);

        container.append(createP);

        addMark(currentArray[i].coords.lat, currentArray[i].coords.lng, "");
    }
});

$(document).on("click", ".calls", currentClick);

function currentClick() {
    var item = parseInt($(this).attr("data-id"));
    var coords = currentArray[item].coords;
    centerMap(coords.lat, coords.lng);

    for (i = 0; i < currentArray.length; i++) {
        addMark(currentArray[i].coords.lat, currentArray[i].coords.lng, "assets/images/icons8-shooting-40.png");

    }
}

//#endregion


//#region crimeHistoryButton
var historyArray = null;
$("#crimeButton").on("click", function (e) {
    e.preventDefault();
    console.log("crime button");

    historyArray = getCrimeHistory(searchCoords.lat, searchCoords.lng);

    centerMap(searchCoords.lat, searchCoords.lng);
    addLocationMark(searchCoords.lat, searchCoords.lng);

    $("#crimeTabs").empty();

    for (i = 0; i < historyArray.length; i++) {

        var crimeAddress = historyArray[i].incident.geocoded_column_address + " " + historyArray[i].incident.geocoded_column_city + " " + historyArray[i].incident.geocoded_column_state + " " + historyArray[i].incident.geocoded_column_zip;

        var address = crimeAddress;
        var incidentMo = historyArray[i].incident.mo;
        var officerName = historyArray[i].incident.ro1name;
        var crimeCategory = historyArray[i].incident.nibrs_crime_category;
        var reportDate = historyArray[i].incident.reporteddate;


        var container = $("#crimeTabs");
        var createP = $("<p>");
        createP.addClass("history");
        createP.attr("data-id", i);
        createP.html(crimeCategory + "<br />" + address + "<br />" + reportDate + "<br />" + officerName + "<br />" + incidentMo);
        console.log(JSON.stringify(historyArray[i]));

        container.append(createP);

        addMark(historyArray[i].coords.lat, historyArray[i].coords.lng, getIcon(historyArray[i].incident.nibrs_crime_category));

    }
});

$(document).on("click", ".history", historyClick);

function historyClick() {
    var item = parseInt($(this).attr("data-id"));
    console.log("item: " + item);
    var coords = historyArray[item].coords;
    centerMap(coords.lat, coords.lng);
    // var map = new google.maps.Map(document.getElementById("map"));
    // var coords = historyArray[item].coords;
    // map.setCenter(new GLatLng(coords.lat, coords.lng));


    for (i = 0; i < historyArray.length; i++) {
        addMark(historyArray[i].coords.lat, historyArray[i].coords.lng, "assets/images/icons8-shooting-40.png");

    }
}

//#endregion

//#region searchFunction
function search(address){
    searchCoords = getCoordinates(address);

    //TODO: check for coords of 0/0 if so, the address was invalid
    // ALSO, the can only search Dallas area.

    centerMap(searchCoords.lat, searchCoords.lng);
    addLocationMark(searchCoords.lat, searchCoords.lng);
}

//#endregion

//#region loginForm
$("#logIn-input").on("click", function(event){
    event.preventDefault();
    alert("work");
    var username =$("#userLog-input").val().trim();
    var password = $("#passLog-input").val().trim();

    var success = login(username, password);

    if(success){
        var location = getUserSearchLocation(username);
        var add = location.street +" " + location.city + ", " + location.state +" " +location.zip ;
        search(add);
        $("#wholeMap").show();
        $("#formLogin").hide();
        // hide otherdiv
    } else {
        alert("Invalid");
    }


});

//#endregion


//#region register form
$("#register-input").on("click", function(event){
    event.preventDefault();
    alert("work");
    // var username =$("#username-input").val().trim();
    // var password = $("#password-input").val().trim();
    var street = $("#street-input").val().trim();
    var city = $("#city-input").val().trim();
    var state = $("#state-input").val().trim();
    var zip = $("#zip-input").val().trim();
    var username = $("#username-input").val().trim();
    var password = $("#password-input").val().trim();
    var password2 = $("#password-input2").val().trim();
    var email = $("#email-input").val().trim();
    var range = $("#range-input").val().trim();

    if(password !== password2) {
        alert("Passwords don't match");
        return
    }


    var success = registerUser(username, password, email, street, city, state, zip, range);

    if(success){
        // var location = getUserSearchLocation(username);
        var add = street + " " + city + ", " + state + " " + zip;
        search(add);
        $("#wholeMap").show();
        $("#formRegister").hide();
    } else {
        alert("Invalid");
    }


});

//#endregion


//#region loginButton
$("#loginbutton").on("click", function(event){
    event.preventDefault();
    $("#formLogin").show();
    $("#front").hide();
});

$("#registerbutton").on("click", function(event){
    event.preventDefault();
    $("#formRegister").show();
    $("#front").hide();
});


//#endregion

//#region subtmiButton
$("#formSubmit").on("click", function (event) {
    event.preventDefault();
    var street = $("#streetName-input").val().trim();
    var city = $("#city-input").val().trim();
    var state = $("#state-input").val().trim();
    var zipCode = $("#zipCode-input").val().trim();
    console.log("text: " + street, city, state, zipCode);

    search(street + " " + city + ", " + state + " " + zipCode);

    
    $("#streetName-input").val("");
    $("#city-input").val("");
    $("#state-input").val("");
    $("#zipCode-input").val("");

});

database.ref().on("child_added", function (childSnapshot) {
    console.log("child" + childSnapshot.val());

    var a = childSnapshot.val().streetName;
    var b = childSnapshot.val().cityName;
    var c = childSnapshot.val().stateName;
    var d = childSnapshot.val().zip;
    console.log(a + b + c + d) + "work ork";
})

//#endregion

//#region getCoordinates
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

function addMark(lat, lng, icon) {
    $(function () {

        $("#map").addMarker({
            coords: [lat, lng], // GPS coords
            // title: title, // Title
            // text: txt, // HTML content
            animation: google.maps.Animation.DROP,
            icon: icon

        });
    })
}

//#endregion


//#region centerMap
function centerMap(lat, lng) {
    $(function () {
        $("#map").googleMap({
            zoom: 10, // Initial zoom level (optional)
            coords: [lat, lng], // Map center (optional)
            type: "ROADMAP" // Map type (optional)
        });
    });
}

//#endregion

//#region areCoordsWithRegion

//function to point within X miles of the other point

function areCoordsWithinRegion(srcLat, srcLng, targetCoords, range) {
    return distance(srcLat, srcLng, targetCoords.lat, targetCoords.lng, "M") <= range;

}

//#endregion

//#region distance

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

//#endregion

//#region initMap
var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 32.7766642, lng: -96.79698789999999 },
        zoom: 12,
        mapTypeId: 'terrain'

    });
}
//#endregion