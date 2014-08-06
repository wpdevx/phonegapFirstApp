var instructions = "This is a classic Minesweeper game. The objective of the game is to keep all mine tiles untouched. Click on a cell to find out if it has a mine or not. Time your skills with the timer on top.";
$(document).ready(function(){
	$("#minesweeperjs").minesweeperjs({
										grid: {
											width: 8,
											height: 8,
											cellSideLength: 32,
											font: "Verdana",
											colors: {
												cellBorder: "#999999",
												background: "#ffffff",
												click: "#cccccc",
												hover: "#999999",
												score: "#000000",
												title: "#000000",
												time: "#000000",
												gameWon: "#66ff66",
												gameLost: "#ff6666",
												endGameMsg: "#ffffff", 
												numbers: {
													1: "#0000ff",
													2: "#009900",
													3: "#ff0000",
													4: "#000099",
													5: "#990000",
													6: "#009999",
													7: "#9900cc",
													8: "#000000"
												}
											}
										}
	});
	$('.instructions').click(function () {
        alert(instructions);
    });
});