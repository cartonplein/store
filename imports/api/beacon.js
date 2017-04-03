import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Beacons = new Mongo.Collection('beacons');

if (Meteor.isServer) {
  Meteor.publish('beacons', function() {
    return Beacons.find({});
  });

  Meteor.publish('beacon', 
    function (post) {
      //console.log('beacon', post);
      const beacon = {
        event: post.event,
        timestamp: post.beacon.location.timestamp,
        name: post.beacon.name,
        serialNumber: post.beacon.serialNumber,
        latitude: post.beacon.location.latitude,
        longitude: post.beacon.location.longitude,
      };
      
      if (post.event) {
        // Add beacon position into the collection
        Meteor.call('beacons.create', beacon,
          function(error, result){
            if (error) { console.log("Error adding beacon: ", error);}
            else {
              console.log("Adding new beacon: ", result);
            }
        });
      }
    }, 
    {
      url: "api/beacon",
      httpMethod: "post"
    }
  );
}

Meteor.methods({
  'beacons.create'(beacon) {
    const beaconId = Beacons.insert(beacon);
    console.log("CREATE beacon:", beaconId);
    return beaconId;
  }
})