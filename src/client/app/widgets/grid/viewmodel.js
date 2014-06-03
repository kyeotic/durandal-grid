/*
 * Durandal Grid 2.0.0 by Timothy Moran
 * Available via the MIT license.
 * see: https://github.com/tyrsius/durandal-grid for details.
 */
define(['durandal/app', 'knockout', 'jquery'], function (app, ko, $) {


	//====================== Support Code and Polyfills =====================//

	var toNumber = function(input) { return parseFloat(input); };

	var range = function(bottom, top) {
		var result = [bottom],
			lastIndex = 0;

		while (result[lastIndex] < top) {
			result.push(result[lastIndex++] + 1);
		}
		return result;
	};

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

	var fixupColumns = function(columns) {
		if (!(columns instanceof Array))
			throw new Error("Grid columns must be an array");
		return columns.map(function(column) {
			if (typeof column == 'string' || column instanceof String)
				return { property: column, header: column };
			else if (column.property === undefined)
				throw new Error("Columns must contain a property named 'property' so that they can look up their value");
			else
				return column;
		});
	};
	
	//=======================================================================//		

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
		var self = this;

		self.allRows = ko.isObservable(config.data) ? config.data : ko.observableArray(config.data || []);
		
		self.columns = ko.computed(function() {
			var unwrappedColumns = ko.unwrap(config.columns),
				unwrappedRows = ko.unwrap(self.allRows);
			return (unwrappedColumns !== undefined ? fixupColumns(unwrappedColumns) : getColumnsFromData(unwrappedRows));
		});

		self.getColumnText = function(column, row) {
			if (!column.property)
				return '';
			else if (typeof (column.property) === 'function' && !ko.isObservable(column.property))
				return column.property(row);
			else
				return ko.unwrap(row[ko.unwrap(column.property)]);

		};

		//
		// searching
		//
		self.query = ko.observable("");

		self.searchColumns = ko.computed(function() {
			var columnsToSearch = self.columns();
			return ko.utils.arrayFilter(columnsToSearch, function(column) {
				return ko.unwrap(column.canSearch) === true;
			})
		});

		self.showSearchBox = ko.computed(function() {
			return self.searchColumns().length > 0;
		});

		self.filteredRows = ko.computed(function() {
			var rows = self.allRows(),
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
			: ko.observable(config.pageSize !== undefined ? config.pageSize : defaults.pageSize);

		self.alwaysShowPaging = ko.isObservable(config.alwaysShowPaging) 
			? config.alwaysShowPaging 
			: ko.observable(config.alwaysShowPaging !== undefined ? config.alwaysShowPaging : defaults.alwaysShowPaging);

		self.pageSizeOptions = ko.isObservable(config.pageSizeOptions) 
			? config.pageSizeOptions 
			: ko.observable(config.pageSizeOptions !== undefined ? config.pageSizeOptions : defaults.pageSizeOptions);

		self.showPageSizeOptions = ko.isObservable(config.showPageSizeOptions) 
			? config.showPageSizeOptions 
			: ko.observable(config.showPageSizeOptions !== undefined ? config.showPageSizeOptions : defaults.showPageSizeOptions);

		self.pageCount = ko.computed(function() {
			return Math.ceil(self.sortedRows().length / self.pageSize());
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

		//We call this rows because it's actually what the grid binds against
		//And we want the most obvious name for that binding
		self.rows = ko.computed({
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

		self.goToPage = function(page) {
			self.pageIndex(parseInt(page.name, 10) - 1);
		};

		self.stealClasses = config.stealClasses === undefined || config.stealClasses;
		self.gridClasses = ko.observable('');

		self.compositionComplete = function(view, parent) {
			var classes = parent.className;
			if (classes && classes.length > 0 && self.stealClasses) {
				self.gridClasses(classes);
				if (self.stealClasses !== 'copy')
					parent.className = '';
			}
		};
	};

	return function GridWidget() {
		var self = this;

		self.activate = function(config) {
			//I do this because of the funky things that happen when constructing the grid
			//before you have the observable's you are actually using
			$.extend(self, new Grid(config));
		};
	};
});