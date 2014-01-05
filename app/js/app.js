(function() { 
"use strict";

angular.module("MyApp", ["ngRoute", "ui.bootstrap"])
.config(["$compileProvider", "$routeProvider", "$httpProvider", function($compileProvider, $routeProvider, $httpProvider) {
	var oldWhiteList = $compileProvider.imgSrcSanitizationWhitelist();
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\/|data:application\/octet-stream/);
	$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\/|data:application\/octet-stream/);

/*
	$routeProvider
		.when("/camera", {
			templateUrl: "views/camera.html",
			controller: "CameraController"
		})
		.when("/picture", { 
			templateUrl: "views/picture.html",
			controller: "PictureController"
		})
		.otherwise({ redirectTo: "/camera" });
*/

  // Use x-www-form-urlencoded Content-Type
  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
 
  // Override $http service's default transformRequest
  $httpProvider.defaults.transformRequest = [function(data)
  {
    /**
     * The workhorse; converts an object to x-www-form-urlencoded serialization.
     * @param {Object} obj
     * @return {String}
     */ 
    var param = function(obj)
    {
      var query = '';
      var name, value, fullSubName, subName, subValue, innerObj, i;
      
      for(name in obj)
      {
        value = obj[name];
        
        if(value instanceof Array)
        {
          for(i=0; i<value.length; ++i)
          {
            subValue = value[i];
            fullSubName = name + '[' + i + ']';
            innerObj = {};
            innerObj[fullSubName] = subValue;
            query += param(innerObj) + '&';
          }
        }
        else if(value instanceof Object)
        {
          for(subName in value)
          {
            subValue = value[subName];
            fullSubName = name + '[' + subName + ']';
            innerObj = {};
            innerObj[fullSubName] = subValue;
            query += param(innerObj) + '&';
          }
        }
        else if(value !== undefined && value !== null)
        {
          query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
        }
      }
      
      return query.length ? query.substr(0, query.length - 1) : query;
    };
    
    return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
  }];


}])
.controller("NavController", ["$scope", "AppState", function($scope, AppState) { 
	$scope.gotoCamera = function()  { AppState.set("showCamera", true);	 AppState.set("showPicture", false); }
	$scope.gotoPicture = function() { AppState.set("showCamera", false); AppState.set("showPicture", true); }
}])
.controller("CameraController", ["$scope", "$rootScope", "$timeout", "AppState", function($scope, $rootScope, $timeout, AppState) {
	$rootScope.$on("AppState.showCamera::changed", function() { $scope.showCamera = AppState.get("showCamera"); })

	$timeout(function() { 
		AppState.set("cameraAPI", $scope.cameraAPI);
	}, 0);

	$scope.showCamera = true;
	$scope.delayedLabel = "Take Delayed Picture (5s)";
	$scope.width = 400;
	$scope.height = 300;

	$scope.takeSnapshot = function() { takePicture(); }

	var timeout;
	$scope.takeDelayedSnapshot = function() {
		function countdown(num) {
			if(num < 0) { 
				takePicture();
				$scope.delayedLabel = "Take Delayed Picture (5s)"
			}
			else {
				$scope.delayedLabel = num;
				timeout = $timeout(function() { countdown(num - 1); }, 1000);
			}
		}
		$timeout.cancel(timeout);
		countdown(5);
	}	

	function takePicture() {
		AppState.get("pictureAPI").setPicture( AppState.get("cameraAPI").getSnapshot() );
		AppState.set("showPicture", true);
		AppState.set("showCamera", false);
	}

}])
.controller("PictureController", ["$scope", "$rootScope", "$timeout", "$modal", "AppState", function($scope, $rootScope, $timeout, $modal, AppState) {
	$rootScope.$on("AppState.showPicture::changed", function() { 
		$scope.showPicture = AppState.get("showPicture"); 
		$scope.downloadURL = AppState.get("pictureAPI").getPicture();
	});
	$rootScope.$on("TextPos::changed", function(name, response) { 
		console.log(response);
		$scope.$apply(function() { 
			$scope.textInfo.left = response.left;
			$scope.textInfo.top = response.top;
		});
	});

	$scope.showPicture = false;
	$scope.picturewidth = 400;
	$scope.pictureheight = 300;

	$timeout(function() { 
		AppState.set("pictureAPI", $scope.pictureAPI);
	}, 0)

	var textTimeout;
	$scope.$watch("text", function() { 
		if($scope.text != null) {
			if(textTimeout) { $timeout.cancel(textTimeout); }
			textTimeout = $timeout(function() { 
				AppState.get("pictureAPI").setText($scope.text);
				$scope.downloadURL = AppState.get("pictureAPI").getPicture();
			}, 200)
		}
	})

	$timeout(function() {$scope.textInfo = { left: 0, top: 200, lineHeight: 50, maxWidth : $scope.picturewidth }; }, 1000);

	$scope.$watch("textInfo.left", function() { 
		if(!AppState.get("pictureAPI")) { return; }
		AppState.get("pictureAPI").set("textLeft", $scope.textInfo.left);
	})
	$scope.$watch("textInfo.top", function() { 
		if(!AppState.get("pictureAPI")) { return; }
		AppState.get("pictureAPI").set("textTop", $scope.textInfo.top);
	})
	$scope.$watch("textInfo.lineHeight", function() { 
		if(!AppState.get("pictureAPI")) { return; }
		AppState.get("pictureAPI").set("lineHeight", $scope.textInfo.lineHeight);
	})
	$scope.$watch("textInfo.maxWidth", function() { 
		if(!AppState.get("pictureAPI")) { return; }
		AppState.get("pictureAPI").set("maxWidth", $scope.textInfo.maxWidth);
	})

	$scope.download = function() {
	    var dt = AppState.get("pictureAPI").getPicture();
	    this.href = dt;
	}

	$scope.clearText = function() {
		$scope.text = '';
	}
 
	$scope.openEmail = function() { 
		function ModalInstanceCtrl ($scope, $modalInstance, EmailService, picture) {

//			$scope.user = { to: "", name: "", email: "", subject: "", message: "" };
			$scope.user = { 
				to: "john.p.pangilinan@gmail.com", 
				name: "John", 
				email: "john.pangilinan1@gmail.com", 
				subject: "Greetings! An image from " + this.name, 
				message: "You have a message from a special person!" };

			$scope.ok = function () {
				console.log(picture, $scope);
				var data = { 
					to: $scope.user.to,
					name: $scope.user.name, 
					email: $scope.user.email, 
					subject: $scope.user.subject, 
					message: $scope.user.message };
				data.attachment = picture;
				EmailService.send(data)
					.then(function(response) { 
						console.log(response); 
						$modalInstance.close("ok");
					}, 
					function(response) { 
						console.log(response); 
					} );
				
			};

			$scope.cancel = function () {
				$modalInstance.dismiss('cancel');
			};
		};		    

		var modalInstance = $modal.open({
		      templateUrl: 'modal.html',
		      controller: ModalInstanceCtrl,
		      resolve: {
		        picture: function () {
		          return AppState.get("pictureAPI").getPicture();
		        }
		      }
		    });
	}


}])



})();
