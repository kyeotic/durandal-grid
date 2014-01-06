define(['knockout'], function(ko) {
	var install = function() {
		var convertToSimpleJS = function(model) {
	        var result= JSON.parse(ko.toJSON(model));
	        return result;
	    };

	    var getItemById = function(items, idProperty, id) {
	        var setItem;
	        for (var i = 0; i < items.length; i++) {
	            if (items[i][idProperty] === id) {
	                setItem = items[i];
	                break;
	            };
	        }
	        return setItem;
	    };

	    var removeFireSetItem = function(fireSet, childId) {
	        var item = fireSet.child(childId);
	        if (item != null)
	            item.remove();
	        return item;
	    };

	    var isNumber = function(n) {
	      return !isNaN(parseFloat(n)) && isFinite(n);
	    };

	    /*
	        A fire set is an observableArray of a firebase location
	        If you do not specify a config.id property to serve as the
	        'name' of the firebase child, 'id' will be used by default.

	        All sets use firebase priority, to ensure consistent behavior
	        By default, an int priority will be generated for each new item
	        In the set. All methods that would modify the order
	        will take this priority into account. Optionally, you can
	        specify a property of the children to use as the prioirity
	        by setting config.orderBy.
	    */
	    ko.fireSet = function(fireSet, Constructor, config) {
	        var set = ko.observableArray(),
	            config = config || {},
	            idProperty = config.id || 'id',
	            priorityProperty = config.orderBy, //undefined is fine
	            priorityMap = {};

	        //------------------------------------------
	        //-------------Firebase Events--------------
	        //------------------------------------------

	        //Keep a reference to the original set methods
	        var setPush = set.push,
	            setRemove = set.remove,
	            setSplice = set.splice,
	            setUnshift = set.unshift;
	        
	        fireSet.on('child_added', function(item, prevItemId) {
	            var id = item.name(),
	                data = item.val(),
	                child = new Constructor(id, data, fireSet.child(id));

	            //Set the priorty of the item in the map
	            priorityMap[id] = item.getPriority();

	            //If no previous child is given, just add it to the end
	            if (prevItemId === undefined)
	                setPush.call(set, child);
	            //If previous child is given, but null, ordering is on
	            //but this item is the first, so add it to the beginning
	            else if (prevItemId === null)
	                setUnshift.call(set, child);
	            //Otherwise, find the correct index to put it in
	            else {
	                var items = set(),
	                    prevItem = getItemById(items, idProperty, prevItemId),
	                    prevItemIndex = items.indexOf(prevItem);;
	                setSplice.call(set, prevItemIndex + 1, 0, child);
	            }
	        });

	        fireSet.on('child_moved', function(item, prevItemId) {
	            var id = item.name()
	                items = set.peek()
	                setItem = getItemById(items, idProperty, id),
	                oldIndex = items.indexOf(setItem),
	                newIndex = 0;

	            //Set the priorty of the item in the map
	            priorityMap[id] = item.getPriority();

	            var oldItem = setSplice.call(set, oldIndex, 1)[0];

	            //Only try to find the new index if a previous child was given
	            //Otherwise the item has been moved to the front
	            if (prevItemId !== null) {
	                var prevSetItem = getItemById(items, idProperty, prevItemId),
	                    newIndex = items.indexOf(prevSetItem) + 1;
	            }

	            setSplice.call(set, newIndex, 0, oldItem);
	        });
	        
	        fireSet.on('child_removed', function(item) {
	            var id = item.name(),
	                items = set(),
	                setItem = getItemById(items, idProperty, id);

	            //Remove the priority from the map
	            delete priorityMap[id];

	            setRemove.call(set, setItem);
	        });

	        //----------------------------------------
	        //---------------Set Methods--------------
	        //----------------------------------------

	        /*
	            We don't modify the Set() here, we allow the firebase events to
	            do that so that it only happens in a single place. Doing so
	            ensure that security is always enforced, and that ordering is
	            handled properly. We replace all the array modifying methods
	            with ones that just call the proper firebase methods.
	        */

	        set.push = function() {
	            var args = Array.prototype.slice.call(arguments),
	                items = set.peek();

	            //Determine if we are sorting by default, or based on a property
	            //If we are, we don't need to bother trying to add to the beginning or end
	            if (priorityProperty) {
	                args.forEach(function(item) {
	                    fireSet.push().setWithPriority(convertToSimpleJS(item), ko.unwrap(item[priorityProperty]));
	                });
	            } else {
	                var newPriority = 0;

	                //if there are any items
	                if (items.length) {
	                    var lastSetItem = items[items.length - 1];
	                    newPriority = priorityMap[ko.unwrap(lastSetItem[idProperty])];
	                    //Round up to normalize numbers that may have become very precise floats
	                    //Check numeracy to ensure sanity
	                    newPriority = isNumber(newPriority) ? Math.ceil(newPriority) : 0;
	                }
	                
	                args.forEach(function(item) {
	                    newPriority++;
	                    fireSet.push().setWithPriority(convertToSimpleJS(item), newPriority);
	                });
	            }

	            //Just assume everything will add correctly
	            return items.length + arguments.length;
	        };

	        set.pop = function(){
	            var items = set.peek(),
	                item = items[items.length - 1];
	            removeFireSetItem(fireSet, ko.unwrap(item[idProperty]));
	            return item;
	        };    

	        set.shift = function() {
	            var item = set.peek()[0];
	            removeFireSetItem(fireSet, ko.unwrap(item[idProperty]));
	            return item;
	        };

	        set.unshift = function() {
	            var items = set.peek(),
	                itemsToAdd = Array.prototype.slice.call(arguments);

	            //Determine if we are sorting by default, or based on a property
	            //If we are, we don't need to bother trying to add to the beginning or end
	            if (priorityProperty) {
	                itemsToAdd.forEach(function(item) {
	                    fireSet.push().setWithPriority(convertToSimpleJS(item), ko.unwrap(item[priorityProperty]));
	                });            
	            } else {
	                if (items.length) { //Items already present
	                    var sliceItem = items[0],
	                        slicePriority = priorityMap[ko.unwrap(sliceItem[idProperty])],
	                        newPriority = slicePriority / 2;

	                    itemsToAdd.forEach(function(item) {
	                        fireSet.push().setWithPriority(convertToSimpleJS(item), newPriority);
	                         //Get priority inbetween previous and original priority
	                        newPriority = (newPriority + slicePriority) / 2;
	                    });            
	                } else { //No items present, just add everything
	                    var newPriority = 0;
	                    itemsToAdd.forEach(function(item) {
	                        newPriority++;
	                        fireSet.push().setWithPriority(convertToSimpleJS(item), newPriority);
	                    });
	                }
	            }

	            //Just assume everything will add correctly
	            return items.length + arguments.length;
	        };

	        set.remove = function(valueOrPredicate) {
	            var items = set.peek(),
	                removedValues = [];
	            var predicate = typeof valueOrPredicate == "function" && !ko.isObservable(valueOrPredicate)
	                            ? valueOrPredicate
	                            : function (value) { return value === valueOrPredicate; };

	            items.forEach(function(item) {
	                if (predicate(item)) {
	                    removeFireSetItem(fireSet, item[idProperty]);
	                    removedValues.push(item);
	                }
	            });
	            return removedValues;
	        };

	        set.removeAll = function(arrayOfValues) {
	            //If you passed nothing, we should remove everything
	            if (arrayOfValues === undefined) {
	                fireSet.remove();
	                return set().slice(0);
	            } else {
	                return set.remove(function(value) { 
	                    return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0; 
	                });
	            }
	        };
	        
	        set.sort = function(sorter) {
	            //Calling this method when priorityProperty doesn't really do much, so just return
	            if (priorityProperty && !sorter)
	                return set.peek();

	            sorter = sorter && typeof sorter === 'function' || function(left, right) {
	                if (sorter)
	                    return ko.unwrap(left[sorter]) > ko.unwrap(right[sorter]) ? 1 : -1;
	                else
	                    return priorityMap[ko.unwrap(left[idProperty])] > priorityMap[ko.unwrap(right[idProperty])] ? 1 : -1;                
	            };

	            var items = set.peek(),
	                newPriority = Math.floor(priorityMap[ko.unwrap(items[0][idProperty])]),
	                sortItems = items.slice(0).sort(sorter);
	            
	            //
	            sortItems.forEach(function(item) {
	                fireSet.child(ko.unwrap(item[idProperty])).setPriority(newPriority);
	                newPriority++;
	            });
	        };

	        set.reverse = function() {
	            if (priorityProperty)
	                throw new Error("You cannot reverse a fireSet that is sorted on a property.");
	            set.sort(function(left, right) {
	                return ko.unwrap(left[sorter]) > ko.unwrap(right[sorter]) ? -1 : 1;
	            });
	        };

	        set.move = function(oldIndex, newIndex) {
	            var items = set.peek(),
	                item = items[oldIndex],
	                l = items.length,
	                fireChild = fireSet.child(ko.unwrap(item[idProperty])),
	                up = oldIndex > newIndex;

	            //Obviously, you can't move things with less than two items
	            if (l < 2)
	                return;

	            //Negatives are offsets
	            //Use mod to allow for negatives larger than the array to wrap around
	            //The extra mod is to handle the case where % index == l, since that is
	            //Actually outside the array bound, when it should be 0
	            if (newIndex < 0)
	                newIndex = ((newIndex) % l + l) % l;
	            //Values larger than the array will wrap around to the beginning
	            else if (newIndex >= l)
	                newIndex = 0;

	            if (newIndex === 0) {
	                var firstPriority = priorityMap[ko.unwrap(items[0][idProperty])];
	                fireChild.setPriority(Math.floor(firstPriority - 1));
	            } else if (newIndex === (l - 1)) {
	                var lastPriority = priorityMap[ko.unwrap(items[newIndex][idProperty])];
	                fireChild.setPriority(Math.ceil(lastPriority + 1));
	            } else {
	                var left = items[up ? newIndex - 1 : newIndex],
	                    right = items[up ? newIndex : newIndex + 1],
	                    leftPriority = priorityMap[ko.unwrap(left[idProperty])];
	                    rightPriority = priorityMap[ko.unwrap(right[idProperty])],
	                    newPriority = (leftPriority + rightPriority) / 2;
	                fireChild.setPriority(newPriority);
	            }
	        };

	        set.splice = function(index, howMany) {
	            throw new Error("Splice is not currently implemented. You can use move or remove.");
	            /*
	            var items = set.peek(),
	                itemsToAdd = Array.prototype.slice.call(arguments).slice(2), //Only get adds
	                removedItems = [];

	            if (itemsToAdd && priorityProperty)
	                throw new Error("You cannot splice items into a fireSet that is sorted on a property");

	            if (howMany) {
	                //If index is negative, its an offset
	                //We need to get howMany from the total
	                var end = index < 0 ? items.length - index + howMany : index + howMany
	                removedItems = items.slice(index, end);
	                set.removeAll(removedItems);
	            }

	            if (itemsToAdd.length > 0) {
	                 addItemsToSetBeforeIndex(fireSet, priorityMap, idProperty, items, index, itemsToAdd);
	            }

	            return removedItems;
	            */
	        };
	        
	        //Slice is fine, doesn't need to change

	        //return the modified observable array
	        return set;
	    };

	    ko.fireModel = function(model, map, fireRef) {
	        var keys = Object.keys(map);

	        keys.forEach(function(property) {
	            var base = ko.observable(),
	                baseRef = fireRef.child(property);

	            baseRef.on('value', function(snapshot) {
	                base(snapshot.val());
	            });
	            
	            model[property] = ko.computed({
	                read: base,
	                write: function(value) {
	                    baseRef.set(value);
	                }
	            });
	        });
	    };
	};

	return {
		install: install
	}
});