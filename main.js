
var _client;
var _conversations = {};
var _map;
var _markers = [];

function clearMarkers() {
  _markers.forEach(function (marker) {
    marker.setMap(null);
  });
  _markers = [];
}

function initMap() {
  _map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
    center: {lat: 39.5, lng: -98.3}
  });
}

function addMarker(user) {
  var content = user.displayName + '<br>' + user.userPresenceState.locationText;

  var marker = new google.maps.Marker({
    position: user.coord,
    map: _map
  });

  var infowindow = new google.maps.InfoWindow({
    content: content,
    maxWidth: 200
  });
  infowindow.open(_map, marker);

  _markers.push(marker);
}

function selectConv() {
  var convId = document.getElementById('listbox').value;
  clearMarkers();

  _conversations[convId].users.forEach(function (user) {
    if (user.coord) {
      console.log(user.displayName + ' is in ' + user.userPresenceState.locationText);
      addMarker(user);
    } else {
      console.log(user.displayName + ' is not online is not sharing presence');
    }
  });

  // Center and zoom to fit all markers
  _markers.length && _map.fitBounds(_markers.reduce(function(bounds, marker) {
    return bounds.extend(marker.getPosition());
  }, new google.maps.LatLngBounds()));
  if (_map.getZoom() > 7) {
    _map.setZoom(7);
  }
}

function showTitle(user) {
  document.getElementById('title').textContent = user.firstName + '\'s Conversations';
}

function cacheConversations(conversations) {
  conversations.forEach(function (c) {
    _conversations[c.convId] = c;
  });
  return conversations;
}

function showConversations(conversations) {
  var select = document.getElementById('listbox');
  select.size = conversations.length;
  conversations.forEach(function (c) {
    select.options[select.options.length] = new Option(c.title, c.convId);
  });
}

// This conversation injector needs to be asynchroneous since the user lookup is an API call.
// Sets conversation.title, conversation.users the user.coord
Circuit.Injectors.conversationInjector = function (conversation) {
  return new Promise(function (resolve, reject) {
    _client.getUsersById(conversation.participants).then(function (users) {
      // Set conversation.users
      conversation.users = users;

      // Set conversation.title
      if (conversation.type === 'DIRECT') {
        conversation.title = conversation.users[0].displayName;
      } else {
        conversation.title = conversation.topic || conversation.users.map(function (u) {
          return u.firstName;
        }).join(', ');
      }

      // Set coordinates
      users.forEach(function (user) {
        if (user.userPresenceState.longitude) {
          user.coord = {lat: user.userPresenceState.latitude, lng: user.userPresenceState.longitude};
        }
      });

      resolve(conversation);
    }, function (err) {
      reject(err);
    });
  });
}

// Start of application
function init() {
  _client = new Circuit.Client();
  _client.logon({email: '<your username>', password: '<your password>'})
  .then(showTitle)
  .then(_client.getConversations)
  .then(cacheConversations)
  .then(showConversations)
  .catch(function (err) {
    console.log(err);
  });
}

init();