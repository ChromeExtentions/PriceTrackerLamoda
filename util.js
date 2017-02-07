;

function isEmpty(obj) {
    if(typeof obj == 'undefined' || obj == null) {
        return true;
    }

    if(typeof obj == 'string') {
        return obj.length == 0;
    }

    if(Object.prototype.toString.call( obj ) === '[object Array]') {
        return obj.length <= 0;
    }

    if(Object.prototype.toString.call( obj ) === '[object Object]') {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size == 0;
    }

    return false;
};

function isDefined(obj) {
    return !(typeof obj == 'undefined' || obj == null);
};

function sleep(ms) {
    var start = new Date().getTime(), expire = start + ms;
    while (new Date().getTime() < expire) { }
    return;
}