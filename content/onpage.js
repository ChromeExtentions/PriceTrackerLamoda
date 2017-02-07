;
$( function() {

    //===== PRODUCTION =====
    // if(document.domain == 'www.lamoda.ru') {
    //     // has product div container
    //     if( $('div.ii-product').length > 0 ) {
    //
    //         // Сколько раз пытаться найти кнопку консультанта, чтобы прицепить к ней нашу кнопку
    //         window.maxConsultantAttachAttempts = 5;
    //         addTrackButton();
    //     }
    // }
    //===== PRODUCTION =====

    //===== TEST =====
    window.maxConsultantAttachAttempts = 5;
    addTrackButton();
    //===== TEST =====
});

function addTrackButton() {
    var TRACK_BUTTON_HEIGHT = 80;
    var lamodaConsultantContainer = $('#cleversite_clever_container');
    var buttonPath = chrome.extension.getURL("content/trackButton.html");
    $.get(buttonPath, function(data){

        var templateHtml =  $( (' ' + data).slice(1) );
        setLogoImagePath(templateHtml);


        if( (typeof lamodaConsultantContainer != 'undefined' &&  $(lamodaConsultantContainer).find('div').length > 0)) {
            var lamodaConsultantPosition = lamodaConsultantContainer.position();
            var topButtonCoord = lamodaConsultantPosition.top - TRACK_BUTTON_HEIGHT;

            // Хак чтоб не глючило положение кнопки по вертикали
            console.log(isEmpty(lamodaConsultantPosition) ? lamodaConsultantPosition.top : '');

            $(templateHtml).css("top", topButtonCoord)
            $('body').append(templateHtml);
            bindClickEventListener();
        }
        else if(window.maxConsultantAttachAttempts == 0) {
        // Если отсутствует кнопка консультант
            $(templateHtml).css("top", 160);
            $('body').append(templateHtml);
            bindClickEventListener();
        }
        else {
            // Раз в секунду пытаемся прицепить кнопку к консультанту
            window.maxConsultantAttachAttempts--;
            setTimeout( addTrackButton, 100);
        }
    });

}

function setLogoImagePath(templateHtml) {
    var imgPath = chrome.extension.getURL("img/logo.png");
    $(templateHtml).find("#logoImage").attr("src", imgPath);
}

function bindClickEventListener() {
    $('#trackButton').click(function(e) {
        resizeImgAndStoreProduct( getProductData() , 80, 80);
    });
}

function resizeImgAndStoreProduct(forSave, wantedWidth, wantedHeight) {

    //$('body').append('<canvas id="resizedCanvas"></canvas>');
    //
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
    //img.src = 'http:' + forSave.imgSrc;


    sendProductInfo(forSave);
}

function sendProductInfo(forSave) {
    chrome.runtime.sendMessage( forSave , function(response) {
        var msg = isEmpty(response.result) ?  "Произошла ошибка. Попробуйте еще раз." : response.result;
        $('#trackProductLabelTd').text(response.result);
    });
}

//===== PRODUCTION =====
// function getProductData() {
//     var productDiv = $('div.ii-product');
//     var titleElement = $(productDiv).find('.ii-product__title');
//     var priceElement = $(productDiv).find('.ii-product__price');
//     var imgSrc = $('img.showcase__item-image').attr('src');
//     var urlDomain = extractUrlProtoDomainPath();
//     return {
//         name: $(titleElement).text(),
//         code: $(productDiv).attr('data-sku'),
//         url: urlDomain + $(productDiv).attr('data-url'),
//         imgSrc: imgSrc,
//         imgBase64: null,
//         price: Number($(priceElement).attr('data-current'))
//     };
// }
//===== PRODUCTION =====

//===== TEST =====
function getProductData() {
    var titleElement = $('#productName');
    var priceElement = $('#productPrice');
    var imgSrc = $('#productImg').find('img').attr('src');
    return {
        name: normalizeString( $(titleElement).text() ),
        code: $('#productId').attr('data-sku'),
        url: chrome.extension.getURL( document.URL.substr(document.URL.lastIndexOf('test/product')) ),
        imgSrc: imgSrc.substr(5),
        imgBase64: null,
        price: Number($(priceElement).attr('data-current'))
    };
}

function normalizeString(str) {
    return str
                .replace(/^\s+/, '')
                .replace(/\s+$/, '')
                .replace('\n', '')
                .replace(/ +(?= )/g, ' ');
}

//===== TEST =====

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

// function arrayBuffer2Base64(arraybuffer) {
//     var bytes = new Uint8Array(arraybuffer),
//         i, len = bytes.length, base64 = "";
//
//     for (i = 0; i < len; i+=3) {
//         base64 += chars[bytes[i] >> 2];
//         base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
//         base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
//         base64 += chars[bytes[i + 2] & 63];
//     }
//
//     if ((len % 3) === 2) {
//         base64 = base64.substring(0, base64.length - 1) + "=";
//     } else if (len % 3 === 1) {
//         base64 = base64.substring(0, base64.length - 2) + "==";
//     }
//
//     return base64;
// }