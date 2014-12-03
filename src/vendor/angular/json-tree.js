/*!
 * Json Tree viewer
 *
 * Copyright 2014 Konstantin Skipor
 *
 * Modified by Saltuk Alakus
 *
 * https://github.com/saltukalakus/json-tree
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
(function(){

    'use strict';

    angular.module('json-tree', [])
        .constant('jsonTreeConfig', {
            //templateUrl : 'template.html'
            templateUrl : ''
        })

        .directive('jsonTree', ['$compile', '$q', '$http', '$templateCache', 'jsonTreeConfig',  function($compile, $q, $http, $templateCache, jsonTreeConfig) {

            var template =
                '<ul ng-hide="node.isCollapsed">' +
                    '<li ng-repeat="key in utils.keys(json) track by key">' +
                    '<div class="form-group">' +
                            '<div  class="text-primary" class="key" ng-click="utils.clickNode(childs[key])" >' +
                            '<i ng-show="childs[key].isCollapsed && (childs[key].type() === \'object\' || childs[key].type() === \'array\')" class="icon-plus-sign-alt icon-large" ></i>' +
                            '<i ng-show="childs[key].isCollapsed === false && (childs[key].type() === \'object\' || childs[key].type() === \'array\')" class="icon-minus-sign-alt icon-large"></i>' +
                            ' {{ key }} </div>' +
                            '<div class="control">' +
                            '<div ng-hide="childs[key].isObject()">' +
                                '<input ng-show="childs[key].type() === \'number\'" type="number" id="json[key]" name="json[key]" ng-model="json[key]" class="form-control" bs-modifiable required/>' +
                                '<input ng-show="childs[key].type() !== \'number\'" type="text" id="json[key]" name="json[key]" ng-model="json[key]" ng-change="utils.validateNode(key)" placeholder="null" class="form-control" bs-modifiable required/>' +
                            '</div>' +
                            '</div>' +
                            '<json-tree json="json[key]" collapsed-level="{{+collapsedLevel - 1}}" node="childs[key]" ng-show="childs[key].isObject()"></json-tree>' +
                    '</div>' +
                    '</li>' +
                '</ul>';
            function getTemplatePromise() {
                if(jsonTreeConfig.templateUrl) return $http.get(jsonTreeConfig.templateUrl, {
                    cache: $templateCache
                }).then(function (result) {
                    return result.data;
                });

                return $q.when(template);
            }

            return {
                restrict: 'EA',
                scope: {
                    json: '=',
                    node: '=?',
                    childs: '=?',
                    collapsedLevel: '@'
                },
                controller: function($scope){

                    /* initialize container for child nodes */
                    $scope.childs = {};

                    /* define auxiliary functions */
                    $scope.utils = {

                        /* collapse/expand node by clicking */
                        clickNode: function(node){
                            node.isCollapsed = !node.isCollapsed;
                        },

                        /* reset node value by key to default == null */
                        resetNode: function(key){
                            $scope.json[key] = null;
                            $scope.refresh();
                        },

                        /* validate text if input to the form */
                        validateNode: function(key){
                            /* check if null */
                            if ($scope.json[key] === null);

                            /* check if undefined or "" */
                            else if ($scope.json[key] === undefined | $scope.json[key] === '') $scope.json[key] = null;

                            /* try to convert string to number */
                            else if (!isNaN(+$scope.json[key]) && isFinite($scope.json[key]))
                                $scope.json[key] = +$scope.json[key];
                        },

                        /* to skip ordering in ng-repeat */
                        keys: function(obj){
                            return (obj instanceof Object) ? Object.keys(obj) : [];
                        },

                        /* get type for variable val */
                        getType: function(val){
                            if (val === null) return 'null'
                            else if (val === undefined) return 'undefined'
                            else if (val.constructor === Array) return 'array'
                            else if (val.constructor === Object) return 'object'
                            else if (val.constructor === String) return 'string'
                            else if (val.constructor === Number) return 'number'
                            else return 'string'
                        }
                    };

                    /* define properties of the current node */
                    $scope.node = {

                        /* check node is collapsed */
                        isCollapsed: ($scope.collapsedLevel && +$scope.collapsedLevel) ? (+$scope.collapsedLevel <= 0) : true, /* set up isCollapsed properties, by default - true */

                        /* if childs[key] is dragging now, dragChildKey matches to key  */
                        dragChildKey: null,

                        /* used to get info such as coordinates (top, left, height, width, meanY) of draggable elements by key */
                        dragElements: {},

                        /* check current node is object or array */
                        isObject: function(){
                            return angular.isObject($scope.json)
                        },

                        /* get type for current node */
                        type: function(){
                            return $scope.utils.getType($scope.json);
                        },

                        /* calculate collection length for object or array */
                        length: function(){
                            return ($scope.json instanceof Object) ? (Object.keys($scope.json).length) : 1
                        },

                        /* refresh template view */
                        refresh: function(){
                            $scope.refresh();
                        }
                    };
                },
                link: function(scope, element, attrs){

                    /* define child scope and template */
                    var childScope = scope.$new(),
                        templatePromise = getTemplatePromise()

                    /* define build template function */
                    scope.build = function(_scope){
                        if (scope.node.isObject()){
                            templatePromise.then(function(tpl) {
                                element.html('').append($compile(tpl)(_scope));
                            });
                        }
                    };

                    /* define refresh function */
                    scope.refresh = function(){
                        childScope.$destroy();
                        childScope = scope.$new();
                        scope.build(childScope);
                    };

                    /* build template view */
                    scope.build(childScope);
                }
            }
        }])
})()