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
        return obj.length <= 0;
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