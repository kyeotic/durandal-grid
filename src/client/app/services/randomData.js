define(function() {
	var getRandomElement = function(array) {
		return array[Math.floor(Math.random()*array.length)];
	};

	var maleFirstNames = ["James", "John", "Robert", "Michael", "William", "David",
		"Richard", "Charles", "Joseph", "Thomas", "Christopher", "Daniel", 
		"Paul", "Mark", "Donald", "George", "Kenneth", "Steven", "Edward",
		"Brian", "Ronald", "Anthony", "Kevin", "Jason", "Matthew", "Gary",
		"Timothy", "Jose", "Larry", "Jeffrey", "Frank", "Scott", "Eric"],
		femaleFirstNames = ["Mary", "Patricia", "Linda", "Barbara", "Elizabeth", 
		"Jennifer", "Maria", "Susan", "Margaret", "Dorothy", "Lisa", "Nancy", 
		"Karen", "Betty", "Helen", "Sandra", "Donna", "Carol", "Ruth", "Sharon",
		"Michelle", "Laura", "Sarah", "Kimberly", "Deborah", "Jessica", 
		"Shirley", "Cynthia", "Angela", "Melissa", "Brenda", "Amy", "Anna"],
		firstNames = maleFirstNames.concat(femaleFirstNames),
		lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller",
		"Davis", "Garcia", "Rodriguez", "Wilson", "Martinez", "Anderson",
		"Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson",
		"Thompson", "White", "Lopez", "Lee", "Gonzalez", "Harris", "Clark",
		"Lewis", "Robinson", "Walker", "Perez", "Hall", "Young", "Allen"];

	var getFirstName = function() { return getRandomElement(firstNames); },
		getMaleName = function() { return getRandomElement(maleFirstNames); },
		getFemaleName = function() { return getRandomElement(femaleFirstNames); },
		getLastName = function() { return getRandomElement(lastNames); },
		getNumber = function(min, max) {
			min = min || 0;
			max = max || 100;
			return parseInt(Math.random() * (max - min) + min, 10);
		},
		getPerson = function() {
			return { firstName: getFirstName(), lastName: getLastName(), age: getNumber() };
		};

	return {
		getFirstName: getFirstName,
		getMaleName: getMaleName,
		getFemaleName: getFemaleName,
		getLastName: getLastName,
		getPerson: getPerson,
		getNumber: getNumber
	};
});