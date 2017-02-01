;
$( function() {

    // has product div container
    if( $('div.ii-product').length > 0 ) {
        addTrackButton();
    }

    var linkToBootstrap = '<link rel="stylesheet" href="' + chrome.extension.getURL("lib/bootstrap.min.css") + '">';
    $('head').append(linkToBootstrap);

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


        //resizeImgAndStoreProduct( forSave, imgSrc, 80, 80)

        showNotifications([]);
    });
}

function showNotifications(changes) {
    var notificationPath = chrome.extension.getURL("content/notification.html");

    $.get(notificationPath, function(result) {

        var notificationTemplate = $(result);

        var code = 111;
        notificationTemplate.find('input.data-id').val(code);
        notificationTemplate.find('img.closeImg').attr('src', chrome.extension.getURL("img/close.png")).attr('data-id', code);
        notificationTemplate.hide();

        var bottom = $('div.footer__sticky').height() + 'px';

        $('body').append(notificationTemplate);
        $('body').find('.closeNotification').click(function(e) {
            e.preventDefault();
            var code = e.target.attributes['data-id'];
            $('.notificationContainerDiv').has('input.data-id[value="' + code.value + '"]').remove();

        });
        $('body').find('.notificationContainerDiv').css("bottom", bottom).fadeIn();
    });
}

function resizeImgAndStoreProduct(forSave, imgSrc, wantedWidth, wantedHeight)
{
    $('body').append('<canvas id="resizedCanvas" style="display: none;"></canvas>');
    $('body').append('<div id="tmpContainer" style="display: none;"></div>');

    forSave.imgSrc = imgSrc;
    sendProductInfo(forSave);

    //var img = new Image();
    ////img.crossOrigin = 'Anonymous';
    //img.onload = function() {
    //    var can = document.getElementById('resizedCanvas');
    //    var ctx = can.getContext('2d');
    //    ctx.drawImage(img, 0, 0);
    //    forSave.imgBase64Big = can.toDataURL();
    //
    //    ctx = can.getContext('2d');
    //
    //    // We set the dimensions at the wanted size.
    //    can.width = wantedWidth;
    //    can.height = wantedHeight;
    //
    //    ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);
    //
    //    forSave.imgBase64 = can.toDataURL();
    //
    //    //------ Send product data to extention ---------
    //    sendProductInfo(forSave);
    //};
    //
    //img.src = imgSrc;


    //
    //$('#tmpContainer').load('http://google.com'); // SERIOUSLY!
    //
    //$.ajax({
    //    url: imgSrc,
    //    type: 'GET',
    //    success: function(res) {
    //        //forSave.imgBase64Big = "data:image/jpg;base64," + res;
    //        //var blob = new Blob([res], {type: "image/jpeg"});
    //        //var url = URL.createObjectURL(blob);
    //
    //        var img = new Image();
    //        //img.crossOrigin = 'Anonymous';
    //        img.onload = function() {
    //            var can = document.getElementById('resizedCanvas');
    //            var ctx = can.getContext('2d');
    //            ctx.drawImage(img, 0, 0);
    //            ctx = can.getContext('2d');
    //            can.width = wantedWidth;
    //            can.height = wantedHeight;
    //            ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);
    //            forSave.imgBase64 = can.toDataURL();
    //
    //            //------ Send product data to extention ---------
    //            sendProductInfo(forSave);
    //        };
    //
    //        img.src = "data:image/png;base64," + arrayBuffer2Base64(res);
    //    }
    //});

    //var oReq = new XMLHttpRequest();
    //oReq.open("GET", imgSrc, true);
    //oReq.responseType = "arraybuffer";
    //
    //oReq.onload = function(oEvent) {
    //    var arrayBuffer = oReq.response;
    //
    //    var byteArray = new Uint8Array(arrayBuffer);
    //
    //    var b64encoded = btoa(String.fromCharCode.apply(null, byteArray));
    //
    //    var img = new Image();
    //    //img.crossOrigin = 'Anonymous';
    //    img.onload = function() {
    //        var can = document.getElementById('resizedCanvas');
    //        var ctx = can.getContext('2d');
    //        ctx.drawImage(img, 0, 0);
    //        ctx = can.getContext('2d');
    //        can.width = wantedWidth;
    //        can.height = wantedHeight;
    //        ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);
    //        forSave.imgBase64 = can.toDataURL();
    //
    //        //------ Send product data to extention ---------
    //        sendProductInfo(forSave);
    //    };
    //
    //    img.src = "data:image/png;base64," + b64encoded;
    //};
    //
    //oReq.send();
}

function sendProductInfo(forSave) {
    chrome.runtime.sendMessage( forSave , function(response) {
        var msg = isEmpty(response.result) ?  "Произошла ошибка. Попробуйте еще раз." : response.result;
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

function arrayBuffer2Base64(arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
        i, len = bytes.length, base64 = "";

    for (i = 0; i < len; i+=3) {
        base64 += chars[bytes[i] >> 2];
        base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
        base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
        base64 += chars[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
        base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
        base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
}