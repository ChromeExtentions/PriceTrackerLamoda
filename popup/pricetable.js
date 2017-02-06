;
$(function() {

    getProductTable(renderCallback);

    //var _gaq = _gaq || [];
    //_gaq.push(['_setAccount', 'UA-91379404-2']);
    //_gaq.push(['_trackPageview']);
    //
    //var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    //ga.src = 'https://ssl.google-analytics.com/ga.js';
    //var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);


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

        console.log(aLink);
        console.log(productTable[i].url);

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
            $(tdPriceOld).text("Товар временно отсутствует.<br>Последняя цена - " + oldPrice + " руб.");
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
