define(['durandal/app', 'knockout', 'jquery'],
function (app, ko, $) {
    
    var convertjQueryError = function (jqXHR) {
        var message;
        try {
            message = JSON.parse(jqXHR.responseText).responseStatus.message;
        } catch (e) {
            message = jqXHR.statusText;
        } 
        return {
            message: message,
            status: jqXHR.status,
            statusText: jqXHR.statusText
        };
    };

    var globalError = function (callback) {
        return function (jqXHR) {
            callback.call(null, convertjQueryError(jqXHR));
        };
    };

    var httpDataType = ['POST', 'PUT'];
    var deferAjax = function(httpVerb, url, data) {
        var ajaxCall = {
            type: httpVerb,
            url: url,
            dataType: 'json'
        };

        if (httpDataType.indexOf(httpVerb) !== -1) {
            ajaxCall.data = ko.toJSON(data);
            ajaxCall.contentType = "application/json; charset=utf-8";
        }

        return app.defer(function(deferred) {
            ajaxCall.success = function (response) {
                deferred.resolve(response);
            };
            ajaxCall.error = function(jqXhr) {
                var newError = convertjQueryError(jqXhr);
                deferred.reject(newError);
            };

            $.ajax(ajaxCall);
        }).promise();
    };

    var promiseGet = function (url) {
        return deferAjax('GET', url);
    };

    var promisePost = function (url, data) {
        return deferAjax('POST', url, data);
    };

    var promisePut = function (url, data) {
        return deferAjax('PUT', url, data);
    };

    var promiseDelete = function (url) {
        return deferAjax('DELETE', url);
    };
    
    return {
        get: promiseGet,
        remove: promiseDelete,
        post: promisePost,
        put: promisePut,
    };
});
