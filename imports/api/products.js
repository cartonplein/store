import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
 
export const Products = new Mongo.Collection('products');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('products', function() {
    return Products.find({});
  });
} 
 
Meteor.methods({
  'products.create'(product) {
    const productId = Products.insert(product);
    console.log("CREATE product:", productId);
    return productId;
  },
  'products.read'(productId) {
    console.log("READ product:", productId);
    return Products.findOne(productId);
  },
  'products.update'(productId, product) {
    console.log("UPDATE product:", productId);
    Products.update(productId, {$set: product});
  },
  'products.delete'(productId) {
    console.log("DELETE product:", productId);
    Products.remove(productId);
  },
});