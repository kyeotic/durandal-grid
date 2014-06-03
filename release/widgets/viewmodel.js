/*
 * Durandal Grid 1.0.0 by Timothy Moran
 * Available via the MIT license.
 * see: https://github.com/tyrsius/durandal-grid for details.
 */
define(['durandal/app', 'knockout', 'jquery'], function (app, ko, $) {

	var getColumnsFromData = function(data) {
		var data = ko.unwrap(data) || [];

		if (data.length === 0)
			return [];

		var keys = [];
		for(var prop in data[0]) {
			if(data[0].hasOwnProperty(prop))
				keys.push({ header: prop, property: prop });
		}
		return keys;
	};

	//Removing the SugarJS dependency as slowly as possible
	//May be refactoring this later
	var toNumber = function(input) {
		return parseFloat(input);
	};

	var range = function(bottom, top) {
		var result = [bottom],
			lastIndex = 0;

		while (result[lastIndex] < top) {
			result.push(result[lastIndex++] + 1);
		}
		return result;
	};

	//IE7-8 polyfill
	(function(fn){
		if (!fn.map) fn.map=function(f){var r=[];for(var i=0;i<this.length;i++)r.push(f(this[i]));return r}
	})(Array.prototype);

	//
	//DefaultValues
	//
	var defaults = {
		pageSize: 10,
		pageSizeOptions: [25, 50, 75, 100],
		alwaysShowPaging: false,
		showPageSizeOptions: false
	};

	var Grid = function(config) {
		var self = this,
			columnsBase = ko.observable();

		self.rows = ko.isObservable(config.data) ? config.data : ko.observableArray(config.data || []);
		
		self.columns = ko.computed(function() {
			var unwrappedColumns = ko.unwrap(config.columns),
				unwrappedRows = ko.unwrap(self.rows);
			return (unwrappedColumns || getColumnsFromData(unwrappedRows));
		});

		self.getColumnText = function(column, row) {
			if (!column.property) {
				return '';
			}
			if ('function' === typeof (column.property) && !ko.isObservable(column.property)) {
			    return column.property(row);
			}
			return ko.unwrap(row[column.property]);
		};

		//
		// searching
		//
		self.query = ko.observable("");

		self.searchColumns = ko.computed(function() {
			var columns = self.columns();
			return ko.utils.arrayFilter(columns, function(col) {
				return ko.unwrap(col.canSearch) === true;
			})
		});

		self.showSearchBox = ko.computed(function() {
			return self.searchColumns().length > 0;
		});

		self.filteredRows = ko.computed(function() {
			var rows = self.rows(),
				search = self.query().toLowerCase();

			if(self.searchColumns().length == 0)
				return rows;

			return ko.utils.arrayFilter(rows, function(row) {
				for(var i = 0; i < self.searchColumns().length; i++) {
					if(row[self.searchColumns()[i].property].toLowerCase().indexOf(search) >= 0) {
						return true;
					}
				}
				return false;
			});
		}).extend({ throttle: 50 }); //We don't want typing to cause too many changes 

		
		//sorting
		//
		var customSort;
		self.sortDesc = ko.observable(true);
		self.sortColumn = ko.observable({});
		self.setSortColumn = function (column) {
			if (column.canSort === false)
				return;
			//If column.sort is undefined, it will clear the customSort, which is what we want in that case
			customSort = column.sort;

			//Switch if column is same, otherwise set to true
			self.sortDesc(column == self.sortColumn() ? !self.sortDesc() : true);
			self.sortColumn(column);
		};

		var standardSort = function(a, b, sortProperty) {
			var propA = ko.unwrap(a[sortProperty]),
				propB = ko.unwrap(b[sortProperty]);
			if (propA == propB)
				return 0;
			return propA < propB ? -1 : 1;
		};

		self.sortedRows = ko.computed(function () {
			var sorted = self.filteredRows().slice(), //We don't want to be sorting the original list
				sortDirection = self.sortDesc() ? 1 : -1,
				sortProperty = self.sortColumn().property || '';

			if (sortProperty === '' )
				return sorted;

			var sort;
			if (customSort)
				sort = function(a, b) { return customSort(a, b) * sortDirection; };
			else
				sort = function (a, b) { return standardSort(a, b, sortProperty) * sortDirection; };

			return sorted.sort(sort);
		}).extend({ throttle: 10 }); //Throttle so that sortColumn and direction don't cause double update, it flickers
		
		
		///
		//pagination
		///

		self.pageIndex = ko.observable(0);

		self.pageSize = ko.isObservable(config.pageSize) 
			? config.pageSize 
			: ko.observable(config.pageSize || defaults.pageSize);

		self.alwaysShowPaging = ko.isObservable(config.alwaysShowPaging) 
			? config.alwaysShowPaging 
			: ko.observable(config.alwaysShowPaging || defaults.alwaysShowPaging);

		self.pageSizeOptions = ko.isObservable(config.pageSizeOptions) 
			? config.pageSizeOptions 
			: ko.observable(config.pageSizeOptions || defaults.pageSizeOptions);

		self.showPageSizeOptions = ko.isObservable(config.showPageSizeOptions) 
			? config.showPageSizeOptions 
			: ko.observable(config.showPageSizeOptions || defaults.showPageSizeOptions);

		self.pageCount = ko.computed(function() {
			return self.rows().length / self.pageSize();
		});        

		self.showPaging = ko.computed(function() {
			var alwaysShow = self.alwaysShowPaging(),
				pageCount = self.pageCount();
			return alwaysShow || pageCount > 1;
		});

		self.lastPageIndex = ko.computed(function () {
			return Math.max(Math.ceil(self.sortedRows().length / self.pageSize()) - 1, 0);
		});
		self.currentPageNumber = ko.computed(function () {
			return self.pageIndex() + 1;
		});
		self.pageToFirst = function() {
			self.pageIndex(0);
		};
		self.pageToLast = function() {
			self.pageIndex(self.lastPageIndex());
		};
		self.canPageForward = ko.computed(function() {
			return self.pageIndex() < self.lastPageIndex();
		});
		self.pageForward = function() {
			if (self.canPageForward())
				self.pageIndex(self.pageIndex() + 1);
		};
		self.canPageBackward = ko.computed(function() {
			return self.pageIndex() > 0;
		});

		self.pageBackward = function() {
			if (self.canPageBackward())
				self.pageIndex(self.pageIndex() - 1);
		};
		
		self.currentPageRows = ko.computed({
			read: function () {
				var pageStartIndex = self.pageIndex() * self.pageSize(),
					sortedRows = self.sortedRows();
				if (self.pageIndex() == self.lastPageIndex())
					return sortedRows.slice(pageStartIndex);
				else
					return sortedRows.slice(pageStartIndex, pageStartIndex + self.pageSize());
			},
			deferEvaluation: true
		});

		//This is a safety check. if the page size puts the current pageIndex out of bounds, go to the last page
		//This can hapen when the page size grows
		self.lastPageIndex.subscribe(function(newValue) {
			if (self.pageIndex() > self.lastPageIndex())
				self.pageIndex(self.lastPageIndex());
		});


		var pageCount = 5; //Max index, 5 pages, the logic doesn't work for even numbers
        //The buttons for paginiation
        //Will be buttons for up to 5 pages, with a selected page
        //Selected page will be in the middle, when possible
        self.pageButtons = ko.computed(function() {
            var current = toNumber(self.pageIndex()),
                last = toNumber(self.lastPageIndex()),
                top = last,
                bottom = 0;
            
            if (current === 0) {
                //Get current to either the last page, or pageCount from current
                top = Math.min(pageCount - 1, last);
            } else if (current === last) {
                //Get from either the first page, or pageCount less than current, to current
                bottom = Math.max(0, current - pageCount + 1);
            } else {
                //If it fits, we want pageCount buttons with current in the middle
                //If it won't fit, we want the smaller of pageCount or the total number of pages
                //Because we don't want the number of buttons to shrink in the latter case
                var padding = Math.floor(pageCount / 2);
                
                bottom = Math.max(0, current - padding);
                top = Math.min(last, current + padding);
                
                //There is room to pad more, and we don't have pageCount buttons
                //Pagecount-1 because pagesa re 0 indexed
                while (top - bottom < (pageCount - 1)
						&& last > padding
						&& (top < last || bottom > 0)) {
					if (top < last)
						top++;
					else
						bottom--;
					if (bottom === 0)
						break;
				}
			}

            var pages =  range(bottom, top).map(function(n) {
                return { name: n + 1, isActive: n === current };
            });

            return pages;
        });

		self.goToPage = function(page) {
			self.pageIndex(parseInt(page.name, 10) - 1);
		};
	};


	/*
		This widget can only be bound on a <Table> element in the DOM
		Overridding it's parts can only be done if the un-"processed" <Table> would have legal HTML structure
		Otherwise it will not render correctly in IE
	*/
	return function GridWidget() {
		var self = this;

		self.activate = function(config) {
			//I do this because of the funky things that happen when constructing the grid
			//before you have the observable's you are actually using
			$.extend(self, new Grid(config));
		};
	};
});
