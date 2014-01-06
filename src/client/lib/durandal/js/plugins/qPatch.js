define(['durandal/system', 'durandal/app', 'Q'], function(system, app, Q) {
    
    var install = function (config) {
    	var config = config || {};
    	if (config.debugMode)
    		Q.longStackSupport = true;

    	//This changes Durandal's default promise from jQuery to Q
	    system.defer = function (action) {
	        var deferred = Q.defer();
	        action.call(deferred, deferred);
	        var promise = deferred.promise;
	        deferred.promise = function () {
	            return promise;
	        };
	        return deferred;
	    };
    };

    return {
        install: install
    };
});