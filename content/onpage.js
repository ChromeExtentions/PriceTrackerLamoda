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
            $('#trackProductContainerTTT').css("top", topButtonCoord-100);


        });
    }
    else {
        // keep trying until lamoda consultant container loads
        setTimeout( addTrackButton, 1000);
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

        resizeImgAndStoreProduct( forSave, imgSrc, 80, 80)
    });
}

function resizeImgAndStoreProduct(forSave, imgSrc, wantedWidth, wantedHeight)
{



    $('body').append('<canvas id="resizedCanvas" style="display: none;"></canvas></div>');

    forSave.imgSrc = imgSrc;
    // sendProductInfo(forSave);
    //
    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
        var can = document.getElementById('resizedCanvas');
        var ctx = can.getContext('2d');
        ctx.drawImage(img, 0, 0);

        forSave.imgBase64Old = can.toDataURL();

        // We create a canvas and get its context.
        var canvas = document.getElementById('resizedCanvas');
        ctx = canvas.getContext('2d');

        // We set the dimensions at the wanted size.
        canvas.width = wantedWidth;
        canvas.height = wantedHeight;

        // We resize the image with the canvas method drawImage();
        ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);

        forSave.imgBase64 = canvas.toDataURL();

        //------ Send product data to extention ---------
        sendProductInfo(forSave);
    };

    // img.crossOrigin = '';
    img.src = imgSrc;

    ////$('body').append('<img id="resizedImg" style="display: none;"/></div>');
    //
    //// We create an image to receive the Data URI
    ////var img = document.getElementById('resizedImg');
    //var img = new Image();
    //
    //img.crossOrigin = "Anonymous";
    //// When the event "onload" is triggered we can resize the image.
    //img.onload = function()
    //{
    //    // We create a canvas and get its context.
    //    var canvas = document.getElementById('resizedCanvas');
    //    var ctx = canvas.getContext('2d');
    //
    //    // We set the dimensions at the wanted size.
    //    canvas.width = wantedWidth;
    //    canvas.height = wantedHeight;
    //
    //    // We resize the image with the canvas method drawImage();
    //    ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);
    //
    //    forSave.imgBase64 = canvas.toDataURL();
    //
    //    //------ Send product data to extention ---------
    //    sendProductInfo(forSave);
    //};
    //
    //// We put the Data URI in the image's src attribute
    //img.crossOrigin = "Anonymous";
    //img.src = imgSrc;
    //img.crossOrigin = "Anonymous";
}



function sendProductInfo(forSave) {
    chrome.runtime.sendMessage( forSave , function(response) {
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


//===================================================================
// var imgSrc = $('img.showcase__item-image').attr('src');
// var ifr = '<iframe id="ifrb" src="' + imgSrc + '"><canvas id="resizedCanvas" style="display: none;"></canvas></iframe>';
// $('body').append(ifr);
//
// $('#ifrb').on('load', function(){
//     var ifDocument = document.getElementById('ifrb').contentWindow.document;
//     var img = new Image();
//     // img.crossOrigin = 'Anonymous';
//
//     img.onload = function() {
//         var can = ifDocument.getElementById('resizedCanvas');
//         var ctx = can.getContext('2d');
//         ctx.drawImage(img, 0, 0);
//
//         var canvas = ifDocument.getElementById('resizedCanvas');
//         ctx = can.getContext('2d');
//
//         canvas.width = 80;
//         canvas.height = 80;
//
//         ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);
//
//         // forSave.imgBase64 = canvas.toDataURL();
//
//         //------ Send product data to extention ---------
//         // sendProductInfo(forSave);
//         var i=0;
//     };
//
//     img.src = imgSrc;
// });


// function listener(event){
//     if ( event.origin !== "http://www.lamoda.ru" )
//         return;
//
//     alert(event.data);
// }
// if (window.addEventListener){
//     window.addEventListener("message", listener,false);
// } else {
//     window.attachEvent("onmessage", listener);
// }

// var win = document.getElementById("ifrb").contentWindow;
// win.postMessage(
//     "@@@",
//     "*" // target domain
// );