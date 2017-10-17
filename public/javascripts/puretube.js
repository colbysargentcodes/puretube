var app = angular.module('puretube', ['ngRoute']),
  ytKey = 'AIzaSyCtUCunH2Tj_Mw5VjQ5SkHmytyWVm5EN5M';

function playlistIds (playlistItems) {
  var ids = [];
  for (var item in playlistItems) {
    ids.push(playlistItems[item].snippet.resourceId.videoId);
  }
  return ids;
}

function playlistOrder (playlistItems) {
  playlistItems.sort(function (a, b) {
    return a.snippet.publishedAt.localeCompare(b.snippet.publishedAt);
  });
  return playlistItems;
}

function indexOfProperty (array, key, property) {
  for (var i = 0; i < array.length; i++) {
    if (array[i][key] == property) return i;
  }
  return -1;
}

app.config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/', {
      templateUrl : 'partials/home',
      controller  : 'homeController'
    })
    .when('/search/:query', {
      templateUrl : 'partials/search',
      controller  : 'searchController'
    })
    .when('/channel/:id', {
      templateUrl : 'partials/channel',
      controller  : 'channelController'
    });
  $locationProvider.html5Mode(true);
});

app.filter('livePlaylists', function ($rootScope) {
  return function (playlists, a, b) {
    var filteredPlaylists = [];
    var notLive = a === false ? true : false;
    if (playlists && $rootScope.activeVideo) {
      for (var i = 0; i < playlists.length; i++) {
        var isLive = false;
        var playlistVideoIds = playlistIds(playlists[i].items);
        if (playlistVideoIds.indexOf($rootScope.activeVideo.id) > -1) isLive = true;
        else isLive = false;
        if (isLive != notLive) filteredPlaylists.push(playlists[i]);
      }
    }
    else if (notLive) filteredPlaylists = playlists;
    return filteredPlaylists;
  };
});

app.factory('ytData', function ($http, $q) {
  var getVideoCanceller = $q.defer();
  return {
    search: function (query, type) {
      return $http({
        method: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/search',
        params: {
          part: 'snippet',
          q: query,
          type: type ? type : '',
          key: ytKey
        }
      });
    },
    getChannel: function (id) {
      return $http({
        method: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/channels',
        params: {
          part: 'snippet,statistics,contentDetails',
          id: id,
          key: ytKey
        }
      });
    },
    getPlaylists: function (channelId) {
      return $http({
        method: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/playlists',
        params: {
          part: 'snippet',
          channelId: channelId,
          maxResults: 50,
          key: ytKey
        }
      });
    },
    getPlaylistItems: function (id, pageToken) {
      return $http({
        method: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/playlistItems',
        params: {
          part: 'snippet,contentDetails,status',
          playlistId: id,
          maxResults: 50,
          pageToken: pageToken,
          key: ytKey
        }
      });
    },
    getVideo: function (id) {
      getVideoCanceller = $q.defer();
      return $http({
        method: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/videos',
        timeout: getVideoCanceller.promise,
        params: {
          part: 'snippet,statistics',
          id: id,
          key: ytKey
        }
      });
    },
    cancelGetVideo: function () {
      getVideoCanceller.resolve();
    }
  };
});

