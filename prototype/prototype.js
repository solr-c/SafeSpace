function initMap() {
    var location = {
        lat: 32.7766642,
        lng: -96.7969879
    };

    var map = new google.maps.Map(document.getElementById("map"), {
        zoom: 4, 
        center: location
    });
};