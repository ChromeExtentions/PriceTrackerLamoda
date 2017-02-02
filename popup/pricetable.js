;
$(function() {

    getProductTable(renderCallback);

});

var renderCallback = function(productTable) {
    if(productTable.length == 0) {
        $.get('emptyPriceTable.html', function(result) {
            $('#mainTableBody').html(result);
        });
    }
    else {
        $.get('priceTableItem.html', function(result) {
            renderProductTable(productTable, result);
        });
    }
};

var renderProductTable = function(productTable, itemTemplate) {
    $('#mainTableBody').empty();
    for(var i=0; i<productTable.length; i++) {
        var itemHtml =  $( (' ' + itemTemplate).slice(1) );
        var tdPriceOld = itemHtml.find('.productPriceOld')[0];
        var tdPriceNew = itemHtml.find('.productPriceNew')[0];
        var labelName = itemHtml.find('label.productName')[0];
        var aLink = itemHtml.find('.productLink')[0];
        var productImg = itemHtml.find('img.product')[0];
        var removeButton = itemHtml.find('button.removeProduct')[0];
        var rowId = itemHtml.find('.data-id')[0];

        $(rowId).val(productTable[i].code);
        $(labelName).text(productTable[i].name);
        $(aLink).attr('href', productTable[i].url);
        $(productImg).attr('src', productTable[i].imgSrc);

        var oldPrice = productTable[i].oldPrice;
        var newPrice = productTable[i].newPrice;

        if(oldPrice == null) {
            if(newPrice != null) {
                $(tdPriceOld).text("Новая цена " + newPrice + " руб.");
            }
            else {
                $(tdPriceOld).text("Товар отсутствует в продаже");
            }
        }
        else if(newPrice == null) {
            $(tdPriceOld).text("Товар временно отсутствует. Последняя цена - " + oldPrice + " руб.");
        }
        else {
            $(tdPriceOld).text("Было " + oldPrice + " руб.");
            $(tdPriceNew).text("Стало " + newPrice + " руб.");
        }

        $(removeButton).attr("data-id", productTable[i].code);

        $('#mainTableBody').append(itemHtml);

        $('button.removeProduct').click(function(e) {
            e.preventDefault();
            var productCode = $(this).attr('data-id');
            removeProduct(productCode, renderCallback);
        });
    }
};

//var html = load('priceTableItem.html');

//for(var i=0; i<6; i++) {
//    $('tbody').append(html);
//}
//window.addEventListener('DOMContentLoaded', function () {
//});



//var elem = document.getElementById("productsList");
//
//var trList = elem.children;
//for(var i=trList.length-1; i>=0; i--) {
//    elem.removeChild(trList[i]);
//}

//
// /**
//  * Get the current URL.
//  *
//  * @param {function(string)} callback - called when the URL of the current tab
//  *   is found.
//  */
// function getCurrentTabUrl(callback) {
//   // Query filter to be passed to chrome.tabs.query - see
//   // https://developer.chrome.com/extensions/tabs#method-query
//   var queryInfo = {
//     active: true,
//     currentWindow: true
//   };
//
//   chrome.tabs.query(queryInfo, function(tabs) {
//     // chrome.tabs.query invokes the callback with a list of tabs that match the
//     // query. When the popup is opened, there is certainly a window and at least
//     // one tab, so we can safely assume that |tabs| is a non-empty array.
//     // A window can only have one active tab at a time, so the array consists of
//     // exactly one tab.
//     var tab = tabs[0];
//
//     // A tab is a plain object that provides information about the tab.
//     // See https://developer.chrome.com/extensions/tabs#type-Tab
//     var url = tab.url;
//
//     // tab.url is only available if the "activeTab" permission is declared.
//     // If you want to see the URL of other tabs (e.g. after removing active:true
//     // from |queryInfo|), then the "tabs" permission is required to see their
//     // "url" properties.
//     console.assert(typeof url == 'string', 'tab.url should be a string');
//
//     callback(url);
//   });
//
//   // Most methods of the Chrome extension APIs are asynchronous. This means that
//   // you CANNOT do something like this:
//   //
//   // var url;
//   // chrome.tabs.query(queryInfo, function(tabs) {
//   //   url = tabs[0].url;
//   // });
//   // alert(url); // Shows "undefined", because chrome.tabs.query is async.
// }
//
// /**
//  * @param {string} searchTerm - Search term for Google Image search.
//  * @param {function(string,number,number)} callback - Called when an image has
//  *   been found. The callback gets the URL, width and height of the image.
//  * @param {function(string)} errorCallback - Called when the image is not found.
//  *   The callback gets a string that describes the failure reason.
//  */
// function getImageUrl(searchTerm, callback, errorCallback) {
//   // Google image search - 100 searches per day.
//   // https://developers.google.com/image-search/
//   var searchUrl = 'https://ajax.googleapis.com/ajax/services/search/images' +
//     '?v=1.0&q=' + encodeURIComponent(searchTerm);
//   var x = new XMLHttpRequest();
//   x.open('GET', searchUrl);
//   // The Google image search API responds with JSON, so let Chrome parse it.
//   x.responseType = 'json';
//   x.onload = function() {
//     // Parse and process the response from Google Image Search.
//     var response = x.response;
//     if (!response || !response.responseData || !response.responseData.results ||
//         response.responseData.results.length === 0) {
//       errorCallback('No response from Google Image search!');
//       return;
//     }
//     var firstResult = response.responseData.results[0];
//     // Take the thumbnail instead of the full image to get an approximately
//     // consistent image size.
//     var imageUrl = firstResult.tbUrl;
//     var width = parseInt(firstResult.tbWidth);
//     var height = parseInt(firstResult.tbHeight);
//     console.assert(
//         typeof imageUrl == 'string' && !isNaN(width) && !isNaN(height),
//         'Unexpected respose from the Google Image Search API!');
//     callback(imageUrl, width, height);
//   };
//   x.onerror = function() {
//     errorCallback('Network error.');
//   };
//   x.send();
// }
//
// function renderStatus(statusText) {
//   document.getElementById('status').textContent = statusText;
// }
//
// document.addEventListener('DOMContentLoaded', function() {
//   getCurrentTabUrl(function(url) {
//     // Put the image URL in Google search.
//     renderStatus('Performing Google Image search for ' + url);
//
//     getImageUrl(url, function(imageUrl, width, height) {
//
//       renderStatus('Search term: ' + url + '\n' +
//           'Google image search result: ' + imageUrl);
//       var imageResult = document.getElementById('image-result');
//       // Explicitly set the width/height to minimize the number of reflows. For
//       // a single image, this does not matter, but if you're going to embed
//       // multiple external images in your page, then the absence of width/height
//       // attributes causes the popup to resize multiple times.
//       imageResult.width = width;
//       imageResult.height = height;
//       imageResult.src = imageUrl;
//       imageResult.hidden = false;
//
//     }, function(errorMessage) {
//       renderStatus('Cannot display image. ' + errorMessage);
//     });
//   });
// });
