app.controller('navController', function ($scope) {
  
});

app.controller('homeController', function ($scope) {
  
});

app.controller('searchController', function ($scope, $routeParams, $location, ytData) {
  $scope.searchQuery = $routeParams.query;
  
  $scope.searchChannels = function () {
    if ($scope.searchQuery) {
      ytData.search($scope.searchQuery, 'channel').then(function (res) {
        $scope.searchResults = res.data.items;
        $location.path('/search/' + $scope.searchQuery);
        $location.replace();
      }, errorHandler);
    }
    else {
      $scope.searchResults = [];
    }
  };
  
  $scope.searchChannels();
});

app.controller('channelController', function ($scope, $rootScope, $routeParams, $filter, ytData, ytPlayer, ytCustom, $anchorScroll) {
  $rootScope.channelId = $routeParams.id;
  ytPlayer.initialise();
  
  $scope.loadVideo = function (playlistItems, index, playlistId) {
    var playlistItemsIds = playlistIds(playlistItems);
    $rootScope.selectedPlaylist = {
      id: playlistId,
      items: playlistItemsIds
    };
    ytPlayer.loadPlaylist(playlistItemsIds, index, playlistId);
    $anchorScroll('player-top');
  };
  
  $scope.prevVideo = function () {
    ytPlayer.prevVideo();
  };
  
  $scope.nextVideo = function () {
    ytPlayer.nextVideo();
  };
  
  $scope.reverseTimeline = function() {
    $scope.reverseTimelineOrder = !$scope.reverseTimelineOrder;
    if ($scope.timeline.id == $rootScope.selectedPlaylist.id) $rootScope.selectedPlaylist.items = playlistIds($scope.timeline.items.reverse());
  };
  
  $scope.reversePlaylist = function (id) {
    var targetPlaylist = $filter('filter')($scope.playlists, {id: id})[0];
    if (targetPlaylist) {
      targetPlaylist.items.reverse();
      if (id == $rootScope.selectedPlaylist.id) $rootScope.selectedPlaylist.items = playlistIds(targetPlaylist.items);
    }
  };
  
  $scope.liveSwitch = function (id, items) {
    $rootScope.selectedPlaylist = {
      id: id,
      items: playlistIds(items)
    };
  };
  
  $scope.loadChannel = function () {
    ytData.getChannel($scope.channelId).then(function (res) {
      $scope.channelInfo = res.data.items[0];
      $scope.channelInfo.statistics.subscriberCount = parseInt($scope.channelInfo.statistics.subscriberCount, 10);
      $scope.channelInfo.statistics.viewCount = parseInt($scope.channelInfo.statistics.viewCount, 10);
      $scope.channelInfo.statistics.videoCount = parseInt($scope.channelInfo.statistics.videoCount, 10);
      $scope.timeline = {
        id: $scope.channelInfo.contentDetails.relatedPlaylists.uploads,
        items: []
      };

      ytCustom.getAllPlaylistItems($scope.timeline.id).then(function (res) {
        $scope.timeline.items = playlistOrder(res);
        var loadItems = $scope.timeline.items;
        $scope.loadVideo($scope.timeline.items, $scope.timeline.items.length-1, $scope.timeline.id);
      }, errorHandler);
      
      ytData.getPlaylists($scope.channelId).then(function (res) {
        $scope.playlists = res.data.items;
        $scope.timeline.nextPage = res.data.nextPageToken;
        angular.forEach($scope.playlists, function (playlist) {
          ytCustom.getAllPlaylistItems(playlist.id).then(function (res2) {
            playlist.items = res2;
          }, errorHandler);
        });
      }, errorHandler);
    }, errorHandler);
  };
  $scope.loadChannel();
});

function errorHandler (err) {
  console.log(err);
}