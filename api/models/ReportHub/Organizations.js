/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	// connection
  connection: 'ngmReportHubServer',
  schema: true,

  // attributes
  attributes: {

    admin0pcode: {
      type: 'string',
      required: true
    },
    organization_name: {
      type: 'string',
      required: true
    },
    organization_tag: {
      type: 'string',
      required: true
    },
    organization: {
      type: 'string',
      required: true
    },
    organization_type: {
      type: 'string',
      required: true
    },
    // list country that deactivate this org
    admin0pcode_deactivate:{
      type:'string',
    }

  },

  updateOrCreate: function( criteria, values ){
    var self = this; // reference for use by callbacks
    // if exists
    if (values.id) {
      return self.update(criteria, values);
    } else {
      return self.create(values);
    }
  }

}
