
function addProduct(request, sendResponseCallback) {

    chrome.storage.sync.get( ['updateInterval', 'maxProductCount', 'maxPriceToShow'], function(settings) {

        chrome.storage.local.get( 'productList', function(productList) {

            var productCount = productList.length;
            if(productCount >= settings.maxProductCount) {
                sendResponseCallback("Лимит отслеживаемых товаров исчерпан");
                return;
            }
            else {
                var nextUpdate = calcUpdateTime(settings.updateInterval);
                var product = {
                    name: request.name,
                    code: request.code,
                    url: request.url,
                    imgBase64: request.imgBase64,
                    nextUpdate: nextUpdate,
                    try: null
                };

                var id = 'priceChecker_' + product.code;
                if(typeof productList == 'undefined') {
                    productList = {};
                }
                productList[id] = product;

                chrome.storage.local.set( productList,
                    function() {
                        if(typeof chrome.runtime.lastError != 'undefined') {
                            sendResponseCallback( { result: "Произошла ошибка. Попробуйте еще раз." } );
                        }
                        else {
                            chrome.storage.local.get( 'productPrices', function(productPrices) {
                                if(typeof productPrices == 'undefined') {
                                    productPrices = {}
                                }
                                updatePrices(productPrices, id, request.price, settings.maxPriceToShow);
                            });

                            chrome.storage.local.set( {id:  [ request.price ] },
                                function() {
                                    if(typeof chrome.runtime.lastError != 'undefined') {
                                        sendResponseCallback( { result: "Произошла ошибка. Попробуйте еще раз." } );
                                    }
                                    else {
                                        sendResponseCallback({result: "Товар добавлен"});
                                    }
                                });
                        }
                    });
            }
        });
    });
}

function removeProduct(id, sendResponseCallback) {
    chrome.storage.local.get( 'productList', function(result) {
        delete result.id;
        chrome.storage.local.set( { 'productList': result }, function(result) {
            sendResponseCallback({result: "success"});
        });
    });
}


//===================================== HELPERS ==============================================
function updatePrices(productPrices, id, newPrice, maxPrices) {
    var priceArray = productPrices[id];
    if(priceArray.length == 0) {
        priceArray.push(newPrice);
        return;
    }
    if(newPrice == null ) {
        if(priceArray[priceArray.length-1] == null) {
            return;
        }
        else {
            priceArray.push(null);
        }
    }
    else {
        if(priceArray[priceArray.length-1] == null) {
            priceArray[priceArray.length-1] = newPrice;
        }
        else {
            if(priceArray.length >= maxPrices) {
                priceArray = priceArray.slice(1);
            }
            priceArray.push(newPrice);
        }
    }
    productPrices[id] = priceArray;
}

function calcUpdateTime(updateInterval) {
    var nextUpdate = new Date();
    nextUpdate.setHours( nextUpdate.getHours() + new Number(updateInterval) );
    return nextUpdate;
}