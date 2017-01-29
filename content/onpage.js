;
$( function() {

    // has product div container
    if( $('div.ii-product').length > 0 ) {
        addTrackButton();
    }

});

function addTrackButton() {
    var TRACK_BUTTON_HEIGHT = 80;

    var lamodaConsultantContainer = $('#cleversite_clever_container');

    if(typeof lamodaConsultantContainer != 'undefined' &&  $(lamodaConsultantContainer).find('div').length > 0) {
        var lamodaConsultantPosition = lamodaConsultantContainer.position();
        var topButtonCoord = lamodaConsultantPosition.top - TRACK_BUTTON_HEIGHT;

        var buttonPath = chrome.extension.getURL("content/trackButton.html");
        $.get(buttonPath, function(data){

            $('body').append(data);

            setLogoImagePath();
            bindClickEventListener();

            $('#trackProductContainer').css("top", topButtonCoord);
        });
    }
    else {
        // keep trying until lamoda consultant container loads
        setTimeout( addTrackButton, 1000);
    }
}

function setLogoImagePath() {
    var imgPath = chrome.extension.getURL("img/logo.jpg");
    $('#trackProductContainer').find("#logoImage").attr("src", imgPath);
}

function bindClickEventListener() {
    $('#trackButton').click(function(e) {
        chrome.runtime.sendMessage(
            {
                name:  '',
                code: '',
                url: '',
                imageUrl: ''
            }
        , function(response) {
            $('#trackProductElementTd').text(response);
        });
    });
}
