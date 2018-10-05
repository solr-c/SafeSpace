// Global Variables
//  ============================================
// Arrays and Variables for initiating Data


// Functions
//  ============================================

function init() {
    $('#tableContainer').hide();
}


$('#formSubmit').on('click', function(e) {
    e.preventDefault();
    $('#formContainer').hide(1000);

    var streetName = $('#streetName-input').val().trim();
    var city = $('#city-input').val().trim();
    var state = $('#state-input').val().trim();
    var zipCode = $('#zipCode-input').val().trim();

    console.log(streetName, city, state, zipCode)

    // $('.test').addClass('test1').removeClass('test')


    delayTest1 = setTimeout(function() {
        $('#tableContainer').show(1000)
    }, 1500);
});

$('#closeButton').on('click', function(e) {
    e.preventDefault();
    $('#tableContainer').hide(1000);

    $('#streetName-input').val("");
    $('#city-input').val("");
    $('#state-input').val("");
    $('#zipCode-input').val("");


    delayTest1 = setTimeout(function() {
        $('#formContainer').show(1000)
    }, 1500);

});



    // Testing / Debugging

// Main Process
//  ============================================
init();