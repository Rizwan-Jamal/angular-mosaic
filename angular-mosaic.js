(function ( window, angular, undefined ) {
	angular.module('codinghitchhiker.mosaic', [])
		.directive('mosaic', ['$rootScope', '$window','$interval', function ($rootScope, $window, $interval) {
			return {
				restrict: 'AE',
				template: '<div class="layout"></div><div ng-repeat="column in columns track by $index" class="column column{{::$index+1}}"><div ng-repeat="lhs in column" class="item item{{::$index+1}}"><div mosaic-transclude></div></div></div>',
				transclude: true,
				priority: 1001,
				compile: function ($element, $attr) {
					var showFilters = $attr.filters;
					var expression = $attr.mosaic;
					$element.addClass('mosaic');
	
					// Get left hand side, and right hand side elements
					var match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)$/);
					if (!match) {
						throw "Expected expression in form of '_item_ in _collection_' but got '" + expression + "'.";
					}
					var lhs = match[1];
					var rhs = match[2].split(' ');
					var collection = rhs.shift();
					var rest = rhs.join(' ');
	
					// Replace lhs in the template for the ngRepeat
					$element.html($element.html().replace('ng-repeat="lhs in column"', 'ng-repeat="' + lhs + ' in column ' + rest + '"'));
	
					return function ($scope, $element) {
	
						// Watch the data for changes
						$scope.$watchCollection(collection, function (newVal, oldVal) {
							updateColumns(newVal !== oldVal, $scope.$eval(showFilters));
						});
						$scope.$watch(showFilters, function (newVal, oldVal) {
							if(newVal !== oldVal) {
								updateColumns(true, newVal);
							}
						});
	
						var lastWidth = 0, columnCount = 0;
	
						// Find layout element
						var layout = $element.children()[0];
						if (layout.className != 'layout') {
							throw "Layout element is not the first child element of Mosaic.  Template failure.";
						}
	
						function updateColumns(force, showFilters) {
							// Make sure we're not re-rendering for no reason
							if (($window.innerWidth !== lastWidth && layout.offsetWidth !== columnCount) || force) {
								lastWidth = $window.innerWidth;
								$element.removeClass('col-' + columnCount);
								columnCount =  layout.offsetWidth;
								if (columnCount == 4 && showFilters) {
									columnCount = 3
									$element.addClass('sidebarOpen')
								} else {
									$element.removeClass('sidebarOpen')
								}
								$element.addClass('col-' + columnCount);
								var columns = [];
	
								//TODO: add caching solution for models, if possible
	
								angular.forEach($scope.$eval(collection), function (value, index) {
									index = index % columnCount;
									if (!columns[index]) {
										columns[index] = [];
									}
									columns[index].push(value);
								});
	
								$scope.columns = columns;
							}
						}
	
						var timer = null;
	
						function onResize() {
							// Need to delay slightly or else the barrage of resize events
							// makes the updateColumns function go nuts
							if (timer) {
								$interval.cancel(timer);
							}
							timer = $interval(updateColumns(false, $scope.$eval(showFilters)), 50, 1);
						}
	
						// Listen for resize event
						angular.element($window).bind('resize', onResize);
	
						// Clean up
						$scope.$on("$destroy", function () {
							angular.element($window).unbind('resize', onResize);
						});
					}
				}
			};
		}]).directive('mosaicTransclude', function () {
			return {
				restrict: 'EAC',
				link: function ($scope, $element, $attrs, controller, $transclude) {
					if (!$transclude) {
						throw minErr('ngTransclude')('orphan',
								'Illegal use of ngTransclude directive in the template! ' +
								'No parent directive that requires a transclusion found. ' +
								'Element: {0}',
							startingTag($element));
					}
	
					$transclude($scope, function (clone) {
						$element.empty();
						$element.append(clone);
					});
				}
			}
		});
	
	})( window, window.angular );
	