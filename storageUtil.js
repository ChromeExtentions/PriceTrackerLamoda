
function addProduct(request, sendResponseCallback) {

    var settings = window.settings;

    chrome.storage.local.get( ['productList', 'productPrices'], function(productData) {

        var productList = productData.productList;
        if(typeof productList == 'undefined') {
            productList = {};
        }

        var productCount = sizeOf(productList);
        if(productCount >= settings.maxProductCount) {
            sendResponseCallback( { result: "Лимит отслеживаемых товаров исчерпан" } );
            return;
        }
        else {

            var nextUpdate = newUpdateTime(settings.updateInterval);

            var product = {
                name: request.name,
                code: request.code,
                url: request.url,
                imgSrc: 'http:' + request.imgSrc,
                imgBase64: request.imgBase64,
                nextUpdate: nextUpdate.toString(),
                lastUpdate: new Date().toString(),
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

            if(!isEmpty(request.price)) {
                updateProductPrices(productPrices, id, request.price, settings.maxPriceToShow);
            }

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
        renderCallback( loadProductTable(productData).sort(byLastUpdate) );
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

        chrome.storage.local.set( { productList : productData.productList, productPrices: productData.productPrices }, function(res) {
            var productTable = loadProductTable(productData).sort(byLastUpdate);
            if(!isEmpty(renderCallback)) {
                renderCallback(productTable);
            }
        });
    });
}
function loadProductTable(productData) {
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
        var prices = isEmpty(productData.productPrices[code]) ? [] : productData.productPrices[code];

        var oldPrice = null;
        var newPrice = null;
        if(value.tryMissing > 0) {
            oldPrice = prices.length > 0 ? prices[prices.length-1] : null;

            oldPrice = oldPrice == 0 ? null : oldPrice;
            newPrice = null;
        }
        else {
            oldPrice = prices.length > 0 ? prices.length > 1 ? prices[prices.length-2] : null : null;
            newPrice = prices.length > 0 ? prices[prices.length-1] : null;

            oldPrice = oldPrice == 0 ? null : oldPrice;
            newPrice = newPrice == 0 ? null : newPrice;
        }

        productTable.push(
            {
                code: value.code,
                name: value.name,
                imgSrc: value.imgSrc,
                url: value.url,
                oldPrice: oldPrice,
                newPrice: newPrice,
                lastUpdate: value.lastUpdate
            }
        );

    });
    return productTable;
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
                productList[subListForRandomize[i].code].nextUpdate = newRandomUpdateTime().toString();
            }
            if(subListForRandomize.length > 0) {
                chrome.storage.local.set( { productList : productData.productList }, function(result) {
                    resolve(resultUpdateList); // RESOLVE //
                });
            }
            else {
                resolve(resultUpdateList); // RESOLVE //
            }
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

            // changes - набор данныех для отображения уведомлений
            var changes = [];
            for(var i=0; i<updateList.length; i++) {

                var code = updateList[i].code;
                var newPrice = !isEmpty(updateList[i].price) ? parseInt(updateList[i].price) : null;
                var product = productList[code];
                var changeNotification = null;

                if(newPrice == null) {

                    // Первый раз обнаружено, что цена отсутствует - устанавливаем точку отсчета, т.е. прекращаем обновлять lastUpdate
                    if(product.tryMissing == null) {
                        product.lastUpdate = new Date().toString();
                        product.tryMissing = true;
                    }

                    // Отсутствие цены обнаружено не в первый раз, но товар еще не считается отсутствующим
                    else if(product.tryMissing === true) {
                        var lastUpdateInMillis = Date.parse(product.lastUpdate);
                        var currentDateInMillis = new Date().getTime();

                        // Если цена отсутствует меньше missingAfterDays, то ничего не делаем, ждем пока пройдет missingCheckPeriod
                        if( (currentDateInMillis - lastUpdateInMillis) < (86400000 * settings.missingAfterDays) ) {  // 86 400 000 миллисекунд в сутках
                            productList[code].nextUpdate =  newUpdateTime(settings.updateInterval).toString();
                            product.tryMissing = 0;
                        }
                        // Цена отсутствует более missingAfterDays, теперь считаем товар отсутствующим
                        else {
                            if(settings.trackIfMissing == true) {
                                productList[code].nextUpdate =  newUpdateTime(86400000 * settings.missingCheckPeriod).toString();
                                product.tryMissing = 0;
                            }
                            else {
                                changeNotification = {
                                    code: product.code,
                                    oldPrice: null,
                                    newPrice: null
                                };
                                delete productList[code];
                                delete productPrices[code];
                            }
                        }
                    }
                    // Товар уже считается отсутствующим
                    else if(Number.isInteger(product.tryMissing)) {
                        productList[code].nextUpdate =  newUpdateTime(86400000 * settings.missingCheckPeriod).toString();
                        product.tryMissing++;

                        if(product.tryMissing >= settings.missingCheckTimes) {
                            changeNotification = {
                                code: product.code,
                                oldPrice: null,
                                newPrice: null
                            };
                            delete productList[code];
                            delete productPrices[code];
                        }
                    }
                }
                else if(newPrice == false) {
                    changeNotification = {
                        code: product.code,
                        oldPrice: null,
                        newPrice: null
                    };
                    delete productList[code];
                    delete productPrices[code];
                }
                else if(newPrice == -1) {
                    // Ошибка получения HTML страницы товара -  ничего не делаем
                }
                else {
                    // Есть новая цена
                    changeNotification = updateProductPrices(productPrices, code, newPrice, settings.maxPriceToShow);

                    // Товар отсутсвовал
                    if(product.tryMissing === true || Number.isInteger(product.tryMissing)) {
                        product.tryMissing = null;
                    }
                    product.nextUpdate =  newUpdateTime(settings.updateInterval).toString();
                }

                if(!isEmpty(changeNotification)) {
                    // Формируем уведомления только если цена изменилась
                    // (случаи с отсутствием/появлением/снятием с наблюдения товара пока НЕ ОБРАБАТЫВАЕМ)
                    if( changeNotification.oldPrice != null && changeNotification.newPrice != null) {
                        changeNotification.imgSrc = product.imgSrc;
                        changeNotification.title = changeNotification.newPrice > changeNotification.oldPrice ? ' Повышение цены на laModa' : 'Скидка на laModa' ;
                        changeNotification.message = product.name + ' теперь стоит ' + changeNotification.newPrice + ' рублей';
                        changeNotification.url = product.url;
                        changes.push(changeNotification);
                    }
                }
                // Для следующей итерации
                changeNotification = {};

            } // for(var i=0; i<updateList.length; i++)

            productData.productList = productList;
            productData.productPrices = productPrices;
            chrome.storage.local.set( { productList : productData.productList, productPrices: productData.productPrices },
                function() {
                    resolve(changes); // RESOLVE //
                });
        });
    });
}

