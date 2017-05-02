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
        var currentBeacon = Beacons.findOne({serialNumber: post.beacon.serialNumber});
        if (currentBeacon) {
          // Update beacon position into the collection
          Meteor.call('beacons.update', currentBeacon._id, beacon,
            function(error, result){
              if (error) { console.log("Error updating beacon: ", error);}
              else {
                //console.log("Updating beacon: ", result);
              }
          });
        } else {
          // Add new beacon position into the collection
          Meteor.call('beacons.create', beacon,
            function(error, result){
              if (error) { console.log("Error adding beacon: ", error);}
              else {
                //console.log("Adding new beacon: ", result);
              }
          });
        }
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
  },
  
  'beacons.update'(beaconId, beacon) {
    Beacons.update(beaconId, {$set: beacon});
    console.log("UPDATE beacon:", beaconId);
    return beaconId;
  }
})