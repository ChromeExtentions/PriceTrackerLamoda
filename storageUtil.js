
function addProduct(request, sendResponseCallback) {

    chrome.storage.sync.get( ['updateInterval', 'maxProductCount', 'maxPriceToShow'], function(settings) {

        chrome.storage.local.get( 'productList', function(result) {

            var productList = result.productList;
            if(typeof productList == 'undefined') {
                productList = {};
            }

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

                chrome.storage.local.set( { productList: productList },
                    function() {
                        if(typeof chrome.runtime.lastError != 'undefined') {
                            sendResponseCallback( { result: "Произошла ошибка. Попробуйте еще раз." } );
                        }
                        else {
                            chrome.storage.local.get( 'productPrices', function(res) {
                                var productPrices = res.productPrices;
                                if(typeof productPrices == 'undefined') {
                                    productPrices = {}
                                }
                                updateProductPrices(productPrices, id, request.price, settings.maxPriceToShow);

                                chrome.storage.local.set( { productPrices: productPrices },
                                    function() {
                                        if(typeof chrome.runtime.lastError != 'undefined') {
                                            sendResponseCallback( { result: "Произошла ошибка. Попробуйте еще раз." } );
                                        }
                                        else {
                                            sendResponseCallback({result: "Товар добавлен"});
                                        }
                                    });
                            });
                        }
                    });
            }
        });
    });
}

function getProductTable(callback) {
    chrome.storage.local.get( ['productList', 'productPrices'], function(result) {

        if(typeof result == 'undefined' || result == null || result.length == 0
            || typeof result.productPrices == 'undefined' || result.productPrices == null || result.productPrices.length == 0) {
            return [];
        }

        var productTable = [];
        Object.keys(result.productList).forEach(function(key) {
            var value = result.productList[key];
            var code = value.code;
            var name = value.name;

            var id = 'priceChecker_' + value.code;
            var prices = result.productPrices[id];
            productTable.push( { code: code, name: name, prices: prices } );
        });
        callback(productTable);
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
function updateProductPrices(productPrices, id, newPrice, maxPrices) {
    var priceArray = productPrices[id];
    if(typeof priceArray == 'undefined' || priceArray.length == 0) {
        priceArray = [];
        priceArray.push(newPrice);
        productPrices[id] = priceArray;
        return;
    }
    if(newPrice == null ) {
        if(priceArray[priceArray.length-1] == null) {
            productPrices[id] = priceArray;
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
            if(priceArray[priceArray.length-1] != newPrice) {
                priceArray.push(newPrice);
            }
        }
    }
    productPrices[id] = priceArray;
}

function calcUpdateTime(updateInterval) {
    var nextUpdate = new Date();
    nextUpdate.setHours( nextUpdate.getHours() + new Number(updateInterval) );
    return nextUpdate;
}