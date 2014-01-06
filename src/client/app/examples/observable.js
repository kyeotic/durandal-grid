define(['knockout', 'durandal/app', 'services/randomData'], 
function (ko, app, randomData) {

	var data = [],
		peopleToGet = 20;

	while (peopleToGet-- > 0)
		data.push(randomData.getPerson());

	var observableData = ko.observableArray(data),
		pageSize = ko.observable(5),
		showPageSizeOptions = ko.observable(true),
		pageSizeOptions = ko.observableArray([5, 10, 15]);

	var addRow = function() {
		observableData.push(randomData.getPerson())
	};

	var pageSizeFlip = false,
		flipPageSizes = function() {
			if (pageSizeFlip)
				pageSizeOptions([5, 10, 15]);
			else
				pageSizeOptions([10, 15, 20]);
			pageSize = !pageSize;
		};

	var togglePageSizeOptions = function() {
		showPageSizeOptions(!showPageSizeOptions());
	};

	var ageColumn = { header: 'Age', property: 'age', canSort: true, sort: function(a,b) { return a.age < b.age ? -1 : 1; } },
		columns = ko.observableArray([
			{ header: 'First Name', property: 'firstName' },
    		{ header: 'Last Name', property: 'lastName' },
    		ageColumn
		]),
		toggleAgeSizeColumn = function() {
			if (columns().indexOf(ageColumn) !== -1)
				columns.remove(ageColumn);
			else
				colummns.push(ageColumn);
		};


    return {
    	//Observable Stuff
    	addRow: addRow,
    	pageSize: pageSize,
    	flipPageSizes: flipPageSizes,
    	togglePageSizeOptions: togglePageSizeOptions,
    	toggleAgeSizeColumn: toggleAgeSizeColumn,

    	//Grid config options
        gridConfig: { 
        	data: observableData,
        	pageSize: pageSize,
        	showPageSizeOptions: showPageSizeOptions,
        	pageSizeOptions: pageSizeOptions,
        	columns: columns
        }
    };
});