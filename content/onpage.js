;
$( function() {
    applyEmbeddedSettings();

    $.fn.drags = function(opt) {

        opt = $.extend({handle:"",cursor:"move"}, opt);

        if(opt.handle === "") {
            var $el = this;
        } else {
            var $el = this.find(opt.handle);
        }

        return $el.css('cursor', opt.cursor).on("mousedown", function(e) {
            if(opt.handle === "") {
                var $drag = $(this).addClass('draggable');
            } else {
                var $drag = $(this).addClass('active-handle').parent().addClass('draggable');
            }
            var z_idx = $drag.css('z-index'),
                drg_h = $drag.outerHeight(),
                drg_w = $drag.outerWidth(),
                pos_y = $drag.offset().top + drg_h - e.pageY,
                pos_x = $drag.offset().left + drg_w - e.pageX;
            $drag.css('z-index', 1000).parents().on("mousemove", function(e) {
                $('.draggable').offset({
                    top:e.pageY + pos_y - drg_h,
                    left:e.pageX + pos_x - drg_w
                }).on("mouseup", function() {
                    $(this).removeClass('draggable').css('z-index', z_idx);
                });
            });
            e.preventDefault(); // disable selection
        }).on("mouseup", function() {
            if(opt.handle === "") {
                $(this).removeClass('draggable');
            } else {
                $(this).removeClass('active-handle').parent().removeClass('draggable');
            }
        });
    };

    if(window.settings.testApp === true) {
        if(document.URL.indexOf('file') != 0) {
            return;
        }

        window.maxConsultantAttachAttempts = 5;
        chrome.runtime.sendMessage( { article: getArticle() } , function(response) {
            addTrackButton(     (isEmpty(response) || isEmpty(response.hasProduct)) ? false : response.hasProduct);
        });
    }
    else {
        if(document.domain == 'www.lamoda.ru') {
            // has product div container
            if( $('div.ii-product').length > 0 ) {

                // Сколько раз пытаться найти кнопку консультанта, чтобы прицепить к ней нашу кнопку
                window.maxConsultantAttachAttempts = 5;
                chrome.runtime.sendMessage( { article: getArticle() } , function(response) {
                    addTrackButton(     (isEmpty(response) || isEmpty(response.hasProduct)) ? false : response.hasProduct);
                });
            }
        }
    }
});

function addTrackButton(hasProduct) {
    var TRACK_BUTTON_HEIGHT = 80;
    var lamodaConsultantContainer = $('#cleversite_clever_container');
    var buttonPath = chrome.extension.getURL("content/trackButton.html");
    $.get(buttonPath, function(data){

        var templateHtml =  $( (' ' + data).slice(1) );
        setLogoImagePath(templateHtml);

        if(hasProduct === true) {
            $(templateHtml).find('#trackProductLabelTd').text('Товар добавлен к отслеживанию');
        };

        if( (typeof lamodaConsultantContainer != 'undefined' &&  $(lamodaConsultantContainer).find('div').length > 0)) {
            var lamodaConsultantPosition = lamodaConsultantContainer.position();
            var topButtonCoord = lamodaConsultantPosition.top - TRACK_BUTTON_HEIGHT;

            // Хак чтоб не глючило положение кнопки по вертикали
            console.log(isEmpty(lamodaConsultantPosition) ? lamodaConsultantPosition.top : '');

            $(templateHtml).css("top", topButtonCoord);
            //$(templateHtml).drags();
            $('body').append(templateHtml);
            if(hasProduct !== true) { bindClickEventListener() };
            addButtonMessage();
        }
        else if(window.maxConsultantAttachAttempts == 0) {
        // Если отсутствует кнопка консультант
            $(templateHtml).css("top", 160);
            //$(templateHtml).drags();
            $('body').append(templateHtml);
            if(hasProduct !== true) { bindClickEventListener() };
            addButtonMessage();
        }
        else {
            // Раз в секунду пытаемся прицепить кнопку к консультанту
            window.maxConsultantAttachAttempts--;
            setTimeout( function() {
                addTrackButton(hasProduct);
            }, 1000);
        }
    });
}


function setLogoImagePath(templateHtml) {
    var imgPath = chrome.extension.getURL("img/logo.png");
    $(templateHtml).find("#logoImage").attr("src", imgPath);
}

function bindClickEventListener() {
    $('#trackButtonBody').click(function(e) {
        var forSave = getProductData();
        getSmallImage(forSave, 80, 80).then(function() {  // 80x80 изображение, которое будет отображаться в уведомлении и в списке товаров
            sendProductInfo(forSave);
        });
    });
}

function sendProductInfo(forSave) {
    chrome.runtime.sendMessage( forSave , function(response) {
        var msg = isEmpty(response.result) ?  "Произошла ошибка. Попробуйте еще раз." : response.result;
        $('#trackProductLabelTd').text(response.result);
    });
}

function addButtonMessage() {
    chrome.runtime.sendMessage( { showTrackButton: true } , function() {});
}

//===== PRODUCTION =====
function getProductData() {
     if(window.settings.testApp === true) {
         //===== FOR TESTS =====
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
         //===== FOR TESTS =====
     }
     else {
         var productDiv = $('div.ii-product');
         var titleElement = $(productDiv).find('.ii-product__title');
         var priceElement = $(productDiv).find('.ii-product__price');
         var imgSrc = $('img.showcase__item-image').attr('src');
         var urlDomain = extractUrlProtoDomainPath();
         return {
             name: normalizeString($(titleElement).text()),
             code: $(productDiv).attr('data-sku'),
             url: urlDomain + $(productDiv).attr('data-url'),
             imgSrc: imgSrc,
             imgBase64: null,
             price: Number($(priceElement).attr('data-current'))
         };
     }
}

