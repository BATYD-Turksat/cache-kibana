(function(){

    var myApp = angular.module('myApp', ['json-tree', 'ngInputModified', 'cgBusy']);
    myApp.directive('aDisabled', function() {
        return {
            compile: function(tElement, tAttrs, transclude) {
                //Disable ngClick
                tAttrs["ngClick"] = ("ng-click", "!("+tAttrs["aDisabled"]+") && ("+tAttrs["ngClick"]+")");

                //Toggle "disabled" to class when aDisabled becomes true
                return function (scope, iElement, iAttrs) {
                    scope.$watch(iAttrs["aDisabled"], function(newValue) {
                        if (newValue !== undefined) {
                            iElement.toggleClass("disabled", newValue);
                        }
                    });

                    //Disable href on click
                    iElement.on("click", function(e) {
                        if (scope.$eval(iAttrs["aDisabled"])) {
                            e.preventDefault();
                        }
                    });
                };
            }
        };
    });
    myApp.controller('myCtrl', ['$scope', '$http', function($scope, $http) {
        $scope.activeConf = 0;

        $scope.myPromise = $http.get('controls/api/0').
            success(function (data) {
                $scope.jsonData = data;
                $scope.nodeOptions.refresh();
            }).error(function () {
                bootbox.alert("Server error while loading conf file!", function() {
                });
            });

        // Needed for the first view to be created.
        function defaultData() {
            return {
            };
        }

        $scope.jsonData = defaultData();

        $scope.updateChanges = function(id){
            $scope.myPromise = $http({
                url: 'controls/api/' + id,
                method: "POST",
                data: JSON.stringify($scope.jsonData),
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                $scope.myForm.$setPristine();
                bootbox.alert(data.replace(/\n/g,"<br>"));
            }).error(function (data, status, headers, config) {
                bootbox.alert("Server error while sending conf file!", function() {
                });
            });
        }

        $scope.syncLatestFromServer = function(id){
            $scope.myPromise = $http.get('controls/api/' + id).
                success(function (data) {
                    $scope.jsonData = data;
                    $scope.myForm.modified = false;
                    $scope.nodeOptions.refresh();
                }).error(function () {
                    bootbox.alert("Server error while loading conf file!", function() {
                    });
                });
        }
    }])
})();

jQuery(document).ready(function() {
    var token = tokenStore.getToken();
    console.log("This is token==")
    console.log(token)
    // Load the conf item list from server and generate sub-folders
    var conf_items = [];
    $.ajax({
        beforeSend: function(request) {
            request.setRequestHeader("token", token);
        },
        type: "GET",
        cache: false,
        dataType: "json",
        url: "controls/api/confs",
        success: function( data ) {
            var prev_folder = "";
            var sub_folder_entered = false;
            $.each( data, function( index, val ) {
                var arr = val.split('/');
                if (arr.length > 1){
                    if (prev_folder != arr[0]) {
                        if (sub_folder_entered) {
                            conf_items.push('</ul></li>');
                        }
                        conf_items.push('<li class="dropdown-submenu">');
                        conf_items.push('<a tabindex="-1" href="#">'+ arr[0] + '</a>');
                        conf_items.push('<ul class="dropdown-menu">');
                        prev_folder = arr[0];
                        sub_folder_entered = true;
                    }

                    conf_items.push( '<li><a href="#" class="myMenuClick" id=' + index + '>' + arr[arr.length - 1] + '</a></li>' );
                } else {
                    if (sub_folder_entered) {
                        conf_items.push('</ul></li>');
                        sub_folder_entered = false;
                    }
                    conf_items.push( '<li><a href="#" class="myMenuClick" id=' + index + '>' + val + '</a></li>' );
                }

            });
            if (sub_folder_entered) {
                conf_items.push('</ul></li>');
                sub_folder_entered = false;
            }
        }
    });

    // Generate the dropdown for the list of control files.
    $('.dropdown.yml-controls').on('click','a[data-toggle="dropdown"]',
        function(){
            //if($(this).children().length <= 0){
            $(this).after( '<ul class="dropdown-menu" role="menu" aria-labelledby="dLabel" >'  + conf_items.join("") + '</ul>' );
            $(this).dropdown();
            //}
        });

    // Make angular call for the selected control file.
    $('.dropdown.yml-controls').on('click', '.myMenuClick', function () {
        angular.element('#idMyCtrl').scope().activeConf = $(this).attr("id");
        angular.element('#idMyCtrl').scope().syncLatestFromServer($(this).attr("id"));
    });

    // Help texts for control buttons
    $(".loadConfigButton").attr('title', 'Load config');
    $(".saveConfigButton").attr('title', 'Save config');
    $(".resetConfigButton").attr('title', 'Reset config');
});