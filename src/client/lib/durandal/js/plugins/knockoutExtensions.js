define(['knockout'], function(ko) {

	var install = function() {

		//Depends on SugarJS
        ko.viewmodel = function (viewmodel, map, createUpdateMethod) {
            Object.keys(map, function(key, value) {
                viewmodel[key] = Object.isArray(value) ? ko.observableArray(value) : ko.observable(value);
            });
            
            if (createUpdateMethod) {
            	viewmodel.update = function(data) {
	            	Object.keys(map, function(key, value) {
	            		if (data[key])
	            			viewmodel[key](value);
	            	});
	            };
            }
        };

		ko.bindingHandlers.enterKey = {
		    init: function(element, valueAccessor, allBindings, data) {
		        var handler = function(data, event) {
		            if (event.keyCode === 13) {
		                valueAccessor().call(data, data, event);
		            };
		        };
		        var newValueAccessor = function() {
		            return { keyup: handler };
		        };
		        ko.bindingHandlers.event.init(element, newValueAccessor, allBindings, data);
		    }
		};

		ko.observableArray.fn.map = function(data, constructor) {
		    this(ko.utils.arrayMap(data, function(i) {
		        return new constructor(i);
		    }));
		};

		ko.observableArray.fn.pushAll = function(items){
		    if(!(items instanceof Array)) return this.peek().length;
		    this.valueWillMutate();
		    ko.utils.arrayPushAll(this.peek(), items);
		    this.valueHasMutated();
		    return this.peek().length;
		};

		ko.subscribable.fn.subscribeChanged = function(callback) {
		    var previousValue;
		    this.subscribe(function(_previousValue) {
		        previousValue = _previousValue;
		    }, undefined, 'beforeChange');
		    this.subscribe(function(latestValue) {
		        callback(latestValue, previousValue );
		    });
		};

		ko.observableArray.fn.subscribeArrayChanged = function(addCallback, deleteCallback) {
		    var previousValue = undefined;
		    this.subscribe(function(_previousValue) {
		        previousValue = _previousValue.slice(0);
		    }, undefined, 'beforeChange');
		    this.subscribe(function(latestValue) {
		        var editScript = ko.utils.compareArrays(previousValue, latestValue);
		        for (var i = 0, j = editScript.length; i < j; i++) {
		            switch (editScript[i].status) {
		                case "retained":
		                    break;
		                case "deleted":
		                    if (deleteCallback)
		                        deleteCallback(editScript[i].value, i);
		                    break;
		                case "added":
		                    if (addCallback)
		                        addCallback(editScript[i].value, i);
		                    break;
		            }
		        }
		        previousValue = undefined;
		    });
		};

		ko.extenders.numeric = function(target, options) {
		    //create a writeable computed observable to intercept writes to our observable
		    var result = ko.computed({
		        read: target,  //always return the original observables value
		        write: function(newValue) {
		            var current = target(),
		                roundingMultiplier = Math.pow(10, options.precision || 0),
		                newValueAsNum = isNaN(newValue) ? 0 : parseFloat(+newValue),
		                valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;
		            if (options.positive){
		                valueToWrite = Math.abs(valueToWrite);
		            }
		            //only write if it changed
		            if (valueToWrite !== current) {
		                target(valueToWrite);
		            } else {
		                //if the rounded value is the same, but a different value was written, force a notification for the current field
		                if (newValue !== current) {
		                    target.notifySubscribers(valueToWrite);
		                }
		            }
		        }
		    });
		 
		    //initialize with current value to make sure it is rounded appropriately
		    result(target());
		 
		    //return the new computed observable
		    return result;
		};
	};

	

    return {
        install: install
    };
});