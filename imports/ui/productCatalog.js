import { Template } from 'meteor/templating';
import { Markdown } from 'meteor/markdown';

import './productCatalog.html';
 
Template.productCatalog.events({
  'click .card'() {
    //console.log("Selecting product: ", this.product._id);
    this.onChange(this.product, 1);
  }
});