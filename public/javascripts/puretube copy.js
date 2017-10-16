var app = angular.module('puretube', ['ngRoute']);

app.config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/', {
      templateUrl : 'partials/home',
      controller  : 'homeController'
    })
    .when('/channel', {
      templateUrl : 'partials/channel',
      controller  : 'channelController'
    });
  $locationProvider.html5Mode(true);
});

app.filter('youtubeEmbed', function ($sce) {
  return function (id) {
    return $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + id);
  };
});

app.factory('fullPlaylist', function ($http) {
  return {
    find: function (id) {
      var returnItems = [];
      var nextPage = true;
      
      $http({
        method: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/playlistItems',
        params: {
          part: 'snippet,contentDetails',
          playlistId: id,
          maxResults: 50,
          key: 'AIzaSyCtUCunH2Tj_Mw5VjQ5SkHmytyWVm5EN5M'
        }
      }).then(function (res) { console.log(res.data);
        returnItems = returnItems.concat(res.data.items);
        if (res.data.nextPageToken) nextPage = res.data.nextPageToken;
        else nextPage = false;
        return returnItems;
      }, function (err) {
        console.log(err);
      });
    }
  }
});

app.factory('ytPlayer', function () {
  var status = 0; // 0 = false, 1 = initialised
  var player = false;
  var done = false;
  var suggestedQuality = 'large';
  var onYouTubeIframeAPIReady = function () {
    service = 5;
    if (YT.loaded < 1) {
      setTimeout(onYouTubeIframeAPIReady, 50);
      console.log('not ready');
    }
    else {
      player = new YT.Player('youtubePlayer', {
        height: '390',
        width: '640',
        videoId: 'M7lc1UVf-VE',
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange,
          'onPlaybackQualityChange': onPlaybackQualityChange,
        }
      });
    }
  };
  var onPlayerReady = function (event) {
    status = 1;
    console.log(event.target);
    event.target.playVideo();
  };
  var onPlayerStateChange = function (event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
      // ALT: event.data == 1
      setTimeout(stopVideo, 7000);
      done = true;
    }
    if (event.data == YT.PlayerState.ENDED) {
      // ALT: event.data == 0
      player.loadVideoById('Ndpryp2OlUQ', 'small');
    }
  };
  var onPlaybackQualityChange = function (event) {
    suggestedQuality = event.data;
  }
  
  var stopVideo = function () {
    player.stopVideo();
    player.loadVideoById('ScNNfyq3d_w', 55, suggestedQuality);
  };
  return {
    /*onYouTubeIframeAPIReady: function () { console.log('onYouTubeIframeAPIReady:F');
      onYouTubeIframeAPIReady();
    },
    onPlayerReady: function (event) { console.log('onPlayerReady:F');
      onPlayerReady();
    },
    onPlayerStateChange: function (event) { console.log('onPlayerStateChange:F');
      onPlayerStateChange();
    },
    stopVideo: function () { console.log('stopVideo:F');
      stopVideo();
    },*/
    initialise: function () {
      if (status === 0) {
        console.log('initialise');
        //if (!$scope.scopeVar) $scope.scopeVar = '';
        //console.log($scope.scopeVar);
        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        tag.addEventListener('load', function () {
          console.log('loaded - ');
          onYouTubeIframeAPIReady();
        });
        console.log('should be before loaded');
        /*var tag = angular.element('<script onload="console.log(\'loaded\');" src="https://www.youtube.com/iframe_api"></script>');
        var head = angular.element(document).children().eq(0).children().eq(0);
        head.prepend(tag);
        tag.on('load', function () {
          console.log('tag loaded');
        });
        console.log('tag prepended');*/
      }
    }
  }
});

/*
app.factory('iframeAPI', function (ytPlayer) {
  return {
    onYouTubeIframeAPIReady: function () { console.log('onYouTubeIframeAPIReady:F');
      ytPlayer.onYouTubeIframeAPIReady();
    },
    onPlayerReady: function (event) { console.log('onPlayerReady:F');
      ytPlayer.whatPlayer();
      ytPlayer.whatPlayer();
    },
    onPlayerStateChange: function (event) { console.log('onPlayerStateChange:F');
      ytPlayer.onPlayerStateChange(event);
    }
  }
});

function onYouTubeIframeAPIReady () { console.log('onYouTubeIframeAPIReady:G');
  angular.injector(['puretube']).get('iframeAPI').onYouTubeIframeAPIReady();
}
function onPlayerReady (event) { console.log('onPlayerReady:G');
  //angular.injector(['puretube']).get('iframeAPI').onPlayerReady(event);
  angular.injector(['puretube']).invoke(function (iframeAPI) {
    iframeAPI.onPlayerReady(event);
  });
}
function onPlayerStateChange (event) { console.log('onPlayerStateChange:G');
  angular.injector(['puretube']).get('iframeAPI').onPlayerStateChange(event);
}*/