app.factory('ytPlayer', function ($rootScope, ytCustom) {
  var status = 0; // 0 = false, 1 = initialised
  var currentInitialise = 0;
  var player = false;
  var done = false;
  var suggestedQuality = 'large';
  var preloadPlaylist = false;
  
  var onYouTubeIframeAPIReady = function () {
    if (YT.loaded < 1) {
      setTimeout(onYouTubeIframeAPIReady, 50);
    }
    else {
      player = new YT.Player('youtubePlayer', {
        playerVars: {
          color: 'white',
          showinfo: 0
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange,
          'onPlaybackQualityChange': onPlaybackQualityChange,
          'onError': onError,
        }
      });
    }
  };
  
  var onPlayerReady = function (event) {
    status = 1;
    currentInitialise = 1;
    if (preloadPlaylist) {
      loadPlaylist(preloadPlaylist.playlistIds, preloadPlaylist.index, preloadPlaylist.playlistId);
    }
  };
  
  var onPlayerStateChange = function (event) {
    if (event.data == YT.PlayerState.UNSTARTED) {
      // ALT: event.data == -1
      ytCustom.setActiveVideoById(player.getVideoData().video_id);
    }
    else if (event.data == YT.PlayerState.BUFFERING) {
      // ALT: event.data == 3
      ytCustom.setActiveVideoById(player.getVideoData().video_id, true);
    }
    else if (event.data == YT.PlayerState.ENDED) {
      // ALT: event.data == 0
      checkSelected();
    }
    else if (event.data == YT.PlayerState.PLAYING && !done) {
      // ALT: event.data == 1
      done = true;
    }
  };
  
  var onPlaybackQualityChange = function (event) {
    suggestedQuality = event.data;
  };
  
  var onError = function (event) {
    var errorVideoId = player.getVideoData().video_id;
    setTimeout(function () {
      if (player.getVideoData().video_id == errorVideoId) nextVideo();
    }, 3000);
  };
  
  var loadPlaylist = function (items, index, id) {
    player.loadPlaylist(items, index, 0, suggestedQuality);
    $rootScope.activePlaylist = {
      id: id,
      items: items
    };
  };
  
  var prevVideo = function () {
    if (!checkSelected(true, true) && player.getPlaylistIndex() > 0) player.previousVideo();
  };
  
  var nextVideo = function () {
    console.log(player.getPlaylistIndex());
    console.log(player.getPlaylist());
    if (!checkSelected(true) && player.getPlaylistIndex() < player.getPlaylist().length - 1) player.nextVideo();
  };
  
  var checkSelected = function (noNudge, prev) {
    function tryLoad (id) {
      var selectedIndex = $rootScope.selectedPlaylist.items.indexOf(id);
      if (prev && selectedIndex === 0) return 0;
      else if (selectedIndex > -1) {
        var nextIndex = prev?selectedIndex - 1:selectedIndex + 1;
        loadPlaylist($rootScope.selectedPlaylist.items, nextIndex, $rootScope.selectedPlaylist.id);
        return 1;
      }
      else return false;
    }
    
    if (!angular.equals($rootScope.selectedPlaylist, $rootScope.activePlaylist)) {
      var playerPlaylist = player.getPlaylist();
      var playerIndex = playerPlaylist.indexOf(player.getVideoData().video_id);
      var searchNudge = noNudge || playerIndex === 0 || playerIndex === playerPlaylist.length - 1 ? 0 : 1;
      
      if (playerPlaylist.indexOf(player.getVideoData().video_id) - 1 > -1) {
        var prevId = playerPlaylist[playerPlaylist.indexOf(player.getVideoData().video_id) - searchNudge];
        var result = tryLoad(prevId);
        if (result === 0) return true;
        else if (result) return true;
        else player.stopVideo();
      }
      else player.stopVideo();
    }
    else return false;
  };
  
  return {
    initialise: function (func) {
      currentInitialise = 0;
      if (status === 0) {
        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        tag.addEventListener('load', function () {
          onYouTubeIframeAPIReady();
        });
      }
      else onYouTubeIframeAPIReady();
    },
    loadVideo: function (id) {
      player.loadVideoById(id);
    },
    loadPlaylist: function (playlistIds, index, playlistId) {
      if (status === 0 || currentInitialise === 0) preloadPlaylist = {playlistIds: playlistIds, index: index, playlistId: playlistId};
      else loadPlaylist(playlistIds, index, playlistId);
    },
    prevVideo: function () {
      prevVideo();
    },
    nextVideo: function () {
      nextVideo();
    }
  };
});

app.factory('ytCustom', function ($rootScope, ytData, $q) {
  var setActivePromise;
  return {
    setActiveVideoById: function (videoId, noCancel) {
      if (setActivePromise && !noCancel) ytData.cancelGetVideo();
      setActivePromise = ytData.getVideo(videoId);
      setActivePromise.then(function (res) {
        res.data.items[0].statistics.viewCount = parseInt(res.data.items[0].statistics.viewCount, 10);
        $rootScope.activeVideo = res.data.items[0];
        setActivePromise = false;
      });
    },
    getAllPlaylistItems: function (id) {
      var defer = $q.defer();
      var allItems = [];
      
      function getPlaylistItems (nextPage) {
        ytData.getPlaylistItems(id, nextPage).then(function (res) {
          allItems = allItems.concat(res.data.items);
          if (res.data.nextPageToken) getPlaylistItems(res.data.nextPageToken);
          else {
            for (var i = allItems.length - 1; i > -1; i--) {
              if (allItems[i].status.privacyStatus == 'private') allItems.splice(i, 1);
            }
            allItems = allItems.slice(0, 200); // current API limitation, player only allows playlist length of 200
            defer.resolve(allItems);
          }
        });
      }
      
      getPlaylistItems();
      return defer.promise;
    }
  };
});