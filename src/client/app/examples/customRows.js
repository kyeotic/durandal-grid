define(['knockout', 'durandal/app', 'services/randomData'], 
function (ko, app, randomData) {

	var data = [],
		peopleToGet = 20;

	while (peopleToGet-- > 0)
		data.push(randomData.getPerson());

	var observableData = ko.observableArray(data);

	var addRow = function() {
		observableData.push(randomData.getPerson())
	};

	var removeRow = function(row) {
		observableData.remove(row);
	};

	return {
		//Observable Stuff
		addRow: addRow,
		removeRow: removeRow,

		//Grid config options
		gridConfig: { 
			data: observableData,
			pageSize: 5,
			columns: [
				{ header: 'First Name', property: 'firstName' },
				{ header: 'Last Name', property: 'lastName' },
				{ header: 'Age', property: 'age' },
				{ header: '', property: '', canSort: false }
			]
		}
	};
});