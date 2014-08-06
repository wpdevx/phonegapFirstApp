/***************************************
 *
 * Minesweeper JS
 * jQuery Plugin
 *
 * Version 1.0
 *
 * Copyright 2011 Bart Coppens
 *
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 * 
 * Date: 19-04-2011
 *
 **************************************/

(function($) {
	$.fn.minesweeperjs = function(options) {
		return this.each(function() {
			// Initialize default settings
			var defaults = {
				grid: {
					width: 16,
					height: 16,
					cellSideLength: 20,
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
				},
				imagesFolder: "images/"
			};
			
			// Validate options
			if (options) {
				if (options.grid) {
					if (!isValidNumber(options.grid.width, 8, 50)) delete options.grid.width;
					if (!isValidNumber(options.grid.height, 8, 50)) delete options.grid.height;
					if (!isValidNumber(options.grid.cellSideLength, 16, 32)) delete options.grid.cellSideLength;
					if (!isValidString(options.grid.font, /^[a-zA-Z]+$/)) delete options.grid.font;
					if (options.grid.colors) {
						$.each(options.grid.colors, function(property, value) {
							if (!isValidString(value, /^#[a-fA-F0-9]{6}$/)) delete options.grid.colors[property];
						});
						if (options.grid.colors.numbers) {
							$.each(options.grid.colors.numbers, function(property, value) {
								if (!isValidString(value, /^#[a-fA-F0-9]{6}$/)) delete options.grid.colors.numbers[property];
							});
						}
					}
				}
				if (!isValidString(options.grid.imagesFolder, /^[^\\\/:*?"<>|]+\/$/)) delete options.grid.imagesFolder;
			}
			
			// Merge the default settings with the ones given as parameter
			$.extend(true, defaults, options);
			
			// Global variables
			var _$this = $(this);
			var _mines;			// The number of mines hidden in the grid
			var _timer;			// Timer object to keep track of the elapsed time
			var _checkedCells;	// Number of cells that have been checked and contain NO mine
			var _markedCells;	// Number of cells that have been marked by the user as containing a mine
			
			initGame();
			
			/**
			 * Initializes the game.
			 */	
			function initGame() {
				_mines = Math.ceil(defaults.grid.width * defaults.grid.height * 15.625 / 100);
				_timer = null;
				_checkedCells = 0;
				_markedCells = 0;
				generateGrid();
				styleMsgPanel();
				plantMines();
			}
			
			/**
			 * Generates the HTML for the main game grid and inserts it in the DOM.
			 */
			function generateGrid() {
				_$this.html("<div id='ms-score'></div><div id='ms-title'></div><div id='ms-time'></div>");
				_$this.append("<div id='ms-grid'><div id='ms-msgpanel'><span id='ms-bigtext'></span><br /><span id='ms-smalltext'></span></div></div><div id='ms-clear'></div>");
				_$this.css("font-family", defaults.grid.font);
				
				// Define styles for score, title and time
				$("#ms-score").css("width", defaults.grid.cellSideLength * 2 + 1 + "px");
				$("#ms-time").css("width", defaults.grid.cellSideLength * 3 + 2 + "px");
				$("#ms-score, #ms-title, #ms-time").css("height", defaults.grid.cellSideLength * 2 + 1 + "px");
				$("#ms-score, #ms-title, #ms-time").css("font-size", (defaults.grid.cellSideLength - 8) + "px");
				if (defaults.grid.width < 11) {
					$("#ms-title").css("font-size", (defaults.grid.cellSideLength - 8 - (2 * (11 - defaults.grid.width))) + "px");
				}
				$("#ms-score").css("color", defaults.grid.colors.score);
				$("#ms-title").css("color", defaults.grid.colors.title);
				$("#ms-time").css("color", defaults.grid.colors.time);
				$("#ms-title").css("font-weight", "bold");
				$("#ms-score, #ms-title, #ms-time").css("line-height", (defaults.grid.cellSideLength * 2 - 1) + "px");
				$("#ms-score, #ms-title, #ms-time").css("text-align", "center");
				$("#ms-title").css("width", defaults.grid.cellSideLength *  (defaults.grid.width - 5) + defaults.grid.width - 6 + "px");
				$("#ms-score, #ms-title, #ms-time").css("border-left", "1px solid " + defaults.grid.colors.cellBorder);
				$("#ms-score, #ms-title, #ms-time").css("border-top", "1px solid " + defaults.grid.colors.cellBorder);
				$("#ms-score, #ms-title, #ms-time").css("border-bottom", "1px solid " + defaults.grid.colors.cellBorder);
				$("#ms-time").css("border-right", "1px solid " + defaults.grid.colors.cellBorder);
				$("#ms-score, #ms-title, #ms-time").css("float", "left");
				$("#ms-score, #ms-title, #ms-time").css("background-color", defaults.grid.colors.click);
				$("#ms-score").html(_mines);
				$("#ms-time").html("00:00");
				
				$("#ms-grid").bind("contextmenu",function(){
        			return false;
        		});
				$("#ms-clear").css("clear", "both");
				
				// Generate and style the main grid
				for (var i = 0; i < defaults.grid.height; i++) {
					for (var j = 0; j < defaults.grid.width; j++) {
						$("#ms-grid").append("<div></div>");
						var cell = $("#ms-grid div:last");
						cell.attr("id", j + "-" + i);
						cell.width(defaults.grid.cellSideLength);
						cell.height(defaults.grid.cellSideLength);
						cell.css("background-color", defaults.grid.colors.background);
						cell.css("background-repeat", "no-repeat");
						cell.css("background-position", "center center");
						cell.css("border-width", "1px");
						cell.css("border-style", "solid");
						cell.css("border-right-style", "none");
						cell.css("border-bottom-style", "none");
						cell.css("border-top-color", defaults.grid.colors.cellBorder);
						cell.css("border-left-color", defaults.grid.colors.cellBorder);
						cell.css("float", "left");
						cell.css("text-align", "center");
						cell.css("font-size", (defaults.grid.cellSideLength - 8) + "px");
						cell.css("font-weight", "bold");
						cell.css("line-height", (defaults.grid.cellSideLength - 1) + "px");
						if (j == 0) cell.css("clear", "left");
						if (i == defaults.grid.height - 1) {
							cell.css("border-bottom-style", "solid");
							cell.css("border-bottom-color", defaults.grid.colors.cellBorder);
						}
						if (j == defaults.grid.width - 1) {
							cell.css("border-right-style", "solid");
							cell.css("border-right-color", defaults.grid.colors.cellBorder);
						}
						
						// Attach data
						cell.data("x", j);
						cell.data("y", i);
						cell.data("checked", false);
						cell.data("marked", false);
						
						// Event handlers
						cell.hover(
							function() {
								if (!$(this).data("checked")) {
									$(this).css("background-color", defaults.grid.colors.hover);
								}
							},
							function() {
								if ($(this).data("checked")) {
									$(this).css("background-color", defaults.grid.colors.click);
								}
								else {
									$(this).css("background-color", defaults.grid.colors.background);
								}
							}
						);
						cell.mouseup(function(e) {
							if (_timer == null) {
								_timer = {min: 0, sec: 0, interval: setInterval(tickTimer, 1000)};
							}
							if (e.which == 1) {
								stepOnCell($(this));
							}
							if (e.which == 3) {
								markCell($(this));
							}
						});
					}
				}
				$("#ms-msgpanel").mouseup(initGame);
			}
			
			/**
			 * Adds one second to the timer.
			 */
			function tickTimer() {
				var m = _timer.min;
				var s = _timer.sec;
				if (s < 59) {
					s++;
				}
				else {
					m++;
					s = 0;
				}
				
				var timerText = "";
				if (m < 10) {
					timerText = "0" + m + ":";
				}
				else {
					timerText = m + ":";
				}
				if (s < 10) {
					timerText += "0" + s;
				}
				else {
					timerText += s;
				}
				
				_timer.min = m;
				_timer.sec = s;
				$("#ms-time").html(timerText);
			}
		
			/**
			 * Defines styles for the message panel shown at the end of a game.
			 */
			function styleMsgPanel() {
				$("#ms-grid").css("position", "relative");
				var p = $("#ms-msgpanel");
				p.css("position", "absolute");
				p.css("top", defaults.grid.cellSideLength * 2 + 3 + "px");
				p.css("left", "0px");
				p.css("width", (defaults.grid.width * defaults.grid.cellSideLength + defaults.grid.width + 1) + "px");
				p.css("height", (defaults.grid.height * defaults.grid.cellSideLength + defaults.grid.height + 1) + "px");
				p.css("background-image", "url(" + defaults.imagesFolder + "panel-bg.png)");
				p.css("color", "#fff");
				p.css("text-align", "center");
				var fontSize = defaults.grid.width * defaults.grid.cellSideLength / 20 * 3;
				p.css("font-weight", "bold");
				p.css("display", "none");
				$("#ms-msgpanel span").css("line-height", ((defaults.grid.height * defaults.grid.cellSideLength + defaults.grid.height + 1) / 2) + "px");
				$("#ms-msgpanel #ms-bigtext").css("font-size", fontSize > 36 ? 36 : fontSize + "px");
				$("#ms-msgpanel #ms-smalltext").css("font-size", fontSize / 2.5 > 18 ? 18 : fontSize / 2.5 + "px");
				$("#ms-msgpanel #ms-smalltext").css("color", defaults.grid.colors.endGameMsg);
			}
			
			/**
			 * Plants mines at random locations in the game grid.
			 */
			function plantMines() {
				var minesX = new Array();
				var minesY = new Array();
				var i;
				
				for (i = 0; i < _mines; i++) {
					var x = Math.floor(Math.random() * defaults.grid.width);
					var y = Math.floor(Math.random() * defaults.grid.height);
					var cell = $("#" + x + "-" + y);
					while (cell.data("mine")) {
						x = Math.floor(Math.random() * defaults.grid.width);
						y = Math.floor(Math.random() * defaults.grid.height);
						cell = $("#" + x + "-" + y);
					}
					cell.data("mine", true);
					cell.addClass("ms-mine");
				}
			}
			
			/**
			 * Returns the number of neighbouring cells that contain a mine.
			 */
			function getNeighbouringMines(cell) {
				var mines = 0;
				var neighbours = getCellNeighbours(cell);
				
				for (var i = 0; i < neighbours.length; i++) {
					if (neighbours[i].data("mine")) {
						mines++;
					}
				}
				return mines;
			}
			
			/**
			 * Checks a cell for presence of a mine.
			 */
			function stepOnCell(cell) {
				// Cell is marked with a flag
				if (cell.data("marked")) {
					cell.css("background-image", "none");
					cell.data("marked", false);
					_markedCells--;
					$("#ms-score").html(_mines - _markedCells);
					return;
				}
				
				// Cell contains a mine
				if (cell.data("mine")) {
					$(".ms-mine").css("background-image", "url(" + defaults.imagesFolder + "mine16.png)");
					showMsgPanel("GAME OVER", defaults.grid.colors.gameLost)
				}
				// Cell contains no mine and neigbouring cells are checked for mines
				else if (!cell.data("checked")) {
					checkCell(cell);
				}
			}
			
			/**
			 * Checks a cell for the number of neighbouring mines (recursively).
			 */
			function checkCell(cell) {
				var mines = getNeighbouringMines(cell);
				
				_checkedCells++;
				if (cell.data("marked")) {
					markCell(cell);
				}
				cell.data("checked", true);
				cell.css("background-color", defaults.grid.colors.click);
				
				// Check if this is the last cell
				if (_checkedCells == defaults.grid.width * defaults.grid.height - _mines) {
					showMsgPanel("WELL DONE", defaults.grid.colors.gameWon);
				}
				
				if (mines == 0) {
					var neighbours = getCellNeighbours(cell);
					for (var i = 0; i < neighbours.length; i++) {
						if (!neighbours[i].data("checked")) {
							checkCell(neighbours[i]);
						}
					}
				}
				else {
					cell.css("color", defaults.grid.colors.numbers[mines]);
					cell.html(mines);
				}
			}
			
			/**
			 * Returns all neighbouring cells of a certain cell.
			 */
			function getCellNeighbours(cell) {
				var neighbours = new Array();
				
				if (cell.data("x") != 0) {
					neighbours.push($("#" + (cell.data("x") - 1) + "-" + cell.data("y")));
				}
				if (cell.data("x") != defaults.grid.width - 1) {
					neighbours.push($("#" + (cell.data("x") + 1) + "-" + cell.data("y")));
				}
				if (cell.data("y") != 0) {
					neighbours.push($("#" + cell.data("x") + "-" + (cell.data("y") - 1)));
				}
				if (cell.data("y") != defaults.grid.height - 1) {
					neighbours.push($("#" + cell.data("x") + "-" + (cell.data("y") + 1)));
				}
				if (cell.data("x") != 0 && cell.data("y") != 0) {
					neighbours.push($("#" + (cell.data("x") - 1) + "-" + (cell.data("y") - 1)));
				}
				if (cell.data("x") != 0 && cell.data("y") != defaults.grid.height - 1) {
					neighbours.push($("#" + (cell.data("x") - 1) + "-" + (cell.data("y") + 1)));
				}
				if (cell.data("x") != defaults.grid.width - 1 && cell.data("y") != 0) {
					neighbours.push($("#" + (cell.data("x") + 1) + "-" + (cell.data("y") - 1)));
				}
				if (cell.data("x") != defaults.grid.width - 1 && cell.data("y") != defaults.grid.height - 1) {
					neighbours.push($("#" + (cell.data("x") + 1) + "-" + (cell.data("y") + 1)));
				}
				return neighbours;
			}
			
			/**
			 * Marks or unmarks a cell for presence of a mine.
			 */
			function markCell(cell) {
				if (!cell.data("checked")) {
					if (cell.data("marked")) {
						cell.css("background-image", "none");
						cell.data("marked", false);
						_markedCells--;
					}
					else {
						cell.css("background-image", "url(" + defaults.imagesFolder + "flag16.png)");
						cell.data("marked", true);
						_markedCells++;
					}
					$("#ms-score").html((_mines - _markedCells).toString());
				}
			}
			
			/**
			 * Shows the message panel at the end of a game.
			 */
			function showMsgPanel(text, color) {
				$("#ms-msgpanel").css("display", "block");
				$("#ms-msgpanel #ms-bigtext").css("color", color);
				$("#ms-msgpanel #ms-bigtext").css("border", "black");
				$("#ms-msgpanel #ms-bigtext").css("background-color", "#c8c8c8");
				$("#ms-msgpanel #ms-bigtext").html(text);
				$("#ms-msgpanel #ms-smalltext").html("CLICK TO START NEW GAME");
				if (_timer) {
					clearInterval(_timer.interval);
				}
			}
			
			/**
			 * Validates a number.
			 */
			function isValidNumber(value, min, max) {
				if (isNaN(value)) return false;
				if (value < min || value > max) return false;
				return true;
			}
			
			/**
			 * Validates a string.
			 */
			function isValidString(value, regex) {
				if (value == "undefined") return false;
				return regex.test(value);
			}
		});
	};
})(jQuery);