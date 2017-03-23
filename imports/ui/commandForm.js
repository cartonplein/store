import { Template } from 'meteor/templating';
import { check } from 'meteor/check';

import './commandForm.html';

Template.commandForm.onRendered(function() {
});

Template.commandForm.helpers({
    total() {
        return (this.product.quantity * parseFloat(this.product.price));
    }
});

Template.commandForm.events({
    'click .js-command-remove'(event, instance) {
        console.log("Remove a product: ", this.product._id);
        this.onChange(this.product, -1);
    },
    'click .js-command-add'(event, instance) {
        console.log("Add a product: ", this.product._id);
        this.onChange(this.product, 1);
    },
    'click .js-command-cancel'(event, instance) {
        console.log("Cancel a product: ", this.product._id);
        this.onChange(this.product, -this.product.quantity);
    },
    'change .js-command-input'(event, instance) {
        console.log("Change product quantity: ", this.product._id);
        const quantity = parseInt(instance.$('.js-command-input').val());
        if (!isNaN(quantity)) {
            this.onChange(this.product, parseInt(quantity) - this.product.quantity);
        }
    }
});