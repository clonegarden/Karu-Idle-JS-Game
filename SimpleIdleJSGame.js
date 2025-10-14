/*-------------*/
/* Main Script */
/*-------------*/
// Automatically load game after login
function onLoginSuccess() {
	// Token should already be set in localStorage by login logic
	LoadGame();
}
console.log("SimpleIdleJSGame.js has been linked!");
// Example: Attach to login modal or login event
document.addEventListener('DOMContentLoaded', function() {
	// Replace with your actual login success event or callback
	// For example, if you use a login form with id 'loginForm':
	var loginForm = document.getElementById('loginForm');
	if (loginForm) {
		loginForm.addEventListener('submit', function(e) {
			// Wait for login to complete and token to be set
			setTimeout(function() {
				if (localStorage.getItem('token')) {
					onLoginSuccess();
				}
			}, 500); // Adjust delay as needed
		});
	}
});
	// ShowDateTime and clockinterval removed (no clockcontainer in UI)
var player = new Player();
var generatortimer = setInterval("player.AutoClickerMakeMoney()", 100);
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
				// Save all game state to backend (basic stats and extended state)
				const token = localStorage.getItem('token');
				Promise.all([
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
					}),
					fetch('/api/character-state', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': 'Bearer ' + token
						},
						body: JSON.stringify({
							unlockedAvatar: player.unlockedAvatar,
							unlockedAchievement: player.unlockedAchievement,
							unlockedSkill: player.unlockedSkill,
							unlockedTheme: player.unlockedTheme,
							unlockedMusic: player.unlockedMusic,
							karugems: player.karugems,
							shopProgression: player.shopProgression || {},
							mapPosition: player.mapPosition || {},
							autoclickercost: player.autoclickercost,
							clickpowercost: player.clickpowercost,
							newavatarcost: player.newavatarcost
						})
					})
				])
				.then(([statsRes, stateRes]) => {
					if (!statsRes.ok || !stateRes.ok) throw new Error('Failed to update game state in database');
					return Promise.all([statsRes.json(), stateRes.json()]);
				})
				.then(() => {
					Swal.fire('Saved!', 'Your game has been saved and all data updated in the database.', 'success');
					document.getElementById("console").innerHTML = document.getElementById("console").innerHTML.concat(">>"+player.name+" saved the game and updated the database.&#013;");
					document.getElementById("console").scrollTop = document.getElementById("console").scrollHeight;
				})
				.catch(err => {
					let errorMsg = err.message;
					Swal.fire('Error', 'Could not update game state in the database.<br>' + errorMsg, 'error');
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
			Promise.all([
				fetch('/api/character', {
					headers: { 'Authorization': 'Bearer ' + token }
				}),
				fetch('/api/character-state-get', {
					headers: { 'Authorization': 'Bearer ' + token }
				})
			])
			.then(([statsRes, stateRes]) => {
				if (!statsRes.ok || !stateRes.ok) throw new Error('Could not load game state from database');
				return Promise.all([statsRes.json(), stateRes.json()]);
			})
			.then(([data, stateData]) => {
				const c = data.character;
				const s = stateData.character_state;
				const moneyFromDB = Math.round((Number(c.totalMoneyEver) || 0) - (Number(c.totalMoneySpent) || 0));
				Swal.fire({
					title: 'Are you sure?',
					text: `Loading game: Money: $${moneyFromDB} - Generators: ${c.autoclickers}`,
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
						if (c.createdAt) {
							const dateObj = new Date(c.createdAt);
							const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
							const dd = String(dateObj.getDate()).padStart(2, '0');
							const yyyy = dateObj.getFullYear();
							player.gameStarted = `${mm}/${dd}/${yyyy}`;
						} else {
							player.gameStarted = c.gameStarted;
						}
						player.clickpower = Number(c.clickpower) || 0;
						player.totalClicksEver = Number(c.totalClicksEver) || 0;
						player.autoclickers = Number(c.autoclickers) || 0;
						player.totalMoneyEver = Number(c.totalMoneyEver) || 0;
						player.totalMoneySpent = Number(c.totalMoneySpent) || 0;
						// Extended state
						player.unlockedAvatar = JSON.parse(s.unlockedAvatar);
						player.unlockedAchievement = JSON.parse(s.unlockedAchievement);
						player.unlockedSkill = JSON.parse(s.unlockedSkill);
						player.unlockedTheme = JSON.parse(s.unlockedTheme);
						player.unlockedMusic = JSON.parse(s.unlockedMusic);
						player.karugems = s.karugems;
						player.shopProgression = JSON.parse(s.shopProgression);
						player.mapPosition = JSON.parse(s.mapPosition);
						// Restore shop prices if present
						if (typeof s.autoclickercost !== 'undefined') player.autoclickercost = Number(s.autoclickercost);
						if (typeof s.clickpowercost !== 'undefined') player.clickpowercost = Number(s.clickpowercost);
						if (typeof s.newavatarcost !== 'undefined') player.newavatarcost = Number(s.newavatarcost);
						player.updateShop();
						// UI updates
						player.updateStats();
						document.getElementById("namediv").innerHTML = "Player: " + c.name;
						document.getElementById("autoclickerscounter").textContent = `Generators: ${c.autoclickers}`;
						document.getElementById("moneycounter").textContent = `$${moneyFromDB}`;
						document.getElementById("console").innerHTML = document.getElementById("console").innerHTML.concat(">>"+player.name+" loaded the game from database.&#013;");
						document.getElementById("console").scrollTop = document.getElementById("console").scrollHeight;
					}
				});
			})
			.catch(err => {
				Swal.fire('Error', 'Could not load game state from database.<br>' + err.message, 'error');
			});
}