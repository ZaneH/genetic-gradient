var lwip = require("lwip");
var blessed = require("blessed");

// global "settings"
var desired_output = [255, 255, 255, 100];
var generation_population = 12;
var max_generations = 300;
var threshold = 0.2;

// global variables
var current_generation_species = [[]];
var current_generation = 0;

// final result variable
var result = [[0, 0], 0];

// blessed setup
var screen = blessed.screen({
  smartCSR: true
});
screen.title = "Gradient Genetic Algorithm";

lwip.open("hard.jpg", function(err, image) {
	// check if there is an error
	if (err) return console.log(err);

	// generate some random species (coordinates) for the first generation
	for (var i = 0; i < generation_population; i++) {
		current_generation_species[i] = [[randomCoordinate(), randomCoordinate()], 0];
	}

	for (var gen = 0; gen < max_generations; gen++) {
		addFitnessCalculations();

		// drop the lowest value
		var lowestIndex = 0;
		for (var i = 0; i < generation_population; i++) {
			if (current_generation_species[i][1] < current_generation_species[lowestIndex][1]) {
				lowestIndex = i;
			}
		}
		current_generation_species.splice(lowestIndex, 1);

		// take a random point, cross the x and y, and add it as a new point
		var tempIndex = Math.floor(Math.random() * (generation_population - 1));
		var tempX = current_generation_species[tempIndex][0][0];
		var tempY = current_generation_species[tempIndex][0][1];
		current_generation_species.push([[tempY, tempX], 0]);

		// mutate all species by a few pixels
		for (var i = 0; i < generation_population; i++) {
			// there's a 20% chance each coordinate will be mutated
			if (Math.random() < 0.2) {
				// x or y value mutation? up to chance
				var tempCoord = (Math.random() > 0.5) ? 0 : 1;
				if (Math.random() > 0.5) {
					current_generation_species[i][0][tempCoord] += 2;
				} else {
					current_generation_species[i][0][tempCoord] -= 2;
				}
				// this is to ensure that the x / y value doesn't go above the width
				current_generation_species[i][0][tempCoord] = current_generation_species[i][0][tempCoord] % image.width();
			}
		}

		current_generation++;
		addFitnessCalculations();
		checkPerfectMatch();
		updateTerminal();
	}

	// the generations have finished, now calculate the coordinates with the highest fitness
	for (var i = 0; i < current_generation_species.length; i++) {
		if (current_generation_species[i][1] > result[1]) {
			result = current_generation_species[i];
		}
	}

	updateTerminal();

	function addFitnessCalculations() {
		// give each a fitness value
		for (var i = 0; i < generation_population; i++) {
			current_generation_species[i][1] = calculateFitness(current_generation_species[i][0][0], current_generation_species[i][0][1]);
		}
	}

	function randomCoordinate() {
		return Math.round(Math.random() * (image.width() - 1));
	}

	function calculateFitness(xCoord, yCoord) {
		rgbData = image.getPixel(xCoord, yCoord);
		return (rgbData['r'] + rgbData['g'] + rgbData['b'] + rgbData['a']) / 865;
	}

	function checkPerfectMatch() {
		for (var i = 0; i < generation_population; i++) {
			if (current_generation_species[i][1] == 1 || current_generation_species[i][1] >= 1 - threshold) {
				result = current_generation_species[i];
				return;
			}
		}
	}
});

function updateTerminal() {
	screen.key(['escape', 'q', 'C-c'], function(ch, key) {
		return process.exit(0);
	});

	var infoBox = blessed.box({
	  width: '100%',
	  content: "{bold}Generation:{/bold} " + current_generation + " / " + max_generations + "\n" + "{bold}Desired Output:{/bold} " + desired_output,
	  label: "Information",
	  tags: true,
	  shrink: true,
	  border: {
		type: 'line'
	  }
	});

	var speciesBox = blessed.box({
		top: '6%',
		width: '50%',
		content: JSON.stringify(current_generation_species, null, 4),
		label: "Current Gen",
		tags: true,
		border: {
			type: 'line'
		}
	});

	var finalBox = blessed.box({
		top: '6%',
		left: '50%',
		width: '50%',
		content: JSON.stringify(result, null, 4),
		label: "Results",
		tags: true,
		shrink: true,
		border: {
			type: 'line'
		}
	});

	screen.append(infoBox);
	screen.append(speciesBox);
	screen.append(finalBox);

	screen.render();
}
