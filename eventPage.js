;

//--- Загрузка настроек расширения
    window.settings = {};
    applySettings();

    unlock();

//--- Запуск периодической фоновой задачи (выполняется каждую минуту)
    addAlarm();

//--- Слушатель запуска фоновой задачи
    chrome.alarms.onAlarm.addListener(onAlarmListener);

//--- Слушатель входящих сообщений (с сайта: добавить товар)
    chrome.runtime.onMessage.addListener(onMessageListener);

    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-91379404-02', 'auto');
    ga('create', 'UA-91379404-02', 'lamoda.ru', 'myTracker', {
        transport: 'beacon'
    });
    ga('myTracker.set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
    ga('myTracker.require', 'displayfeatures');
    //ga('myTracker.send', 'event', 'link', 'click', '/option/options.html');

function applySettings() {
    applyEmbeddedSettings();
    // Здесь назначение настроек из хранилища, когда нужно будет
    //chrome.storage.sync.set( window.settings , function(result) {
    //});
}

function addAlarm() {
    var alarmInfo = chrome.storage.local.get('priceChecker_task', function() {});
    if(typeof alarmInfo == 'undefined' || alarmInfo == null || alarmInfo.periodInMinutes == 'undefined' || alarmInfo.periodInMinutes == null) {
        alarmInfo = { when: 1000, periodInMinutes: 1 };
        chrome.alarms.create('priceChecker', alarmInfo);
        chrome.storage.local.set( {'priceChecker_task':  alarmInfo });
    }
}

//=============================== ВОТ ТУТ ВСЕ ОТСЛЕЖИВАНИЕ И ПРОИСХОДИТ ===================================
function onAlarmListener() {
    // Создаем лок, чтобы фоновые задачи не запускались одновременно
    chrome.storage.local.get( 'priceChecker_lock', function(result) {
        if(isEmpty(result.priceChecker_lock) || result.priceChecker_lock === false) {
            chrome.storage.local.set( {'priceChecker_lock':  true }, function() {
                process();
            });
        }
    });
}

function process() {
    promise_getProductUpdateList()
        .then(promise_randomizeProductUpdateTime, unlock)
        .then(promise_downloadProductUpdates, unlock)
        .then(promise_updatePricesFromSite, unlock)
        .then(promise_fireNotifications, unlock)
        .then(unlock, unlock);
}

function unlock() {
    chrome.storage.local.set( {'priceChecker_lock':  false });
}

// Сообщение со страницы о добавлении товара
function onMessageListener(request, sender, sendResponse) {
    if(request.hasOwnProperty('article')) {
        checkHasProduct(request.article, sendResponse);
        return true; // Чтобы получатель ждал ответа
    }

    try {
        addProduct(request, sendResponse);
    }
    catch(err) {
        sendResponse( { result: "Произошла ошибка. Попробуйте еще раз." } );
        return;
    }
    return true; // Чтобы получатель ждал ответа
}


function promise_fireNotifications(changes) {
    return new Promise(function(resolve, reject) {
        for(var i=0; i<changes.length; i++) {
            fireSingleNotification(changes[i]);
        }
        //Promise.all(changes.map(fireSingleNotification)).then(
        //    function(results) {
        //        resolve(results);
        //    }
        //);
        resolve({});
    });
}

function getOptions(change) {
    return {
        type: 'basic',
        iconUrl: !isEmpty(change.imgBase64) ? change.imgBase64 : 'img/logo.png',
        title: change.title,
        message: change.message,
        isClickable: true,
        requireInteraction: true
    };
}

function fireSingleNotification(change) {
    //return new Promise(function(resolve, reject) {
        chrome.notifications.create('priceChangedNotification' + change.code, getOptions(change),
            function callback(createdId) {

                // Событие оповещения для Google analytics
                // ga('myTracker.send', 'event', 'link', 'click', '/option/options.html');

                var handler = function(id) {
                    if(id == createdId) {
                        var utm = '?utm_source=extention&utm_medium=media&utm_campaign=Notification';
                        chrome.tabs.create({ url: change.url + utm});
                        chrome.notifications.clear(id);
                        chrome.notifications.onClicked.removeListener(handler);

                        // Событие перехода по оповещению для Google analytics
                        // ga('myTracker.send', 'event', 'link', 'click', '/option/options.html');
                    }
                };
                chrome.notifications.onClicked.addListener(handler);
                //resolve({});
            });
    //});
}

function promise_downloadProductUpdates(productUpdateList){
    return new Promise(function(resolve, reject) {
        if(isEmpty(productUpdateList)) {
            resolve([]);
        }

        var params = [];
        for(var i=0; i<productUpdateList.length; i++) {
            params.push({
                index: i,
                product: productUpdateList[i]
            });
        }

        Promise.all(params.map(loadProduct)).then(
            function(results) {
                resolve(results);
            }
        );
    });
}

function loadProduct(param) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            download(param).then( function(result) { resolve(result) } );
        }, param.index * 2000);
    });
}

function download(params) {
    return new Promise(function(resolve, reject) {
        $.ajax(
            {
                url: params.product.url,
                type: "GET",
                statusCode: {
                    404: function() {
                        resolve( { code: params.product.code, price: false } );
                    }
                }
            }
        ).done( function(response)
            {
                resolve( { code: params.product.code, price: parsePrice(response, params.product.code) } );
            }
        ).fail(function(response) {
            if(response.status == 404) {
                resolve( { code: params.product.code, price: false } );
            }
            else {
                resolve( { code: params.product.code, price: -1 } );
            }
        });
    });
}

 function parsePrice(response, productCode) {
     if(window.settings.testApp === true) {
        var page =  $( (' ' + response).slice(1) );
        var productDivSearchStr = 'td#productPrice';
        return $(page).find(productDivSearchStr).attr('data-current');
     }
     else {
         var page =  $( (' ' + response).slice(1) );
         var productDivSearchStr = 'div.ii-product[data-sku="' + productCode + '"]';
         return $(page).find(productDivSearchStr).find('div.ii-product__price').attr('data-current');
     }
 }