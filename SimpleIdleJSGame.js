/*-------------*/
/* Main Script */
/*-------------*/
//This loads on init
console.log("SimpleIdleJSGame.js has been linked!");
	console.log("SimpleIdleJSGame.js has been linked!");
	// ShowDateTime and clockinterval removed (no clockcontainer in UI)
var player = new Player();
var autoclickertimer = setInterval("player.AutoClickerMakeMoney()", 100);
var updateAchievementsTimer = setInterval("player.updateAchievements()", 1000);
var updateBoutiqueTimer = setInterval("player.updateBoutique()", 2000);
var karuGemsGenerationTimer = setInterval("player.generateKaruGem()", 600000);

/*-----------*/
/* Save Game */
/*-----------*/
//First, asks the player if they're sure to save, since it can overwrite data.
//After confirmation, creates karua localStorage JSON with player data.
function SaveGame() {
		Swal.fire({
			title: 'Are you sure?',
			text: "This will overwrite any previously saved file and update your stats in the database!",
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, save the game!'
		}).then((result) => {
			if (result.value) {
				// Save to localStorage as before
				var savefile = JSON.stringify(player);
				localStorage.setItem("SimpleIdleJSGame_savefile", savefile);
				// Send all stats to backend
				const token = localStorage.getItem('token');
				fetch('/api/character-update', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + token
					},
					body: JSON.stringify({
						name: player.name,
						terra: player.terra,
						fogo: player.fogo,
						agua: player.agua,
						ar: player.ar,
						gameStarted: player.gameStarted,
						clickpower: player.clickpower,
						totalClicksEver: player.totalClicksEver,
						autoclickers: player.autoclickers,
						totalMoneyEver: player.totalMoneyEver,
						totalMoneySpent: player.totalMoneySpent
					})
				})
				.then(res => {
					if (!res.ok) throw new Error('Failed to update character in database');
					return res.json();
				})
				.then(data => {
					Swal.fire('Saved!', 'Your game has been saved and stats updated in the database.', 'success');
					document.getElementById("console").innerHTML = document.getElementById("console").innerHTML.concat(">>"+player.name+" saved the game and updated the database.&#013;");
					document.getElementById("console").scrollTop = document.getElementById("console").scrollHeight;
				})
				   .catch(err => {
					   let errorMsg = err.message;
					   if (err.response && err.response.json) {
						   err.response.json().then(data => {
							   Swal.fire('Error', 'Could not update stats in the database.<br>'+ (data.details || errorMsg), 'error');
						   });
					   } else {
						   Swal.fire('Error', 'Could not update stats in the database.<br>' + errorMsg, 'error');
					   }
					   document.getElementById("console").innerHTML = document.getElementById("console").innerHTML.concat(">>Failed to update database: "+errorMsg+"&#013;");
					   document.getElementById("console").scrollTop = document.getElementById("console").scrollHeight;
				   });
			}
		})
}

/*-----------*/
/* Load Game */
/*-----------*/
//First, asks the player if they're sure to load, since it can make them lose progress.
//After confirmation, loads a localStorage JSON with player data.
function LoadGame() {
			const token = localStorage.getItem('token');
			if (!token) {
					Swal.fire('Not logged in', 'You must be logged in to load your game.', 'warning');
					return;
			}
			fetch('/api/character', {
					headers: { 'Authorization': 'Bearer ' + token }
			})
			.then(res => {
					if (!res.ok) throw new Error('Could not load character from database');
					return res.json();
			})
			.then(data => {
				const c = data.character;
				const moneyFromDB = Math.round((Number(c.totalMoneyEver) || 0) - (Number(c.totalMoneySpent) || 0));
				Swal.fire({
					title: 'Are you sure?',
					text: `Loading game: Money: $${moneyFromDB} - Autoclickers: ${c.autoclickers}`,
					type: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#3085d6',
					cancelButtonColor: '#d33',
					confirmButtonText: 'Yes, load it!'
				}).then((result) => {
					if (result.value) {
						Swal.fire('Loaded!', 'Your game has been loaded from the database.', 'success');
						player.name = c.name;
						player.money = moneyFromDB;
						player.terra = Number(c.terra) || 0;
						player.fogo = Number(c.fogo) || 0;
						player.agua = Number(c.agua) || 0;
						player.ar = Number(c.ar) || 0;
						player.gameStarted = c.gameStarted;
						player.clickpower = Number(c.clickpower) || 0;
						player.totalClicksEver = Number(c.totalClicksEver) || 0;
						player.autoclickers = Number(c.autoclickers) || 0;
						player.totalMoneyEver = Number(c.totalMoneyEver) || 0;
						player.totalMoneySpent = Number(c.totalMoneySpent) || 0;
						// UI updates
						player.updateStats();
						document.getElementById("namediv").innerHTML = "Player: " + c.name;
						document.getElementById("autoclickerscounter").textContent = `Autoclickers: ${c.autoclickers}`;
						document.getElementById("moneycounter").textContent = `$${moneyFromDB}`;
						document.getElementById("console").innerHTML = document.getElementById("console").innerHTML.concat(">>"+player.name+" loaded the game from database.&#013;");
						document.getElementById("console").scrollTop = document.getElementById("console").scrollHeight;
					}
				});
			})
			.catch(err => {
					Swal.fire('Error', 'Could not load character from database.<br>' + err.message, 'error');
			});
}