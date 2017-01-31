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

            $('#trackProductContainerDiv').css("top", topButtonCoord);

        });
    }
    else {

        // Временно - куда-то делся консультант
        var buttonPath = chrome.extension.getURL("content/trackButton.html");
        $.get(buttonPath, function(data){

            $('body').append(data);

            setLogoImagePath();
            bindClickEventListener();

            $('#trackProductContainerDiv').css("top", 0);
        });

        // keep trying until lamoda consultant container loads
        //setTimeout( addTrackButton, 1000);
    }
}

function setLogoImagePath() {
    var imgPath = chrome.extension.getURL("img/logo.jpg");
    $('#trackProductContainerDiv').find("#logoImage").attr("src", imgPath);
}

function bindClickEventListener() {
    $('#trackButton').click(function(e) {
        var productDiv = $('div.ii-product');
        var titleElement = $(productDiv).find('.ii-product__title');
        var priceElement = $(productDiv).find('.ii-product__price');
        var imgSrc = $('img.showcase__item-image').attr('src');
        var urlDomain = extractUrlProtoDomainPath();
        var forSave =
        {
            name: $(titleElement).text(),
            code: $(productDiv).attr('data-sku'),
            url:  urlDomain + $(productDiv).attr('data-url'),
            imgBase64: null,
            price: Number( $(priceElement).attr('data-current') )
        };


        //var ifr = '<iframe id="ifrb" src="' + imgSrc + '"></iframe>';
        //$('body').append(ifr);


        resizeImgAndStoreProduct( forSave, imgSrc, 80, 80)
    });
}

function resizeImgAndStoreProduct(forSave, imgSrc, wantedWidth, wantedHeight)
{
    $('body').append('<canvas id="resizedCanvas" style="display: none;"></canvas></div>');

    forSave.imgSrc = imgSrc;
    //sendProductInfo(forSave);

    var img = new Image();
    //img.crossOrigin = 'Anonymous';
    img.onload = function() {
        var can = document.getElementById('resizedCanvas');
        var ctx = can.getContext('2d');
        ctx.drawImage(img, 0, 0);
        forSave.imgBase64Big = can.toDataURL();

        ctx = can.getContext('2d');

        // We set the dimensions at the wanted size.
        can.width = wantedWidth;
        can.height = wantedHeight;

        ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);

        forSave.imgBase64 = can.toDataURL();

        //------ Send product data to extention ---------
        sendProductInfo(forSave);
    };

    img.src = imgSrc;

}

function sendProductInfo(forSave) {
    chrome.runtime.sendMessage( forSave , function(response) {
        var msg = typeof response.result == 'undefined' ? "Произошла ошибка. Попробуйте еще раз." : response.result;
        $('#trackProductLabelTd').text(response.result);
    });
}

function extractUrlProtoDomainPath() {
    var url = document.URL;
    var pattern = '/';
    var count = 0;
    var i = 0;

    while (count<3 || index < url.length-1) {
        count = url[i++] === pattern ? count+1 : count;
        if(count == 3) {
            return  url.substr(0, i-1);
        }
    }
    return null;
}