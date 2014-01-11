define(['durandal/system', 'services/fakeService'], 
function (system, fakeService) {

	var pager = {
		startAt: 0,
		getItems: fakeService.getPeople
	};

	return {
		gridConfig: { 
			data: pager,
			pageSize: 5,
			columns:[
				{ header: 'First Name', property: 'firstName' },
				{ header: 'Last Name', property: 'lastName' },
				{ header: 'Age', property: 'age'
			]
		}
	};
});