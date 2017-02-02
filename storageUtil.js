
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
            var nextUpdate = newUpdateTime(settings.updateInterval);
            var product = {
                name: request.name,
                code: request.code,
                url: request.url,
                imgBase64: request.imgBase64,
                nextUpdate: nextUpdate.toString(),
                lastUpdate: null,
                tryMissing: null
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

function removeProduct(id, renderCallback) {
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

                if(!isEmpty(renderCallback)) {
                    renderCallback(productTable);
                }
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

    var settings = window.settings;

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

//  updateList -> [ { code: code, price: newPrice } ]
function updatePricesFromSite(updateList) {

    var settings = window.settings;

    return new Promise(function(resolve, reject){
        chrome.storage.local.get( ['productList', 'productPrices'], function(productData) {

            var productList = productData.productList;
            if(isEmpty(productList)) {
                throw "Невозможно обнаружить данные о товарах в хранилище";
            }

            var productPrices = productData.productPrices;
            if(isEmpty(productPrices)) {
                productPrices = {};
            }

            var changes = [];
            for(var i=0; i<updateList.length; i++) {

                var code = updateList[i].code;
                var newPrice = new Number(updateList[i].price);
                var product = productList[code];

                if(newPrice == null) {

                    // Первый раз обнаружено, что цена отсутствует - устанавливаем точку отсчета, т.е. прекращаем обновлять lastUpdate
                    if(product.tryMissing == null) {
                        product.lastUpdate = new Date().toString();
                        product.tryMissing = true;
                    }

                    // Отсутствие цены обнаружено не в первый раз, но товар еще не считается отсутствующим
                    else if(product.tryMissing == true) {
                        var lastUpdateInMillis = Date.parse(product.lastUpdate);
                        var currentDateInMillis = new Date().getTime;

                        // Если цена отсутствует меньше missingAfterDays, то ничего не делаем, ждем пока пройдет missingCheckPeriod
                        if( (currentDateInMillis - lastUpdateInMillis) < (86400000 * settings.missingAfterDays) ) {  // 86 400 000 миллисекунд в сутках
                            productList[code].nextUpdate =  newUpdateTime(settings.updateInterval).toString();;
                            product.tryMissing = 0;
                        }
                        // Цена отсутствует более missingAfterDays, теперь считаем товар отсутствующим
                        else {
                            if(settings.trackIfMissing == true) {
                                productList[code].nextUpdate =  newUpdateTime(86400000 * settings.missingCheckPeriod).toString();
                                product.tryMissing = 0;
                            }
                            else {
                                removeProduct(code);
                            }
                        }

                    }
                    // Товар уже считается отсутствующим
                    else if(Number.isInteger(product.tryMissing)) {
                        productList[code].nextUpdate =  newUpdateTime(86400000 * settings.missingCheckPeriod).toString();
                        product.tryMissing++;

                        if(product.tryMissing >= settings.missingCheckTimes) {
                            removeProduct(code);
                        }
                    }
                }
                else {
                    var change = updateProductPrices(productPrices, code, newPrice, settings.maxPriceToShow);
                    if(becomeAvailable(productPrices[code])) {
                        product.tryMissing = null;
                    }
                    productData.productList[code].nextUpdate =  newUpdateTime(settings.updateInterval).toString();
                    if(!isEmpty(change)) {
                        changes.push(change);
                    }
                }
            }

            productData.productList = productList;
            productData.productPrices = productPrices;

            chrome.storage.local.set( { productList : productData.productList, productPrices: productData.productPrices },
                function() {
                    resolve(changes);
                });
        });
    });
}

function updateProductPrices(productPrices, id, newPrice, maxPrices) {
    var change = {
        code: null,
        oldPrice: 0,
        newPrice: 0
    };

    var priceArray = productPrices[id];
    if(typeof priceArray == 'undefined' || priceArray.length == 0) {
        // Пока не было ни одной цены на товар (гипотетическая ситуация, т.к. как правило добавляем в список сразу с ценой)
        priceArray = [];
        priceArray.push(newPrice);
        change = {
            code: id,
            oldPrice: priceArray.length > 1 ? priceArray[1] : 0,
            newPrice: priceArray[priceArray.length-1]
        };
        productPrices[id] = priceArray;
        return change;
    }

    if(priceArray.length >= maxPrices) {
        // Массив цен заполнен, удаляем самую старую цену
        priceArray = priceArray.slice(1);
    }
    if(priceChanged(priceArray[priceArray.length-1], newPrice)) {
        // Цена на товар изменилась
        priceArray.push(newPrice);
    }
    else {
        // Цена на товар не изменилась
        return null;
    }

    change = {
        code: id,
        oldPrice: priceArray.length > 1 ? priceArray[1] : 0,
        newPrice: priceArray[priceArray.length-1]
    };
    productPrices[id] = priceArray;
    return change;
}

//===================================== HELPERS ==============================================
function isTimeToUpdate(dateStringIn) {
    var current = new Date();
    return current.getTime() < Date.parse(dateStringIn);
}

function newUpdateTime(updateInterval) { // Интервал в часах
    var currentInMillis = new Date().getTime();
    return new Date(currentInMillis + (new Number(updateInterval))*3600000 + Math.round(3600000*Math.random()));
}

function newRandomUpdateTime() {
    var currentInMillis = new Date().getTime();
    return new Date(currentInMillis + 3600000*Math.random());
}

//============= Определение состояний товара ==================
function priceChanged(priceOld, priceNew) {
    var delta = priceOld - priceNew;

    if(window.settings.changeThresholdUnit == 'rouble') {
        return delta >= window.settings.changeThresholdUnitRub;
    }
    else if(window.settings.changeThresholdUnit == 'percent') {
        return delta/priceArray[priceArray.length-2] > window.settings.changeThresholdUnitPercent/100;
    }

    throw "Ошибка при расчете изменения цены";
}

function priceUp(priceArray) {
    if(isEmpty(priceArray) || priceArray.length < 2) {
        return false;
    }
    return priceArray[priceArray.length-1] != null && priceArray[priceArray.length-2] != null
        && priceArray[priceArray.length-1] > priceArray[priceArray.length-2];
}

function priceDown(priceArray) {
    if(isEmpty(priceArray) || priceArray.length < 2) {
        return false;
    }
    return priceArray[priceArray.length-1] != null && priceArray[priceArray.length-2] != null
        && priceArray[priceArray.length-1] < priceArray[priceArray.length-2];
}

function stillMissing(priceArray) {
    if(isEmpty(priceArray) || priceArray.length < 2) {
        return false;
    }
    return priceArray[priceArray.length-1] == null || priceArray[priceArray.length-2] == null;
}

function becomeMissing(priceArray) {
    if(isEmpty(priceArray) || priceArray.length < 2) {
        return false;
    }
    return priceArray[priceArray.length-1] == null && priceArray[priceArray.length-2] != null && priceArray[priceArray.length-2] > 0;
}

function becomeAvailable(priceArray) {
    if(isEmpty(priceArray) || priceArray.length < 2) {
        return false;
    }
    return priceArray[priceArray.length-2] == null && priceArray[priceArray.length-1] != null && priceArray[priceArray.length-1] > 0;
}

function isGone(priceArray) {
    if(isEmpty(priceArray) || priceArray.length < window.settings.missingCheckTimes) {
        return false;
    }

    for(var i=priceArray.length-1; i>=priceArray.length - window.settings.missingCheckTimes; i--) {
        if(priceArray[i] != null) {
            return false;
        }
    }
    return true;
}
//=====================================================================================================

//======================= СТАРАЯ ВЕРСИЯ =====================================
//function updateProductPrices(productPrices, id, newPrice, maxPrices) {
//    var change = {
//        code: null,
//        oldPrice: 0,
//        newPrice: 0
//    };
//
//    var priceArray = productPrices[id];
//    if(typeof priceArray == 'undefined' || priceArray.length == 0) {
//        // Пока не было ни одной цены на товар (гипотетическая ситуация, т.к. как правило добавляем в список сразу с ценой)
//        priceArray = [];
//        priceArray.push(newPrice);
//        change = {
//            code: id,
//            oldPrice: priceArray.length > 1 ? priceArray[1] : 0,
//            newPrice: priceArray[priceArray.length-1]
//        };
//        productPrices[id] = priceArray;
//        return change;
//    }
//    if(newPrice == null ) {
//        if(priceArray[priceArray.length-1] == null) {
//            //Товара как не было так и нет
//            return null;
//        }
//        else {
//            //Товар был, но снят с продажи
//            priceArray.push(null);
//        }
//    }
//    else {
//        if(priceArray[priceArray.length-1] == null) {
//            // Товар поступил в продажу после отсутствия
//            priceArray[priceArray.length-1] = newPrice;
//        }
//        else {
//            if(priceArray.length >= maxPrices) {
//                // Массив цен заполнен, удаляем самую старую цену
//                priceArray = priceArray.slice(1);
//            }
//            if(priceArray[priceArray.length-1] != newPrice) {
//                // Цена на товар изменилась
//                priceArray.push(newPrice);
//                productPrices[id] = priceArray;
//            }
//            else {
//                // Цена на товар не изменилась
//                return null;
//            }
//        }
//    }
//    change = {
//        code: id,
//        oldPrice: priceArray.length > 1 ? priceArray[1] : 0,
//        newPrice: priceArray[priceArray.length-1]
//    };
//    productPrices[id] = priceArray;
//    return change;
//}