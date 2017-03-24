import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Products } from '../api/products.js';
import filestack from 'filestack-js';
 
import './productAdmin.html';
import './menuAdmin.html';

/*
  productAdmin
  productAdmin
  productAdmin
*/

Template.productAdmin.onCreated(function() {
  this.state = new ReactiveDict();
  this.state.setDefault({
    selectedProduct: null,
  });
  Meteor.subscribe('products');
});

Template.productAdmin.helpers({
  products() {
    return Products.find({}, { sort: { index: 1 } });
  },
  
  editedProduct() {
    const instance = Template.instance();
    return instance.state.get("selectedProduct");
  },

  selectProduct(product) {
    const instance = Template.instance();
    return {
      product,
      onSelect(product) {
        instance.state.set('selectedProduct', product);
        console.log("Editing product: ", product._id)
      },
      onRemovable() {
        var editedProduct = product;
        editedProduct.available = !editedProduct.available;
        instance.state.set('selectedProduct', editedProduct);
        //console.log("Toggle removable: ", editedProduct.available)
      },
      onClose() {
        instance.state.set('selectedProduct', null);
        instance.state.set('removable', null);
        console.log("Close editing: ", product._id)
      }
    };
  }
});

Template.productAdmin.events({
  'click .js-product-create'(event, instance) {

    // Add product into the collection
    Meteor.call('products.create', {},
      function(error, result){
          if (error) { console.log("Error adding product: ", error);}
          else {
            console.log("Adding new product: ", result);
            // Editing this new product
            instance.state.set('selectedProduct', {_id: result});
          }
    });
  },
  'click .js-product-close'(event, instance) {
    // Close product
    instance.state.set('selectedProduct', null);
  },
});

/*
  ProductList
  ProductList
  ProductList
*/

Template.productList.events({
  'click .item'() {
    console.log("Selecting product: ", this.product._id);
    this.onSelect(this.product);
  }
});


/*
  ProductEdit
  ProductEdit
  ProductEdit
*/

Template.productEdit.onCreated(function() {
  this.state = new ReactiveDict();
  this.state.setDefault({
    image: null,
  });
});

Template.productEdit.onRendered(function() {
  // Enable toggle action
  $('.ui.checkbox').checkbox();
});

Template.productEdit.helpers({
  image() {
    const instance = Template.instance();
    if (instance.state.get("image")) 
      { return instance.state.get("image") } 
    else {
      return this.product.image;
    }
  }
});

Template.productEdit.events({
  'click .js-product-image'(event, instance) {
    var client = filestack.init('AQxsBa1C5Soey0Npzcp7Sz');
    client.pick({
    }).then(function(result) {
        //console.log(JSON.stringify(result.filesUploaded));
        console.log('Upload file:', result.filesUploaded[0].url);
        instance.state.set('image', result.filesUploaded[0].url);
    });
  },
  
  'click .js-product-update'(event, instance) {
    const form = instance.$('.js-product-edit');
    console.log(instance.$('input[name=name]').val());
    const product = {
      index : instance.$('input[name=index]').val(),
      image : instance.$('input[name=image]').val(),
      reference : instance.$('input[name=reference]').val(),
      name : instance.$('input[name=name]').val(),
      price : parseFloat(instance.$('input[name=price]').val()),
      description : instance.$('textarea[name=description]').val(),
      dimensions : instance.$('input[name=dimensions]').val(),
      available : instance.$('input[name=available]').is(':checked'),
      color : instance.$('input[name=color]').val(),
    }

    // Save product into the collection
    Meteor.call('products.update', this.product._id, product);
    
    // Leaving editing product
    this.onClose();
  },
  
  'click .js-product-available'(event, instance) {
    // Toggle availability
    this.onRemovable();
  },
  
  'click .js-product-cancel'() {
    // Cancel editing product
    this.onClose();
  },
  
  'click .js-product-delete'() {
    // Delete product into the collection
    console.log("Deleting product: ", this.product._id);
    Meteor.call('products.delete', this.product._id);
    
    // Leaving editing product
    this.onClose();
  },
  
  'change .js-product-image'(event, instance) {
    // Leaving editing product
    instance.$('.preview').attr('src', './assets/images/' + event.target.value);
  },
});