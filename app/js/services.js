(function(EaselJSLibrary) { 
"use strict";

angular.module("MyApp")
.factory("AppState", ["$rootScope", function($rootScope) { 
	var properties = [];

	return {
		set: function(property, value) { properties[property] = value; $rootScope.$broadcast("AppState." + property + "::changed", { value : value } ); },
		get: function(property) { return properties[property]; }
	}

}])
.factory("CameraService", function($window) { 
	var hasUserMedia = function() {
		return !!getUserMedia();
	}

	var getUserMedia = function() {
		navigator.getUserMedia = ($window.navigator.getUserMedia || 
		                          $window.navigator.webkitGetUserMedia ||
		                          $window.navigator.mozGetUserMedia || 
		                          $window.navigator.msGetUserMedia);
		return navigator.getUserMedia;
	}

	return {
		hasUserMedia: hasUserMedia(),
		getUserMedia: getUserMedia
	}	
})

.factory("EaselJS", function() {
	return EaselJSLibrary;
})

.factory("EmailService", ["$http", function($http) { 
	return {
		send: function(params) {
			var data = {
				"to" : params.to || "",
				"name" : params.name || "", 
				"email" : params.email || "",
				"subject" : params.subject || "",
				"message" : params.message || "",
				"attachment" : params.attachment || "",
				"filename" : "myImage.png"
			}
			// LEAVE IT TO USER TO DEFINE SUCCESS/FAILURE
			return $http({ 
				url: "remote.php?op=sendEmailWithAttachment",
				method: "POST", 
				data: data
			});
		}

	}
}])

})(createjs);
