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
    $('.test').hide(1000);
    $('#inputFormHeading').hide(1000);
    // $('.test1').show(1000);

    var streetName = $('#streetName-input').val().trim();
    var city = $('#city-input').val().trim();
    var state = $('#state-input').val().trim();
    var zipCode = $('#zipCode-input').val().trim();

    console.log(streetName, city, state, zipCode)

    // $('.test').addClass('test1').removeClass('test')


    delayTest1 = setTimeout(function() {
        $('.test1').show(1000);
        $('.test').addClass('test1').removeClass('test')
    }, 1500);
});





    // Testing / Debugging

// Main Process
//  ============================================
init();