function updateProductPrices(productPrices, id, newPrice, maxPrices) {
    var change = {
        code: null,
        oldPrice: null,
        newPrice: null
    };

    var priceArray = productPrices[id];
    if(typeof priceArray == 'undefined' || priceArray.length == 0) {
        // Пока не было ни одной цены на товар
        priceArray = [];
        priceArray.push(newPrice);
        change = {
            code: id,
            oldPrice: priceArray.length > 1 ? priceArray[priceArray.length-2] : null,
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
        oldPrice: priceArray.length > 1 ? priceArray[priceArray.length-2] : 0,
        newPrice: priceArray[priceArray.length-1]
    };
    productPrices[id] = priceArray;
    return change;
}

//===================================== HELPERS ==============================================
function isTimeToUpdate(dateStringIn) {
    var current = new Date();
    return current.getTime() > Date.parse(dateStringIn);
}

function sizeOf(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function newUpdateTime(updateInterval) { // Интервал в часах
//===== PRODUCTION =====
//    var currentInMillis = new Date().getTime();
//    return new Date(currentInMillis + (updateInterval)*3600000 + Math.round(3600000*Math.random()));
//===== PRODUCTION =====

//===== TEST =====
    return newUpdateTimeTest(updateInterval);
//===== TEST =====
}

function newUpdateTimeTest(updateInterval) { // Интервал в секундах
    var currentInMillis = new Date().getTime();
    return new Date(currentInMillis + (updateInterval)*1000 + Math.round(30000*Math.random()));
}

function newRandomUpdateTime() {
    var currentInMillis = new Date().getTime();
    return new Date(currentInMillis + 3600000*Math.random());
}

function byLastUpdate(left, right) {
    return Date.parse(right.lastUpdate) - Date.parse(left.lastUpdate);
}

function priceChanged(priceOld, priceNew) {
    var delta = Math.abs(priceOld - priceNew);

    if(window.settings.changeThresholdUnit == 'rouble') {
        return delta >= window.settings.changeThresholdUnitRub;
    }
    else if(window.settings.changeThresholdUnit == 'percent') {
        return delta/priceOld > window.settings.changeThresholdUnitPercent/100;
    }

    throw "Ошибка при расчете изменения цены";
}

//============= Может пригодится ==================
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