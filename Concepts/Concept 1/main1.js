let Wines = { winecolorboxes: null };

$(document).ready(function () {
	var promise = new Promise(function (resolve, reject) {
		$.getJSON("../../datasets/sortedwines.json", function (data) {
			resolve(data);
		}).fail(function (jqXHR, textStatus, errorThrown) {
			reject(errorThrown);
		});
	});

	promise
		.then(function (winedata) {
			let winesByVariety = {};
			let winevarietys = [];
			let filteroption;
			filteroption = filter(winedata, winesByVariety); // Pass 'winedata' as a parameter to the 'filter' function

			winesByCountryAndVariety(winedata, winesByVariety, winevarietys);
			draw(winesByVariety, winevarietys, filteroption);
		})
		.catch(function (error) {
			console.log("fail " + error);
		});
});

function winesByCountryAndVariety(winedata, winesByVariety, winevarietys) {
	// Iterate over all wines and calculate the average values for each variety for each country
	winedata.forEach(function (wine) {
		let country = wine.country;
		let variety = wine.variety;
		let sweetness = wine.sweetness;
		let fruitiness = wine.fruitiness;
		let herbalCount = 0;
		let fruityCount = 0;

		if (!winevarietys.includes(variety)) {
			var varietyCount = 0;
			for (var i = 0; i < winedata.length; i++) {
				if (winedata[i].variety === variety) {
					varietyCount++;
					if (varietyCount >= 1) {
						winevarietys.push(variety);
						break;
					}
				}
			}
		}

		if (country !== "" && variety !== "") {
			if (!winesByVariety[country]) {
				winesByVariety[country] = {};
			}

			if (!winesByVariety[country][variety]) {
				let winePrice = wine.price;
				if (!Number.isInteger(wine.price)) {
					winePrice = 0;
				}
				winesByVariety[country][variety] = {
					points: wine.points,
					price: winePrice,
					sweetness: sweetness,
					fruitiness: fruitiness,
					count: 1,
					color: wine.color,
				};
			} else {
				winesByVariety[country][variety].points += wine.points;
				if (Number.isInteger(wine.price))
					winesByVariety[country][variety].price += parseInt(
						wine.price
					);

				winesByVariety[country][variety].rating += wine.rating;
				winesByVariety[country][variety].count++;

				// Check if sweetness value needs to be updated
				if (sweetness === "dry") {
					winesByVariety[country][variety].dryCount++;
				} else if (sweetness === "sweet") {
					winesByVariety[country][variety].sweetCount++;
				}
				if (
					winesByVariety[country][variety].dryCount >
					winesByVariety[country][variety].sweetCount
				) {
					winesByVariety[country][variety].sweetness = "dry";
				} else {
					winesByVariety[country][variety].sweetness = "sweet";
				}

				// Check the count of herbal and fruity values
				if (fruitiness === "herbal") {
					herbalCount++;
				} else if (fruitiness === "fruity") {
					fruityCount++;
				}

				// Set the fruitiness value based on the count of herbal and fruity values
				if (fruityCount > herbalCount) {
					winesByVariety[country][variety].fruitiness = "fruity";
				} else {
					winesByVariety[country][variety].fruitiness = "herbal";
				}
			}
		}
	});

	// Calculate the average values for each variety for each country
	for (var country in winesByVariety) {
		if (winesByVariety.hasOwnProperty(country)) {
			for (var variety in winesByVariety[country]) {
				if (winesByVariety[country].hasOwnProperty(variety)) {
					winesByVariety[country][variety].points /=
						winesByVariety[country][variety].count;
					winesByVariety[country][variety].price /=
						winesByVariety[country][variety].count;
					winesByVariety[country][variety].rating /=
						winesByVariety[country][variety].count;
				}
			}
		}
	}

	// Delete every winevariety that is produced by less than 5 countries
	for (let i = 0; i < winevarietys.length; i++) {
		let count = 0;
		for (let j = 0; j < Object.keys(winesByVariety).length; j++) {
			if (
				winevarietys[i] in
				winesByVariety[Object.keys(winesByVariety)[j]]
			) {
				count++;
			}
		}
		if (count < 5) {
			winevarietys.splice(i, 1);
			i--;
		}
	}

	// Rearrange the winevarietys array so that the winevariety with the highest count is at the beginning
	winevarietys.sort(function (a, b) {
		let countA = 0;
		let countB = 0;
		for (let i = 0; i < Object.keys(winesByVariety).length; i++) {
			if (a in winesByVariety[Object.keys(winesByVariety)[i]]) {
				countA++;
			}
			if (b in winesByVariety[Object.keys(winesByVariety)[i]]) {
				countB++;
			}
		}
		return countB - countA;
	});

	// Create new object parameters for each variety in each country with the count of wines
	for (var country in winesByVariety) {
		if (winesByVariety.hasOwnProperty(country)) {
			for (var variety in winesByVariety[country]) {
				if (winesByVariety[country].hasOwnProperty(variety)) {
					let count = 0;
					for (var i = 0; i < winedata.length; i++) {
						if (
							winedata[i].country === country &&
							winedata[i].variety === variety
						) {
							count++;
						}
					}
					winesByVariety[country][variety].production = count;
				}
			}
		}
	}

	console.log(winesByVariety);
}

