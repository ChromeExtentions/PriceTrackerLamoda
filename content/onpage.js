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
    // var TRACK_BUTTON_HEIGHT = 80;
    // var lamodaConsultantContainer = $('#cleversite_clever_container');
    var buttonPath = chrome.extension.getURL("content/trackButton.html");
    $.get(buttonPath, function(data){

        var templateHtml =  $( (' ' + data).slice(1) );
        setLogoImagePath(templateHtml);

        if(hasProduct === true) {
            $(templateHtml).find('#trackProductLabelTd').text( chrome.i18n.getMessage("productHasBeenAdded") );
        }

        $(templateHtml).css("top", 160);
        //$(templateHtml).drags();
        $('body').append(templateHtml);
        if(hasProduct !== true) {
            bindClickEventListener()
            addButtonMessage();
        }
        else {
            addButtonHasProductMessage();
        }

        //-- Старый функционал добавления кнопки - попытка прикрепления к консультанту
        // if( (typeof lamodaConsultantContainer != 'undefined' &&  $(lamodaConsultantContainer).find('div').length > 0)) {
        //     var lamodaConsultantPosition = lamodaConsultantContainer.position();
        //     var topButtonCoord = lamodaConsultantPosition.top - TRACK_BUTTON_HEIGHT;
        //
        //     // Хак чтоб не глючило положение кнопки по вертикали
        //     console.log(isEmpty(lamodaConsultantPosition) ? lamodaConsultantPosition.top : '');
        //
        //     $(templateHtml).css("top", topButtonCoord);
        //     //$(templateHtml).drags();
        //     $('body').append(templateHtml);
        //     if(hasProduct !== true) { bindClickEventListener() };
        //     addButtonMessage();
        // }
        // else if(window.maxConsultantAttachAttempts == 0) {
        // // Если отсутствует кнопка консультант
        //     $(templateHtml).css("top", 160);
        //     //$(templateHtml).drags();
        //     $('body').append(templateHtml);
        //     if(hasProduct !== true) { bindClickEventListener() };
        //     addButtonMessage();
        // }
        // else {
        //     // Раз в секунду пытаемся прицепить кнопку к консультанту
        //     window.maxConsultantAttachAttempts--;
        //     setTimeout( function() {
        //         addTrackButton(hasProduct);
        //     }, 1000);
        // }
    });
}


function setLogoImagePath(templateHtml) {
    var imgPath = chrome.extension.getURL("img/logo80.png");
    $(templateHtml).find("#logoImage").attr("src", imgPath);
}

function bindClickEventListener() {
    $('#trackButtonBody').click(function(e) {
        var forSave = getProductData();

        getSmallImage(forSave, 80, 80).then( // 80x80 изображение, которое будет отображаться в уведомлении и в списке товаров
            function() {
                sendProductInfo(forSave);
            },
            function() {
                forSave.imgBase64 = getLogoBase64();
                sendProductInfo(forSave);
            }
        );

    });
}

function sendProductInfo(forSave) {
    chrome.runtime.sendMessage( forSave , function(response) {
        var msg = isEmpty(response.result) ?  chrome.i18n.getMessage("unknownError") : response.result;
        $('#trackProductLabelTd').text(response.result);
    });
}

function addButtonMessage() {
    chrome.runtime.sendMessage( { showTrackButton: true, hasProduct: false, url: document.URL } , function() {});
}

