"use strict";

// create holding array for storing results; this will allow markers and
// infowindows to be removed upon repeated search requests or opening a new window
var markers = [];
var infoWindowArray = [];

// Sets the map on all markers in the array.
// Will only be used to clear existing markers from previous search.
function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

// Removes the markers from the map, but keeps them in the array.
// Will only be used to clear existing markers from previous search.
function clearMarkers() {
  setMapOnAll(null);
}

// Deletes all markers in the array by removing references to them.
// Will only be used to clear existing markers from previous search;
// called only when displayResultsFromJSON is called.
function deleteMarkers() {
  clearMarkers();
  markers = [];
}

function displayResultsFromJSON(result){
  // This clears out the div in case there were previous search results.
  $('#search-results').empty();

  // Clear any existing markers that may be present from previous search.
  deleteMarkers();
  
  // Fill out #search-results div either with results table or 'no results' text
  // create empty divContents array for holding results
  var divContents = [];
  // perform the following only if 'results' has content:
  if (result[0]) {
    // create header row
    var headerRow = '<h3>Results:</h3><table><thead>' +
                    '<tr>' +
                    '<th>Name</th>' +
                    '<th>Address</th>' +
                    '<th>Distance (mi)</th>' +
                    '<th>Preview img</th>' +
                    '<th>yelp ID</th>' +
                    '</tr></thead><tbody>';
    // add header row to divContents holding array
    divContents.push(headerRow);
    // iterate over items in JSON-formatted results
    for (var i in result) {
      // create a temporary holding string to concatenate html for a single row
      var tempString = '<tr><td><a href="' + result[i][8] + 
                      '">'+ result[i][0] +
                      '</a></td><td>' + result[i][3] +
                      ' ' + result[i][4] +
                      '<br>' + result[i][5] +
                      ', ' + result[i][6] +
                      ' ' + result[i][7] +
                      '</td><td>' + result[i][10] + 
                      '</td><td><img class="preview-img" src="' + result[i][9] + 
                      '"></td><td>' + result[i][11] +
                      '</td></tr>';
      // add this row to the divContents holding array
      divContents.push(tempString);
      
      // Set up markers for each result and add them to map. ALso add them to
      // markers array to be able to remove them later.
      var markerLat = parseFloat(result[i][1]);
      var markerLong = parseFloat(result[i][2]);
      var latLng = {lat: markerLat, lng: markerLong};
      var contentString = result[i][0] + '<br>' + result[i][3] + " " +
                          result[i][4] + '<br>' + result[i][5] + " " +
                          result[i][6];
      var infoWindow = new google.maps.InfoWindow({
          content: contentString
      });
      var marker = new google.maps.Marker({
          position: latLng,
          map: map,
          title: result[i][0]
        });
      // Inside the loop we call bindInfoWindow passing it the marker,
      // map, infoWindow and contentString
      bindInfoWindow(marker, map, infoWindow, contentString);
      // add this respective marker & infowindow to holding array to enable
      // clearing them later
      infoWindowArray.push(infoWindow);
      markers.push(marker);
    }
    // finalize table tag
    divContents.push('</tbody></table>');
    // concatenate all results in divContents into a single string
    divContents = divContents.join('');
    
    // Find and set boundaries of map based on spread of results markers to
    // ensure all are visible on the map.
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
      bounds.extend(markers[i].getPosition());
    }
  // ensure new bounds do not obscure info window for searched address from view
  bounds.extend(userInfoWindow.getPosition());
  // apply bounds to map object
  map.fitBounds(bounds);
  // if not result[0], simply state "no results found" and center map on
  // userInfoWindow
  } else {
    map.setCenter(userInfoWindow.getPosition());
    divContents.push('<h3>No results found.</h3>');
  }
  
  // update the contents on main page of div id="search-results"
  $('#search-results').html(divContents);
}    


// This function is outside the for loop.
// When a marker is clicked it closes any currently open infowindows
// Sets the content for the new marker with the content passed through
// then it open the infoWindow with the new content on the marker that's clicked
function bindInfoWindow(marker, map, infoWindow, contentString) {
      google.maps.event.addListener(marker, 'click', function () {
        for (var i in infoWindowArray) {
          infoWindowArray[i].close();
          }
          infoWindow.setContent(contentString);
          infoWindow.open(map, marker);
      });
  }


function submitCoords(position) {
  // get the lat/long/search range values via HTML5 geolocation
  var latitude = position.coords.latitude;
  var longitude = position.coords.longitude;
  var searchRange = $('#coords-search-range').val();
  // (re)set userInfoWindow in case search-by-coords is a repeat search after a
  // search-by-coords has been performed
  userInfoWindow.setPosition(pos);
  userInfoWindow.setContent('You are here.');
  // set data parameters for sending with the AJAX request
  var params = {'latitude': latitude, 'longitude': longitude, 'searchRange': searchRange };
  // send AJAX get request, passing in data, referring to success handler.
  $.get('/search-coords.json', params, displayResultsFromJSON);
}

// get HTML5 geolocation and pass to submitCoords function
function getLocation(evt) {
  evt.preventDefault();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(submitCoords);
  }
}

// Event listener for search by coordinates button.
$('#coords-search').on('click', getLocation);


// Submit address to server and recenter map on that location.
function submitAddress(evt) {
  evt.preventDefault();
  // get the address & search range values entered into text fields by user
  var street = $('#street').val();
  var city = $('#city').val();
  var state = $('#state').val();
  var searchRange = $('#addr-search-range').val();

  // recenter map on submitted address location
  var address = (street + ", " + city + ", " + state)
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == 'OK') {
        userInfoWindow.setPosition(results[0].geometry.location);
        userInfoWindow.setContent('Searching near this address.');
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });

  // set data parameters for sending with the AJAX request
  var params = {'street': street,
                'city': city,
                'state': state,
                'searchRange': searchRange };
  // send AJAX get request, passing in data, referring to success handler.
  $.get('/search-address.json', params, displayResultsFromJSON);
  }

// Event listener for search by address button.
$('#addr-search').on('click', submitAddress);
