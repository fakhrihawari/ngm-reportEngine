/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	// strict schema
	schema: true,

	// attributes
	attributes: {
		username: {
			type: 'string',
			required: true
		},		
		organization_id: {
			type: 'string',
			required: true
		},
		project_id: {
			type: 'string',
			required: true
		},
		beneficiary_name: {
			type: 'string',
			required: true
		},
		beneficiary_category: {
			type: 'string',
			required: true
		},		
		under5male:{
			type: 'integer',
			defaultsTo: 0			
		},
		under5female:{
			type: 'integer',
			defaultsTo: 0
		},
		over5male:{
			type: 'integer',
			defaultsTo: 0
		},
		over5female:{
			type: 'integer',
			defaultsTo: 0
		}

	}

};
