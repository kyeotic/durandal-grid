define(['durandal/app', 'durandal/system', 'services/randomData'], 
function(app, system, randomData) {
	return {
		getPeople: function(count, skip) {
			//This is just a mock
			//But we are mocking a web call, so we return a promise
			return system.defer(function(dfd){
				setTimeout(function() {
					var data = [];
					while (count-- > 0)
						data.push(randomData.getPerson());
					dfd.resolve(data);
				}, 750);
	        }).promise();
		}
	}
})