function getArticle() {
    if(window.settings.testApp === true) {
        //===== FOR TESTS =====
        return $('#productId').attr('data-sku');
        //===== FOR TESTS =====
    }
    else {
        return $('div.ii-product').attr('data-sku');
    }
}
function getSmallImage(forSave, wantedWidth, wantedHeight) {
    if(window.settings.testApp === true) {
        //===== FOR TESTS =====
        return new Promise( function(resolve, reject) {
            forSave.imgBase64 = 'http:' + forSave.imgSrc;
            resolve(forSave);
        });
        //===== FOR TESTS =====
    }
    else {
        return new Promise( function(resolve, reject) {
            $('body').append('<canvas id="resizedCanvas" style="display: none"></canvas>');
            var oReq = new XMLHttpRequest();
            oReq.open("GET", forSave.imgSrc, true);
            oReq.responseType = "arraybuffer";
            oReq.onload = function(oEvent) {

                if(oReq.status == 200) {
                    var arrayBuffer = oReq.response;
                    var byteArray = new Uint8Array(arrayBuffer);
                    var img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = function() {
                        var can = document.getElementById('resizedCanvas');
                        var ctx = can.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        ctx = can.getContext('2d');
                        can.width = wantedWidth;
                        can.height = wantedHeight;
                        ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);
                        forSave.imgBase64 = can.toDataURL();

                        //------ Send product data to extention ---------
                        resolve(forSave);
                    };
                    img.src = "data:image/png;base64," + base64ArrayBuffer(byteArray);
                }
                else {
                    resolve();
                }
            };
            oReq.send();
        });
    }
}


function normalizeString(str) {
    return str
                .replace(/^\s+/, '')
                .replace(/\s+$/, '')
                .replace('\n', '')
                .replace(/ +(?= )/g, ' ');
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

function base64ArrayBuffer(arrayBuffer) {
    var base64    = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    var bytes         = new Uint8Array(arrayBuffer)
    var byteLength    = bytes.byteLength
    var byteRemainder = byteLength % 3
    var mainLength    = byteLength - byteRemainder

    var a, b, c, d
    var chunk

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
        d = chunk & 63               // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength]

        a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3)   << 4 // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

        a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }

    return base64
}

//function removeBlanks (context, canvas, imgWidth, imgHeight) {
//    var imageData = context.getImageData(0, 0, canvas.width, canvas.height),
//        data = imageData.data,
//        getRBG = function(x, y) {
//            return {
//                red:   data[(imgWidth*y + x) * 4],
//                green: data[(imgWidth*y + x) * 4 + 1],
//                blue:  data[(imgWidth*y + x) * 4 + 2]
//            };
//        },
//        isWhite = function (rgb) {
//            return rgb.red == 255 && rgb.green == 255 && rgb.blue == 255;
//        },
//        scanY = function (fromTop) {
//            var offset = fromTop ? 1 : -1;
//
//            // loop through each row
//            for(var y = fromTop ? 0 : imgHeight - 1; fromTop ? (y < imgHeight) : (y > -1); y += offset) {
//
//                // loop through each column
//                for(var x = 0; x < imgWidth; x++) {
//                    if (!isWhite(getRBG(x, y))) {
//                        return y;
//                    }
//                }
//            }
//            return null; // all image is white
//        },
//        scanX = function (fromLeft) {
//            var offset = fromLeft? 1 : -1;
//
//            // loop through each column
//            for(var x = fromLeft ? 0 : imgWidth - 1; fromLeft ? (x < imgWidth) : (x > -1); x += offset) {
//
//                // loop through each row
//                for(var y = 0; y < imgHeight; y++) {
//                    if (!isWhite(getRBG(x, y))) {
//                        return x;
//                    }
//                }
//            }
//            return null; // all image is white
//        };
//
//    var crops = {
//        cropTop: scanY(true),
//        cropBottom: scanY(false),
//        cropLeft: scanX(true),
//        cropRight: scanX(false)
//    };
//
//    var cropWidth = crops.cropRight - crops.cropLeft;
//    var cropHeight = crops.cropBottom - crops.cropTop;
//
//    var spaceToAdd = cropWidth - cropHeight;
//    if(spaceToAdd == 0) {
//        return;
//    }
//
//    var newImageData = [];
//
//    // Надо добавить по ширине
//    if(spaceToAdd > 0) {
//        var spaceCount = div(spaceToAdd, 2);
//        if(spaceCount.remain > 0) {
//            var
//        }
//            var x = 0
//        for(var x=0; x<(cropWidth + spaceToAdd); x++) {
//            if(x == 0 && spaceCount.remain) {
//                data[(imgWidth*y + x) * 4]
//            }
//        }
//    }
//
//    // cropTop is the last topmost white row. Above this row all is white
//    // cropBottom is the last bottommost white row. Below this row all is white
//    // cropLeft is the last leftmost white column.
//    // cropRight is the last rightmost white column.
//};

function div(val, by){
    return {
        result: (val - val % by) / by,
        remain: val % by
    }
}