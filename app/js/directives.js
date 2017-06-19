(function() {
"use strict";

angular.module("MyApp")
.directive("resizeToScreen", ["$window", function($window) {
	return {
		link: function(scope, element, attrs, ctrl) {
			angular.element($window).on("resize", function() {
				scope.$apply(function() {
					scope.width = $window.innerWidth;
					scope.height = $window.innerWidth * (3/4);
				})
			});
		}
	}

}])

/* THIS DIRECTIVES ALLOWS US TO ASSIGN KEY CONTROLS TO AN ELEMENT WITH AN NG-MODEL ATTACHED TO IT */
.directive("keycontrol", ["$parse", function($parse) {
	return {
		restrict: "A",
		compile: function(element, attrs) {
			var modelAccessor = $parse(attrs.ngModel);

			return function(scope, element, attrs, ctrl) {

				element.on("keydown", function(event) {
					if([38,40].indexOf(event.keyCode) < 0) { return; }

					scope.$apply(function(scope) {
						var num = element.val();
						if(isNaN(num) ) { return; }
						switch(event.keyCode) {
							case 38: // up
								modelAccessor.assign(scope, parseInt(num, 0) + 1)
								break;
							case 40: // down
								modelAccessor.assign(scope, parseInt(num, 0) - 1)
								break;
						}
					});
				})
			}

		},

	}
}])
.directive("camera", ["CameraService", function(CameraService) {
	return {
		replace: true,
		transclude: true,
		scope: {
			cameraApi : "="
		},
		template: '<video class="video" autoplay></video>',
		compile: function(element, attrs) {
			if (!CameraService.hasUserMedia ) {
				element.replaceWith("Sorry, we are unable to access your camera.");
				return {};
			}
   	    	var w = attrs.width || 400,
	        	h = attrs.height || 300;

			return function(scope, element, attrs) {

				var userMedia = CameraService.getUserMedia();
				var videoElement = document.querySelector("video");
/*
				var constraints = video: {
			    mandatory: {
			      maxHeight: h,
			      maxWidth: w
			    }
			  };
*/
				const constraints = {
					audio: false,
					video: {
						width: { min: w },
						height: { min: h }
					}
				};

				// Make the request for the media
				navigator.getUserMedia(constraints, onSuccess, onFailure);

				// set the scope variables
				scope.w = w; scope.h = h;
				scope.cameraApi = {
					getSnapshot : function() { return videoElement; }
				}

				// Success/Failure handlers
				function onSuccess(stream) {
				  if (navigator.mozGetUserMedia) {
				    videoElement.mozSrcObject = stream;
				  } else {
				    var vendorURL = window.URL || window.webkitURL;
				    videoElement.src = window.URL.createObjectURL(stream);
				  }
				  // Just to make sure it autoplays
				  videoElement.play();
				}
				// If there is an error
				function onFailure(err) {
				  console.error(err);
				}

			} // END LINK

		},
	}
}])

.directive("picture", ["$rootScope", "$window", "$timeout", "EaselJS", function($rootScope, $window, $timeout, EaselJS) {

	return {
		replace: true,
		transclude: true,
		template: '<canvas class="picture"></canvas>',
		scope: {
			pictureApi: "="
		},
		link: function(scope, element, attrs) {
   	    	var w = attrs.width || 400,
	        	h = attrs.height || 300;
	        var resizeTimeout;

	        scope.$watch("attrs.width", function() { properties["width"] = attrs.width; draw(); });
	        scope.$watch("attrs.height", function() { properties["height"] = attrs.height; draw(); });
			angular.element($window).on("resize", function() {
				canvas = element[0];
				stage = new EaselJS.Stage(canvas);

				$timeout.cancel(resizeTimeout);
				resizeTimeout = $timeout(function() {draw(); }, 250);
			});


			var canvas  = element[0],
		        curPicture = new Image,
		        curText = "";

	        var stage = new EaselJS.Stage(canvas);
	        stage.enableMouseOver(5);
	        EaselJS.Touch.enable(stage);

		    var properties = [];
		    	properties["width"] = w;
		    	properties["height"] = h;
		    	properties["textLeft"] = 20;
		    	properties["textTop"] = 20;
		    	properties["lineHeight"] = 50;
		    	properties["maxWidth"] = w - 40;

		    scope.pictureApi = {
		    	setPicture : function(picture) {

						// WE DRAW THE PICTURE ON THE CANVAS SO WE CAN SAVE IT FOR REDRAWING THE SCREEN LATER
						// EASELJS SEEMS TO HAVE A PROBLEM WITH THE SIZE WHEN WE DRAW IT DIRECTLY FROM THE VIDEO
						canvas.getContext("2d").drawImage(picture, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
						curPicture = new Image;
						curPicture.addEventListener("load", () => {
							draw();
						});
						curPicture.src = canvas.toDataURL("png");

		    	},
		    	getPicture : function() {
		    		return canvas.toDataURL("png");
		    	},
		    	setText : function(text) { curText = text; draw(); },
		    	set : function(property, value) { properties[property] = value; draw(); },
		    	get : function(property, value) { return properties[property]; }
		    };

		    function draw() {

		    	// ADD CURRENT CAMERA IMAGE
					var bitmap = writeImage({img: curPicture, x:0, y:0, width: canvas.offsetWidth, height: canvas.offsetHeight });
					stage.addChild(bitmap);

		    		var textParams = {
		    			stage: stage,
		    			font: "40pt Impact",
		    			text: curText,
		    			x: properties["textLeft"],
		    			y: properties["textTop"],
		    			maxWidth: properties["maxWidth"],
		    			lineHeight: properties["lineHeight"]
		    		}

		    		if(curText.length > 0) { wrapText(textParams); }
					stage.update();
		    }

			function wrapText(params) {
				var curStage = params.stage,
					font = params.font,
					text = params.text,
					x = params.x,
					y = params.y,
					maxWidth = params.maxWidth,
					lineHeight = params.lineHeight;

				var words = text.split(' ');
				var line = '';
				var curY = 0;

				var dragger = new EaselJS.Container();
				var largestWidth = 0;
				var totalLineHeight = 0;

				for(var n = 0; n < words.length; n++) {
				  var testLine = line + words[n] + ' ';
				  var textObj = new EaselJS.Text(testLine, font);
				  var testWidth = textObj.getMeasuredWidth();
				  if(testWidth > largestWidth) { largestWidth = testWidth; }

				  if (testWidth > maxWidth && n > 0) {
				  	writeText({ parent: dragger, stage: curStage, font: font, text: testLine, x: 0, y: curY});

				    line = ' ';
				    curY = parseInt(curY, 0) + parseInt(lineHeight, 0);
				  }
				  else {
				    line = testLine;
				  }
				}
				writeText({ parent: dragger, stage: curStage, font: font, text: line, x: x, y: curY});
				totalLineHeight = curY || lineHeight;

				dragger.x = x;
				dragger.y = y;

				dragger
				.on("pressmove", function(evt) {
				    evt.currentTarget.x = evt.stageX - (largestWidth / 2);
				    evt.currentTarget.y = evt.stageY - (totalLineHeight / 2);

				    stage.update();
				} );
				dragger.on("pressup", function(evt) {
					$rootScope.$broadcast("TextPos::changed", {left: evt.currentTarget.x, top: evt.currentTarget.y })
					properties["textLeft"] = evt.currentTarget.x * .66;
					properties["textTop"] = evt.currentTarget.y;
				});

				stage.addChild(dragger);
			}

			function writeImage(params) {
				var bitmap = new EaselJS.Bitmap(params.img);
				bitmap.x = params.x;
				bitmap.y = params.y;
				return bitmap;
			}

			function writeText(params) {
				var curStage = params.stage,
					parent = params.parent,
					font = params.font,
					curText = params.text,
					x = params.x,
					y = params.y

				// MAKE A STROKE EFFECT
				var objs = [];

				var strokeAmount = 2;
				var strokeArray = [{x: -strokeAmount, y: 0}, {x: 0, y: -strokeAmount}, {x: strokeAmount, y: 0}, {x: 0, y: strokeAmount}];
				for(var i=0; i < strokeArray.length; i++) {
					var text2 = new EaselJS.Text(curText, font, "#000");
					text2.x = parseInt(x, 0) + parseInt(strokeArray[i].x, 0);
					text2.y = parseInt(y, 0) + parseInt(strokeArray[i].y, 0);
					parent.addChild(text2);
				}

				var text = new EaselJS.Text(curText, font, "#fff");
				text.x = x;
				text.y = y;
				parent.addChild(text);
			}
		}
	}
}])


})();