function addButtonHasProductMessage() {
    chrome.runtime.sendMessage( { showTrackButton: true, hasProduct: true, url: document.URL } , function() {});
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

            var url = 'https://images.weserv.nl/?url=' + forSave.imgSrc + '&w=' + wantedWidth + '&h=' + wantedHeight + '&t=fit';
            oReq.open("GET", url, true);
            oReq.responseType = "arraybuffer";
            oReq.onload = function(oEvent) {

                if(oReq.status == 200) {
                    var arrayBuffer = oReq.response;
                    var byteArray = new Uint8Array(arrayBuffer);
                    var img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = function() {
                        var can = document.getElementById('resizedCanvas');
                        can.width  = 80;
                        can.height = 80;
                        var ctx = can.getContext('2d');
                        ctx.fillStyle="#FFFFFF";
                        ctx.fillRect(0,0,80,80);

                        var width = img.width;
                        var height = img.height;
                        var leftCoord = (80 - width)/2;
                        ctx.drawImage(img, leftCoord, 0, width, height);

                        forSave.imgBase64 = can.toDataURL();

                        //------ Send product data to extention ---------
                        resolve(forSave);
                    };
                    img.src = "data:image/png;base64," + base64ArrayBuffer(byteArray);
                }
                else {
                    reject('error');
                }
            };
            try {
                oReq.send();
            }
            catch(e) {
                reject('error');
            }
            oReq.onerror = function () {
                reject('error');
            };
        });
    }
}