function filter(winesByVariety, winevarietys) {
	let heading = $("<h2></h2>");
	let description = $("<p></p>");
	let optionlist = ["Points.", "Price.", "Production."];
	let descriptiontext = "";
	filteroption = optionlist[0]; // Initialize filteroption with the first word from the optionlist
	let previousOption = ""; // Store the previous filter option

	heading.css({
		position: "absolute",
		left: "135px",
		top: "0px",
		margin: "9px",
		transform: "translateY(40px)",
		fontSize: "50px",
		fontWeight: "bold",
		color: "white",
	});

	$("body").append(heading);

	// Create a <p> element for the description
	description.css({
		position: "absolute",
		left: "50%",
		top: "0px",
		margin: "9px",
		transform: "translateY(45px)",
		fontSize: "20px",
		fontWeight: "Thin",
		color: "white",
	});

	// Append the description to the body
	$("body").append(description);

	// Create a <u> element for the filteroption
	let filterElement = $("<u></u>").appendTo(heading);

	function updateFilterOption() {
		// Get a random word from the optionlist
		do {
			filteroption =
				optionlist[Math.floor(Math.random() * optionlist.length)];
		} while (filteroption === previousOption); // Check if it's the same as the previous option

		// Update the previous option
		previousOption = filteroption;
		// Animate the filteroption change
		filterElement.animate({ opacity: 0 }, 400, function () {
			// Update the filteroption text
			filterElement.text(filteroption).animate({ opacity: 1 }, 400);
		});

		// Animate the description change
		description.animate({ opacity: 0 }, 400, function () {
			// Update the description text
			descriptiontext = getDescriptionText(filteroption);
			description.html(descriptiontext).animate({ opacity: 1 }, 400);
		});
	}

	setInterval(updateFilterOption, 3000);

	// Set the initial heading text
	heading.html("Winevarietys in <br> the world by ").append(filterElement);
	return filteroption;
}

// Function to get the description text based on the filteroption
function getDescriptionText(filteroption) {
	switch (filteroption) {
		case "Points.":
			return "This average represents the overall points earned by different wine varieties produced in each country. The wine's quality improves as the points increase. <br> The saturation level reflects the wine's rating, indicating its strength of appeal.";
		case "Price.":
			return "This average represents the typical price range of wine varieties produced in each country. The saturation level corresponds to the wine's price. <br> As the price increases, the color saturation becomes more pronounced, indicating a higher value.";
		case "Production.":
			return "This represents the total quantity of wine produced for each wine variety in every country. The color saturation is determined by the production level of the wine. <br> The more wine produced, the more intense the color saturation becomes, indicating higher production volume.";
		default:
			return "What in god's name were you doing to get this displayed?";
	}
}

