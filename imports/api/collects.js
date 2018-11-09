import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { moment } from 'meteor/momentjs:moment';
 
export const Collects = new Mongo.Collection('collects');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('collects', function() {
    return Collects.find({});
  });
}
 
Meteor.methods({
  'collects.create'(collect) {
    const collectId = Collects.insert(collect);
    console.log("CREATE collect:", collectId);
    return collectId;
  },
  'collects.read'(collectId) {
    console.log("READ collect:", collectId);
    return Collects.findOne(collectId);
  },
  'collects.update'(collectId, collect) {
    console.log("UPDATE collect:", collectId);
    Collects.update(collectId, {$set: collect});
  },
  'collects.delete'(collectId) {
    console.log("DELETE collect:", collectId);
    Collects.remove(collectId);
  },
});