function getSmallImageOuterService(forSave, wantedWidth, wantedHeight) {
    return new Promise( function(resolve, reject) {
        var url = 'https://images.weserv.nl/?url=' + forSave.imgSrc + '&w=' + wantedWidth + '&h=' + wantedHeight + '&t=fit';
        //var url = 'https://images.weserv.nl/?url=' + forSave.imgSrc + '&w=' + wantedWidth + '&h=' + wantedHeight + '&t=square&a=bottom';

        var oReq = new XMLHttpRequest();
        oReq.open("GET", url, true);
        oReq.responseType = "arraybuffer";
        oReq.onload = function(oEvent) {
            if(oReq.status == 200) {
                var arrayBuffer = oReq.response;
                var byteArray = new Uint8Array(arrayBuffer);
                forSave.imgBase64 = "data:image/png;base64," + base64ArrayBuffer(byteArray);
                resolve(forSave);
            }
            else {
                reject('failed');
            }
        };
        try {
            oReq.send();
        }
        catch(e) {
            reject('error');
        }
        oReq.onerror = function () {
            reject('error');
        };
    });
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

function getLogoBase64() {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAQAAAAkGDomAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAHdElNRQfhAg4HEjowZPkwAAAFfklEQVRo3u3XW4xdVR3H8c/eZ2Z6mV6m16Fji6WMbQab0RTxVjOW0jYZJEHiJUEoARoq8UXTxAdJSETUJ31QjAaDRkEJMVpCLDIdiYi3MGmnMrZAO1RLLQXKMFg6nWk7PecsH846t5naixYezP4+nLP2Xrff/7/W+v/XJiMjIyMjIyMjIyMjIyMjI+O/JVf3lEjfcQXJ+VanEkXhHRSWSATFszerejAIEu04cS6rLhJBEEwRzuaWhmhNcJUNVrnOp/1aqvA2i0st1GqFdabb5JTk7GuX4CaPyRuzgrd5JyZYaIcgL3hWk3PuxFKD6Q54SfP5NP+fabTSNkGw8+wCy75KcIl322f0XO6+KAR7/LJOwXkIXCax59xdLhrnNU9DTbkDuycMkUR7i9GMRKJQqSm9T6TChCBVDiIJk4JXIpU607KW43BN8KkVuBJ7icOlE2JUSVCIkxcrbxOhcubLm6MkS12bqtFBQYJTE8QlipNGqoSZAlYac7AyTFHiKlcrGPCigwLmuMJav7DPap9T9IABwRQ3WuMffuRw9FqQ6vJJlzqg1+/kKxOmimZZZ62cJRPML5rlUz5qyM89V38SErR4w0B0fYp2j/irAccFj2Cl3xqUV9TlXkFRMGyVOX5fCRitSqF/vocEfR5yQrBVa5wjxTq7Bdvtir12aQI5t9hj0Khg2Jr6PZqiMwpJ5fAxL/ma2bhJcC8W+ZkgOGFAn8edlBf0ecYz/qBoXHA3Es16BLvNw2ZB8ISmKP0GxwVfRpPHhIrA6X4s6MEmQfAXDbW7NIfPCO5CIzqM+EYs3ym4AVziFUHwTfBdwbjg82jSIwieAncLUWxqhr2C4Aug3WHBDlPlcFsUOA1fEeI8bQ4LxqwsOa7qxivwXNzc3zPs6/H9B7EPnDYOHgdb0eio32Dc1mhCoxa3g37kHLcTbNSILdrwtJN1hzPgIF6zE28YwlQLSh5sqDTpxH4UdFvrLic0OI33ed3LlVYwDbzplCkaNYNh0Oi0Ky1F3lBcor/HCNFmyHVUzK1SxMOGjTuE98Qd21A9xYmiRu91xCFwG3pi5xVWecoxaU00qw0+k69L7QgKTkWThlA0w1zNFgsSb5lMqlew3J26za6vKKe5ZQYdwwLX+Kf9sX5zXPjzzy7NCHKVDDtWqWmJ8bPxDL2KPuRhf9NlU72Hy2flco0xi3SYa8CIBnmr3YpBF3J9GEFRg5b4XAov4960MPp08STvsd6vzLTbNY5XYnOlktIReR4sxRHktdqiDy/GgZOaKcv/k4W/oJzZS8wEBxz2uqMasCaOV3sP2GwmnvaWGZPVB6xCnxW6NOE0cu7T61UM+LhlSkmqKrAU6UOdxIJm/XbL4SNx9JK/tsk7aAcKNrjWuGqqy2MOse2Y07WuKwvswAf8RGIcl5riAcPu92H/cod7jBJTfGnAcl5W90vOCd8B6y1xUmoVXvZ9cF+c84du0el6BIutVdrned1utsHl4FY3mlV18YBgzEZ0C055zYNoMyQ46P3ocH9MTtvMt8iD8emnFurwR0FRwbe04tuC4FGX2SI46hPK95+vCoqKgmP2VMpftNyooCDY49k48p+iXyXodcg6MM2TRtyjAfO94Ent4A79tuvVY4fV1uvXY7vt+l3tdrs8oVevPl3IudmfjTjiFVtdWVmwBBvtMmK/bp816Ac269KK6z1v1KPadNrrVV8ytXaPL7KgYuVcS5SuP7zLVBd6hS31bLJUp7YJRynFdB3moaW8hLHFbMvjxWGexWc6gGlduXpWL/yGncj9x/5p3X8qF+dKK62TWgW1ISNUytULaVrz1Vq1KJzjqepHJn/1li6woW7O2vf1CjIyMjIyMjIyMjIyMjIyMjL+f/k38G/YPLLt7OoAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTctMDItMTRUMDc6MTg6NTgtMDU6MDANISr6AAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE3LTAyLTE0VDA3OjE4OjU4LTA1OjAwfHySRgAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAAASUVORK5CYII=';
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

    return base64;
}


function div(val, by){
    return {
        result: (val - val % by) / by,
        remain: val % by
    }
}

//function getImageCoordsNoBlanks (context, canvas, imgWidth, imgHeight) {
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
//    return {
//        cropTop: scanY(true),
//        cropBottom: scanY(false),
//        cropLeft: scanX(true),
//        cropRight: scanX(false)
//    };

    //var cropWidth = crops.cropRight - crops.cropLeft;
    //var cropHeight = crops.cropBottom - crops.cropTop;
    //
    //var spaceToAdd = cropWidth - cropHeight;
    //if(spaceToAdd == 0) {
    //    return;
    //}
    //
    //var newImageData = [];
    //
    //// Надо добавить по ширине
    //if(spaceToAdd > 0) {
    //    var spaceCount = div(spaceToAdd, 2);
    //    if(spaceCount.remain > 0) {
    //        var
    //    }
    //        var x = 0
    //    for(var x=0; x<(cropWidth + spaceToAdd); x++) {
    //        if(x == 0 && spaceCount.remain) {
    //            data[(imgWidth*y + x) * 4]
    //        }
    //    }
    //}

    // cropTop is the last topmost white row. Above this row all is white
    // cropBottom is the last bottommost white row. Below this row all is white
    // cropLeft is the last leftmost white column.
    // cropRight is the last rightmost white column.
//};
