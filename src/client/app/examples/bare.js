define(['knockout', 'durandal/app', 'services/randomData'], 
function (ko, app, randomData) {

	var data = [],
		peopleToGet = 30;

	while (peopleToGet-- > 0)
		data.push(randomData.getPerson());

	data = data.map(function(n) {
		n.slot = data.indexOf(n) + 1;
		return n;
	});

	return {
		grid1: {data: data},
		grid2: { 
			data: data,
			columns: [ 'firstName', 'Last Name']
		}
	};
});