
function addProduct(request, sendResponseCallback) {

    var settings = window.settings;

    chrome.storage.local.get( ['productList', 'productPrices'], function(productData) {

        var productList = productData.productList;
        if(typeof productList == 'undefined') {
            productList = {};
        }

        var productCount = sizeOf(productList);
        if(productCount >= settings.maxProductCount) {
            ga(window.settings.GA.tracker + '.send', 'event', window.settings.GA.actions.productLimitReached, request.urll );
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
                lastChangeDate: new Date().toString(),
                tryMissing: null,
                startPrice: request.price
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
                        ga(window.settings.GA.tracker + '.send', 'event', window.settings.GA.actions.trackProduct, request.url );
                        sendResponseCallback( {result: "Товар добавлен к отслеживанию"} );
                    }
                });
        }
    });

}

function checkHasProduct(code, senderResponse) {
    chrome.storage.local.get( ['productList' ], function(productData) {
        var productList = productData.productList;
        if(typeof productList == 'undefined') {
            productList = {};
        }
        senderResponse( { hasProduct: !isEmpty(productList[code]) });
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

        var url = productData.productList[id].url;

        delete productData.productList[id];
        delete productData.productPrices[id];

        chrome.storage.local.set( { productList : productData.productList, productPrices: productData.productPrices }, function(res) {
            var productTable = loadProductTable(productData).sort(byLastUpdate);
            if(!isEmpty(renderCallback)) {
                renderCallback(productTable);
            }
            if(typeof chrome.runtime.lastError == 'undefined') {
                ga(window.settings.GA.tracker + '.send', 'event', window.settings.GA.actions.removeProduct, url );
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

        // Если товар отсутствует
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
                imgBase64: value.imgBase64,
                url: value.url,
                startPrice: value.startPrice,
                oldPrice: oldPrice,
                newPrice: newPrice,
                lastChangeDate: value.lastChangeDate,
                lastUpdateTime: value.lastUpdate,
                nextUpdateTime: value.nextUpdate,
                utm: getUtm()
            }
        );

    });
    return productTable;
}

function promise_getProductUpdateList() {
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

function promise_randomizeProductUpdateTime(productUpdateList) {
    var settings = window.settings;

    return new Promise( function (resolve, reject) {

        if(isEmpty(productUpdateList)) {
            resolve([]);
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
function promise_updatePricesFromSite(updateList) {
    var settings = window.settings;

    return new Promise(function(resolve, reject){
        chrome.storage.local.get( ['productList', 'productPrices'], function(productData) {

            var productList = productData.productList;
            if(isEmpty(productList)) {
                reject("Невозможно обнаружить данные о товарах в хранилище");
            }

            var productPrices = productData.productPrices;
            if(isEmpty(productPrices)) {
                productPrices = {};
            }

            var removeProductUrls = [];

            // changes - набор данныех для отображения уведомлений
            var changes = [];
            for(var i=0; i<updateList.length; i++) {

                var code = updateList[i].code;
                var newPrice = !isEmpty(updateList[i].price) ? updateList[i].price === false ? false : parseInt(updateList[i].price) : null;
                var product = productList[code];
                var changeNotification = null;

                // цена полученная с сайта в процессе обновления
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
                                var url1 = productList[code].url;
                                delete productList[code];
                                delete productPrices[code];

                                removeProductUrls.push(url1);
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
                            var url2 = productList[code].url;
                            delete productList[code];
                            delete productPrices[code];

                            removeProductUrls.push(url2);
                        }
                    }
                }
                // сигнал к удалению товара
                else if(newPrice == false) {
                    changeNotification = {
                        code: product.code,
                        oldPrice: null,
                        newPrice: null
                    };
                    var url3 = productList[code].url;
                    delete productList[code];
                    delete productPrices[code];

                    removeProductUrls.push(url3);
                }
                else if(newPrice == -1) {
                    // Прочие временные ошибки при получении цены -  ничего не делаем
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
                    product.lastChangeDate = new Date().toString();

                    // Формируем уведомления только если цена изменилась
                    // (случаи с отсутствием/появлением/снятием с наблюдения товара пока НЕ ОБРАБАТЫВАЕМ)
                    if( changeNotification.oldPrice != null && changeNotification.newPrice != null) {
                        changeNotification.imgBase64 = product.imgBase64;
                        changeNotification.title = changeNotification.newPrice > changeNotification.oldPrice ? ' Повышение цены на laModa' : 'Скидка на laModa' ;
                        changeNotification.isSale = changeNotification.newPrice < changeNotification.oldPrice;
                        changeNotification.message = (truncateWithEllipsis(product.name, 15) + ' теперь стоит ' + changeNotification.newPrice + ' рублей').replace(/\s+$/, '');;
                        changeNotification.url = product.url;
                        changeNotification.utm = getUtm(product);
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
                    if(removeProductUrls.length > 0 && typeof chrome.runtime.lastError == 'undefined') {
                        for(var j=0; j<removeProductUrls.length; j++) {
                            ga(window.settings.GA.tracker + '.send', 'event', window.settings.GA.actions.removeProductAuto, removeProductUrls[j] );
                        }
                        removeProductUrls = [];
                    }
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
function getUtm(product) {
    return '?utm_source=extention&utm_medium=media&utm_campaign=ProductList';
    //return '?utm_source=extention&utm_medium=media&utm_campaign=ProductList' + '{product_id=' + product.code +'}&utm_term{' + product.position + '}'
}

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
    if(window.settings.testApp === true) {
        return newUpdateTimeTest(updateInterval);
    }
    else {
        var currentInMillis = new Date().getTime();
        return new Date(currentInMillis + (updateInterval)*3600000 + Math.round(3600000*Math.random()));
    }
}

function newUpdateTimeTest(updateInterval) { // Интервал в секундах
    var currentInMillis = new Date().getTime();
    return new Date(currentInMillis + (updateInterval)*1000 + Math.round(30000*Math.random()));
}

function newRandomUpdateTime() {
    var currentInMillis = new Date().getTime();
    if(window.settings.testApp === true) {
        return new Date(currentInMillis + 600000*Math.random());
    }
    else {
        return new Date(currentInMillis + 3600000*Math.random());
    }
}

function byLastUpdate(left, right) {
    return Date.parse(right.lastChangeDate) - Date.parse(left.lastChangeDate);
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