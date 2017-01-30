
function addProduct(request, sendResponse) {
    var product = {
        name: request.name,
        code: request.code,
        url: request.url,
        imgBase64: request.imgBase64,
        nextUpdate: calcUpdateTime(),
        try: null
    };


    $.ajax(
        {
            method: "GET",
            url: "http:" + request.imgSrc,
            dataType: 'image/jpg',
            success: function(result) {
                product.imgBase64 = "data:image/jpg;base64," + bufferToBase64(result);

                var id = 'priceChecker_' + product.code;
                chrome.storage.local.set( {id:  product },
                    function() {
                        if(typeof chrome.runtime.lastError != 'undefined') {
                            sendResponse( { result: "Произошла ошибка. Попробуйте еще раз." } );
                        }
                        else {
                            chrome.storage.local.set( {id:  [ request.price ] },
                                function() {
                                    if(typeof chrome.runtime.lastError != 'undefined') {
                                        sendResponse( { result: "Произошла ошибка. Попробуйте еще раз." } );
                                    }
                                    else {
                                        sendResponse({result: "Товар добавлен"});
                                    }
                                });
                        }
                    });
            }
        }
    );
}

function removeProduct() {

}

function storageHasSpace() {

}

function calcUpdateTime() {

}