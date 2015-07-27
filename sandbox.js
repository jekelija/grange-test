//right now, assume entire database is available to client
//on server, this sets up a mongodb collection
//on client, this creates a cache bound to the server collection
mongoSongs = new Mongo.Collection('u2db');

if (Meteor.isClient) {
    // create our angular app and inject ui.bootstrap as well as meteor
    angular.module('u2-search', ['angular-meteor', 'ui.bootstrap'])
    
    angular.module('u2-search').controller('U2SearchCntrl', ['$scope','$meteor',
        function ($scope, $meteor) { //meteor service is auto provided
            $scope.showingAll = false;
            $scope.showAllBtnText = "Show All";
            $scope.toggleShowAll = function() {
                //clear out the query; this should dynamically call the watch method
                $scope.searchStr = '';
                //toggle showingAll
                $scope.showingAll = !$scope.showingAll;
                //toggle text
                $scope.showAllBtnText = $scope.showAllBtnText === "Show None" ? "Show All" : "Show None";
            }
            
            //define a map to keep track of what songs selected their album
            $scope.singleSelectedMap = {}; 
            //define a map to keep track of what songs are in each album
            $scope.albumSongs = {}; 

            $scope.albumSelected = function(singleName, albumName) {
                //if that entry in the map has been previously defined, toggle it
                if($scope.singleSelectedMap[singleName]) {
                    $scope.singleSelectedMap[singleName] = !$scope.singleSelectedMap[singleName];
                }
                //if that entry has never been defined, this is the first time its called, which means we should make it viewable
                else {
                    $scope.singleSelectedMap[singleName] = true;
                }
                
                console.log('Album selected func called: ' + singleName + ':' + albumName + "");
                //only load when we need to
                if(!$scope.albumSongs[albumName]) {
                    $scope.albumSongs[albumName] = $meteor.collection(function() {
                        //notice the re-use of mongosongs here; can only have one collection for the db
                        return mongoSongs.find(
                            {album: albumName }
                        );
                    });
                }
            }
            
                                                                     
            
            $scope.mongoSongs = $meteor.collection(function() {
                //getreactively lets us watch the query attribute
                if($scope.getReactively('query')!= null) {
                    return mongoSongs.find({$or: [
                        {artist: { $regex: $scope.query }},
                        {$where : $scope.numberQuery },
                        {album: { $regex:  $scope.query }},
                        {single: { $regex: $scope.query }},
                    ]}, { sort: { year: 1 } }
                    );
                }
                //always have to return something; return the whole thing
                else {
                    return mongoSongs.find({}, { sort: { year: 1 } });
                }
            });

            //this watches the $parent.searchStr
            $scope.$watch('searchStr', function() {
                console.log('Search String changed: ' + $scope.searchStr);
                if($scope.searchStr != null && $scope.searchStr.length > 0) {
                    try {
                        $scope.query = new RegExp($scope.searchStr.toLowerCase(), "i");
                        $scope.numberQuery = '/' + $scope.searchStr + '/.test(this.year)';
                        //successful query, null out the error msg to hide the text
                        $scope.errorMsg = null;
                    } catch(err) {
                        console.log(err);
                        $scope.errorMsg = "An invalid character has been entered; please delete it";
                        //if we catch an error, null out the query so no resuls are displayed
                        $scope.query = null;
                    }
                }
                else {
                    //null searchStr == no query; null out the error msg and null out the query
                    $scope.query = null;
                    $scope.errorMsg = null;
                }

            });
        }
    ]);
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        //load database with U2 items if necessary
        if(mongoSongs.find().count() == 0) {
            //Create some users
            var u2Songs = [
                {artist:"U2",year:1980,album:"Boy",single:"I Will Follow", thumb:"images/boy_album.jpg"},
                {artist:"U2",year:1981,album:"October",single:"Gloria", thumb:"images/october_album.jpg"},
                {artist:"U2",year:1983,album:"War",single:"New Years Day", thumb:"images/war_album.png"},
                {artist:"U2",year:1984,album:"Unforgettable Fire",single:"Pride(In the Name of Love)", thumb:"images/unforgettable_fire_album.jpg"},
                {artist:"U2",year:1987,album:"Joshua Tree",single:"With or Without You", thumb:"images/joshua_tree_album.jpg"},
                {artist:"U2",year:1987,album:"Joshua Tree",single:"Where the Streets Have No Name", thumb:"images/joshua_tree_album.jpg"},
                {artist:"U2",year:1987,album:"Joshua Tree",single:"I Still Haven't Found What I'm Looking For", thumb:"images/joshua_tree_album.jpg"},
                {artist:"U2",year:1988,album:"Rattle and Hum",single:"When Love Comes to Town", thumb:"images/rattle_and_hum_album.jpg"},
                {artist:"U2",year:1988,album:"Rattle and Hum",single:"All I want is You", thumb:"images/rattle_and_hum_album.jpg"}
            ];
            console.log(u2Songs);
            
            //must insert into raw collection until this is supported natively by meteor
            //https://github.com/meteor/meteor/issues/1255
            mongoSongs.rawCollection().insert(u2Songs,
                function(err, result) {
                    console.log("Error: " + err);
                }
            );
        }
        
    });
  
}
