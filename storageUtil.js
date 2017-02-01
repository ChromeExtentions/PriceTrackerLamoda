
function addProduct(request, sendResponseCallback) {

    var settings = window.settings;

    chrome.storage.local.get( ['productList', 'productPrices'], function(productData) {

        var productList = productData.productList;
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
                nextUpdate: nextUpdate.toString(),
                try: null
            };

            var id = product.code;

            if(isEmpty(productList)) {
                productList = {};
            }
            productList[id] = product;
            productList[id].nextUpdate = product.nextUpdate;

            var productPrices = productData.productPrices;
            if(isEmpty(productPrices)) {
                productPrices = {};
            }

            updateProductPrices(productPrices, id, request.price, settings.maxPriceToShow);

            productData.productList = productList;
            productData.productPrices = productPrices;
            chrome.storage.local.set( { productList : productData.productList, productPrices: productData.productPrices },
                function(result) {
                    if(typeof chrome.runtime.lastError != 'undefined') {
                        sendResponseCallback( { result: "Произошла ошибка. Попробуйте еще раз." } );
                    }
                    else {
                         sendResponseCallback({result: "Товар добавлен к отслеживанию"});
                    }
                });
        }
    });

}

function getProductTable(renderCallback) {
    chrome.storage.local.get( ['productList', 'productPrices'], function(productData) {
        if(isEmpty(productData)) {
            productData = {
                productList: {},
                productPrices: {}
            }
        }
        if(isEmpty(productData.productList)) {
            productData.productList = {};
        }
        if(isEmpty(productData.productPrices)) {
            productData.productPrices = {};
        }

        var productTable = [];
        Object.keys(productData.productList).forEach(function(key) {
            var value = productData.productList[key];
            var code = value.code;
            var name = value.name;
            var id = value.code;
            var prices = isEmpty(productData.productPrices[id]) ? [] : productData.productPrices[id];
            productTable.push( { code: code, name: name, prices: prices } );
        });
        renderCallback(productTable);
    });
}

function removeProduct(id, renderCallback, sendResponseCallback) {
    chrome.storage.local.get( ['productList', 'productPrices'], function(productData) {

        if(!isEmpty(productData) && isEmpty(productData.productList) && isEmpty(productData.productPrices)) {
            productData.productList = {};
            productData.productPrices = {};
        }

        delete productData.productList[id];
        delete productData.productPrices[id];

        console.log(productData);

        chrome.storage.local.set( { productList : productData.productList, productPrices: productData.productPrices }, function(result) {
            if(typeof chrome.runtime.lastError != 'undefined') {
                // sendResponseCallback( { result: "Произошла ошибка. Попробуйте еще раз." } );
            }
            else {
                var productTable = [];
                Object.keys(productData.productList).forEach(function(key) {
                    var value = productData.productList[key];
                    var code = value.code;
                    var name = value.name;

                    var id = value.code;
                    var prices = productData.productPrices[id];
                    productTable.push( { code: code, name: name, prices: prices } );
                });
                renderCallback(productTable);
            }
        });
    });
}

function getProductUpdateList() {

    return new Promise( function (resolve, reject) {
        chrome.storage.local.get( ['productList', 'productPrices'], function(productData) {

            var productList = productData.productList;
            if(typeof productList == 'undefined') {
                productList = {};
            }
            var productPrices = productData.productPrices;
            if(isEmpty(productPrices)) {
                productPrices = {};
            }

            var trackList = [];
            Object.keys(productList).forEach(function(key) {
                var value = productList[key];

                if(isTimeToUpdate(value.nextUpdate)) {
                    var code = value.code;
                    var url = value.url;
                    trackList.push( { code: code, url: url } );
                }
            });
            resolve(trackList); // RESOLVE //
        });
    });
}

function randomizeProductUpdateTime(productUpdateList) {

    return new Promise( function (resolve, reject) {

        if(isEmpty(productUpdateList)) {
            return;
        }

        var MAX_PRODUCTS = settings.maxProductCountUpdatePerTime;

        chrome.storage.local.get( ['productList'], function(productData) {

            var productList = productData.productList;
            if(typeof productList == 'undefined') {
                productList = {};
            }

            var subListForRandomize = productUpdateList.slice(MAX_PRODUCTS);
            var resultUpdateList = productUpdateList.slice(0, MAX_PRODUCTS);

            for(var i=0; i<subListForRandomize.length; i++) {
                subListForRandomize[i].nextUpdate = newRandomUpdateTime().toString();
                productList[subListForRandomize[i].code] = subListForRandomize[i];
            }
            chrome.storage.local.set( { productList : productData.productList }, function(result) {
                resolve(resultUpdateList); // RESOLVE //
            });
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

function isTimeToUpdate(dateStringIn) {
    var current = new Date();
    return current.getTime() < Date.parse(dateStringIn);
}

function calcUpdateTime(updateInterval) {
    var currentInMillis = new Date().getTime();
    return new Date(currentInMillis + (new Number(updateInterval))*3600000 + Math.round(3600000*Math.random()));
}

function newRandomUpdateTime() {
    var currentInMillis = new Date().getTime();
    return new Date(currentInMillis + 3600000*Math.random());
}