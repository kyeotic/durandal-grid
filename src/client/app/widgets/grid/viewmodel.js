define(['durandal/app', 'knockout'], function (app, ko) {

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

    /*
        This widget can only be bound on a <Table> element in the DOM
        Overridding it's parts can only be done if the un-"processed" <Table> would have legal HTML structure
        Otherwise it will not render correctly in IE
    */
    return function Grid() {
        var self = this,
            columnsBase = ko.observable();

        self.rows = ko.observableArray();
        self.columns = ko.computed(function() {
            var unwrappedColumns = ko.unwrap(columnsBase),
                unwrappedRows = ko.unwrap(self.rows);
            return (unwrappedColumns || getColumnsFromData(unwrappedRows));
        });

        var setupGrid = function(config) {
            //We wan't all options to be optional and optionally observable
            //So we set the value, and then subscribe if necessary
            self.rows(ko.unwrap(config.data) || []);
            if (ko.isObservable(config.data))
                config.data.subscribe(function(newValue) { self.rows(newValue); });

            columnsBase(ko.unwrap(config.columns));
            if (ko.isObservable(config.data))
                config.columns.subscribe(function(newValue) { columnsBase(newValue); });

            self.pageSize(ko.unwrap(config.pageSize) || defaults.pageSize);
            if (ko.isObservable(config.pageSize))
                config.pageSize.subscribe(function(newValue) { self.pageSize(newValue); });

            self.alwaysShowPaging(ko.unwrap(config.alwaysShowPaging) || defaults.alwaysShowPaging);
            if (ko.isObservable(config.alwaysShowPaging))
                config.alwaysShowPaging.subscribe(function(newValue) { self.alwaysShowPaging(newValue); });

            self.pageSizeOptions(ko.unwrap(config.pageSizeOptions) || defaults.pageSizeOptions);
            if (ko.isObservable(config.pageSizeOptions))
                config.pageSizeOptions.subscribe(function(newValue) { self.pageSizeOptions(newValue); });

            self.showPageSizeOptions(ko.unwrap(config.showPageSizeOptions) || defaults.showPageSizeOptions);
            if (ko.isObservable(config.showPageSizeOptions))
                config.showPageSizeOptions.subscribe(function(newValue) { self.showPageSizeOptions(newValue); });
        };
        
        self.activate = function(config) {
            setupGrid(config);
        };

        self.getColumnText = function(column, row) {
            if (!column.property)
                return '';
            return ko.unwrap(row[column.property]);
        };

        //
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
            //If a layer before sorting every gets introduced (like filtering), this "double" needs to go there
            var sorted = self.rows(),
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
        self.pageSize = ko.observable(defaults.pageSize);        
        self.pageSizeOptions = ko.observable(defaults.pageSizeOptions);
        self.alwaysShowPaging = ko.observable(defaults.alwaysShowPaging);
        self.showPageSizeOptions = ko.observable(defaults.showPageSizeOptions);

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
        self.pageCurrentNumber = ko.computed(function () {
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
                var pageSize = self.pageSize(),
                    pageStartIndex = self.pageIndex() * self.pageSize(),
                    sortedRows = self.sortedRows();
                if (self.pageIndex() == self.lastPageIndex())
                    return sortedRows.slice(pageStartIndex);
                else
                    return sortedRows.slice(pageStartIndex, pageStartIndex + pageSize - 1);
            },
            deferEvaluation: true
        });

        var pageCount = 5; //Max index, 5 pages
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
                while (top - bottom !== pageCount - 1 && (last > padding || bottom > 0)) {
                    if (top < last)
                        top++;
                    else
                        bottom--;
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
});