define(['knockout', 'durandal/app', 'services/randomData'], 
function (ko, app, randomData) {

	var data = [],
		peopleToGet = 20;

	while (peopleToGet-- > 0)
		data.push(randomData.getPerson());

    return {
        gridConfig: { 
        	data: data,
        	pageSize: 5,
        	showPageSizeOptions: true,
        	pageSizeOptions: [5, 10, 15],
        	columns: [
        		{ header: 'First Name', property: 'firstName' },
        		{ header: 'Last Name', property: 'lastName' },
        		{ header: 'Age', property: 'age', canSort: true, sort: function(a,b) { return a.age < b.age ? -1 : 1; } }
        	]
        }
    };
});