// Function for drawing the entire visualization
function draw(winesByVariety, winevarietys, filteroption) {
	let elementPositions = [];
	let winecolorboxcolor = "white";
	// let winecolorboxes = {};
	Wines.winecolorboxes = {};

	// change the fontfamily of the body to a installed font
	$("body").css({
		fontFamily: "Neuzeit Grotesk",
	});

	// Add a image element to the DOM
	var img = $("<div></div>");

	img.css({
		position: "fixed",
		left: "-140px",
		bottom: "-50%", // Move the image 50% below the bottom of the page
		width: "calc(50% + 140px)",
		height: "128%", // Increase the height to 150% to extend beyond the bottom
		backgroundImage: "url(./bottle.png)",
		backgroundSize: "contain",
		backgroundRepeat: "no-repeat",
		backgroundPosition: "left bottom", // Adjust the background position if needed
	});

	$("body").append(img);

	$.each(winevarietys, function (index, value) {
		let append;
		let kml;
		$(winevarietys[value]).each(function (index, value) {});

		//get all the countries names
		let countries = Object.keys(winesByVariety);

		//now cycle through the countries
		for (let i = 0; i < countries.length; i++) {
			//if the country has the winevariety
			if (winesByVariety[countries[i]][value] !== undefined) {
				//get the color of the winevariety
				kml = winesByVariety[countries[i]][value].color;
			}
		}

		// change the color behinde the winevariety based on the color of the wine
		if (kml == "red") {
			winecolorboxcolor = "rgba(255, 0, 46, 0.3)";
		} else if (kml == "white") {
			winecolorboxcolor = "rgba(255, 153, 0, 0.3)";
		} else if (kml == "rose") {
			winecolorboxcolor = "rgba(233, 50, 122, 0.3)";
		} else if (kml == "not classified") {
			winecolorboxcolor = "rgba(0, 0, 0, 0)";
		}

		// p element
		append = $("<p></p>");
		append.text(value);

		append.css({
			position: "relative",
			left: "130px",
			top: "240px",
			margin: "7px",
			transform: "translateY(65px)",
			fontSize: "14px",
			fontWeight: "bold",
			color: "white",
		});

		$("body").append(append);

		let position = append.offset();
		elementPositions.push({
			variety: value,
			left: position.left,
			top: position.top,
		});

		// create the color box
		let winecolorbox = $("<div class = 'label'></div>");

		winecolorbox.css({
			position: "absolute",
			left: "8%", // Set the left position of the box to match the text element
			top: position.top - 4 + "px", // Set the top position of the box to match the text element
			width: "91% ",
			height: "24.3px",
			backgroundColor: winecolorboxcolor,
			zIndex: "-1", // Set a negative z-index to position the box behind the text
		});

		Wines.winecolorboxes[value] = winecolorbox;

		$("body").append(winecolorbox);
	});

	// create a container element to hold the <p> elements
	let container = $("<div></div>");

	$.each(winesByVariety, function (index, value) {
		let append;

		// create the <p> element
		// change the font size to 10px

		append = $("<p></p>");
		append.text(index);

		append.addClass("countryLabel");

		// let the elements be alligned to the x of the circles underneath
		append.css({
			position: "aboslute",
			margin: "3px",
			left: "0px",
			top: "0px",
			fontSize: "14px",
			fontWeight: "bold",
			color: "white",
			transform: "rotate(-90deg)",
		});

		// append the <p> element to the container
		container.append(append);
	});

	// apply CSS properties to the container element
	// let the elements that are not on the screens be visible by scrolling to the x axis
	container.css({
		display: "flex",
		position: "absolute",
		height: "30px",
		top: "265px",
		right: "0px",
		left: "343px",
		textOrientation: "upright",
		whiteSpace: "nowrap",
		overflowX: "auto",
	});

	// append the container to the body
	$("body").append(container);

	for (let i = 0; i < Object.keys(winesByVariety).length; i++) {
		elementPositions.forEach((element) => {
			createCircleForWinevariety(
				element,
				i,
				winesByVariety,
				filteroption,
				Wines.winecolorboxes
			);
		});
	}

	// let the winecolorboxes only be visible when the mouse is over the circle
	$(".wine-circle").mouseenter(function () {
		let variety = $(this).data("variety");
		if (variety == undefined) {
			return;
		}
		let refHTML = Wines.winecolorboxes[variety];
		$(refHTML)
			.removeClass("label")
			.css("left", "-100%") // Initial position offscreen to the left
			.animate({ left: "8%" }, 500); // Animation to move the element to 0% left (visible)
	});

	$(".wine-circle").mouseleave(function () {
		let variety = $(this).data("variety");
		if (variety == undefined) {
			return;
		}
		let refHTML = Wines.winecolorboxes[variety];
		$(refHTML)
			.addClass("label")
			.css("left", "8%") // Reset position to 0% left
			.animate({ left: "-100%" }, 500); // Animation to move the element offscreen to the left
	});

	console.log(elementPositions);
}

// Function for creating the circles for each winevariety
function createCircleForWinevariety(
	element,
	count,
	winesByVariety,
	filteroption
) {
	const circle = new CircleForWineVariety(
		element,
		count,
		winesByVariety,
		filteroption
	);
	circle.createCircle();
}

// Map function
function map(number, inMin, inMax, outMin, outMax) {
	return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function connectWithLine(circle1, circle2) {
	const position1 = circle1.position();
	const position2 = circle2.position();

	const centerX1 = position1.left + circle1.outerWidth() / 2;
	const centerY1 = position1.top + circle1.outerHeight() / 2;
	const centerX2 = position2.left + circle2.outerWidth() / 2;
	const centerY2 = position2.top + circle2.outerHeight() / 2;

	const line = $("<div></div>");
	line.addClass("line");
	line.css({
		position: "absolute",
		border: "1px solid white",
		backgroundColor: "white",
		left: centerX1,
		top: centerY1,
		width: Math.sqrt(
			(centerX2 - centerX1) * (centerX2 - centerX1) +
				(centerY2 - centerY1) * (centerY2 - centerY1)
		),
		transformOrigin: "left",
		transform: `rotate(${
			Math.atan2(centerY2 - centerY1, centerX2 - centerX1) *
			(180 / Math.PI)
		}deg)`,
		zIndex: 5,
	});

	$("body").append(line);

	this.line = line;
}
