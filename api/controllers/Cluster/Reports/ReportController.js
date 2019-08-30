/**
 * ReportController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

// libs
var Promise = require('bluebird');
var util = require('util');
var async = require('async');
var moment = require( 'moment' );
var _under = require('underscore');

var ReportController = {

  // TASKS

  // parse results from sails
  set_result: function( result ) {
    if( util.isArray( result ) ) {
      // update ( array )
      return result[0];
    } else { 
      // create ( object )
      return result;
    }
  },

	// request as csv
	getReportCsv: function( req, res ) {

		// request input
		if ( !req.param( 'report_type' ) || !req.param( 'report_id' ) ) {
			return res.json( 401, { err: 'report_type & report_id required!' });
		}

		var json2csv = require( 'json2csv' ),
			moment = require( 'moment' );

		// activity
		if ( req.param( 'report_type' ) === 'activity' ) {

			var fields = [ 
						'project_id',
						'report_id',
						'cluster',
						'organization',
						'username',
						'email',
						'project_hrp_code',
						'project_title',
						'project_code',
						'admin0name',
						'admin1pcode',
						'admin1name',
						'admin2pcode',
						'admin2name',
						'admin3pcode',
						'admin3name',
						'site_implementation_name',
						'site_type_name',
						'site_name',
						'report_month',
						'report_year',
						'activity_type_name',
						'activity_description_name',
						'indicator_name',
						'category_type_name',
						'beneficiary_type_name',
						'beneficiary_category_name',
						'strategic_objective_name',
						'strategic_objective_description',
						'sector_objective_name',
						'sector_objective_description',
						'delivery_type_name',
						'units',
						'unit_type_name',
						'transfer_type_value',
						'mpc_delivery_type_id',
						'households',
						'families',
						'boys',
						'girls',
						'men',
						'women',
						'elderly_men',
						'elderly_women',
						'total',
						'createdAt',
						'updatedAt'
					],
					fieldNames = [
						'Project ID',
						'Report ID',
						'Cluster',
						'Organization',
						'Username',
						'Email',
						'HRP Code',
						'Project Title',
						'Project Code',
						'Country',
						'Admin1 Pcode',
						'Admin1 Name',
						'Admin2 Pcode',
						'Admin2 Name',
						'Admin3 Pcode',
						'Admin3 Name',
						'Site Implementation',
						'Site Type',
						'Location Name',
						'Report Month',
						'Report Year',
						'Activity Type',
						'Activity Description',
						'Indicator',
						'Category Type',
						'Beneficiary Type',
						'Beneficiary Category',
						'Strategic Objective',
						'Strategic Objective Description',
						'Sector Objective',
						'Sector Objective Description',
						'Population',
						'Amount',
						'Unit Type',
						'Cash Transfers',
						'Cash Delivery Type',
						'Households',
						'Families',
						'Boys',
						'Girls',
						'Men',
						'Women',
						'Elderly Men',
						'Elderly Women',
						'Total',
						'Created',
						'Last Update'
					];

			// beneficiaries
			Beneficiaries
				.find( )
				.where( { report_id: req.param( 'report_id' ) } )
				.exec(function( err, response ){

					// error
					if ( err ) return res.negotiate( err );

					// format  / sum
					response.forEach(function( d, i ){
						response[i].report_month = moment( response[i].reporting_period ).format( 'MMMM' );
						response[i].total = response[i].boys +
																response[i].girls +
																response[i].men +
																response[i].women +
																response[i].elderly_men +
																response[i].elderly_women;
					});

					// return csv
					json2csv({ data: response, fields: fields, fieldNames: fieldNames }, function( err, csv ) {

						// error
						if ( err ) return res.negotiate( err );

						// success
						return res.json( 200, { data: csv } );

					});

				});

		} else {

			var fields = [
						'organization_id',
						'report_id',
						'organization',
						'username',
						'email',
						'admin0name',
						'admin1pcode',
						'admin1name',
						'admin2pcode',
						'admin2name',
						'admin3pcode',
						'admin3name',
						'site_name',
						'report_month',
						'report_year',
						'cluster',
						'stock_item_name',
						'stock_status_name',
						'number_in_stock',
						'number_in_pipeline',
						'unit_type_name',
						'beneficiaries_covered',
						'createdAt',
						'updatedAt'
					],
					fieldNames = [
						'Organization ID',
						'Report ID',
						'Organization',
						'Username',
						'Email',
						'Country',
						'Admin1 Pcode',
						'Admin1 Name',
						'Admin2 Pcode',
						'Admin2 Name',
						'Admin3 Pcode',
						'Admin3 Name',
						'Warehouse Name',
						'Stock Month',
						'Stock Year',
						'Cluster',
						'Stock Type',
						'Status',
						'No. in Stock',
						'No. in Pipeline',
						'Units',
						'Beneficiary Coverage',
						'Created',
						'Last Update'
					];

			// stocks
			Stock
				.find( )
				.where( { report_id: req.param( 'report_id' ), location_id: { '!' : null } } )
				.exec(function( err, response ){

					// error
					if ( err ) return res.negotiate( err );

					// format month
					response.forEach(function( d, i ){
						response[i].report_month = moment( response[i].reporting_period ).format( 'MMMM' );
					});

					// return csv
					json2csv({ data: response, fields: fields, fieldNames: fieldNames }, function( err, csv ) {

						// error
						if ( err ) return res.negotiate( err );

						// success
						return res.json( 200, { data: csv } );

					});

				});

		}

	},

	// get all reports by project id
	getReportsList: function( req, res ) {

		// request input
		if ( !req.param( 'filter' ) ) {
			return res.json( 401, { err: 'filter required!' });
		}

		// promise
    Promise.all([
      Report.find( req.param( 'filter' ) ).sort( 'report_month ASC' ),
      Beneficiaries.find( req.param( 'filter' ) )
    ])
    .catch( function( err ) {
      return res.negotiate( err );
    })
    .then( function( result ) {

    	// gather results
    	var reports = result[ 0 ];
    	var beneficiaries = result[ 1 ];
    	
	    // async loop reports
	    async.each( reports, function ( report, next ) {

				// add status empty
				report.icon = 'adjust'
				report.status = '#80cbc4';
				report.status_title = 'Empty Submission';

				// if report is 'todo' and before due date!
				if ( report.report_status === 'todo' && moment().isSameOrBefore( moment( report.reporting_due_date ) ) ) {

					// add status todo but ok
					report.icon = 'watch_later';
					report.status = '#4db6ac';
					report.status_title = 'ToDo';

				}
				
				// if report is 'todo' and past due date!
				if ( report.report_status === 'todo' && moment().isAfter( moment( report.reporting_due_date ) ) ) {

					// set to red (overdue!)
					report.icon = 'error';
					report.status = '#e57373'
					report.status_title = 'Due';

				}	

	    	// async loop beneficiaries
	    	async.each( beneficiaries, function ( beneficiary, b_next ) {
    			
    			// beneficiaries exist for this report
    			if ( report.id === beneficiary.report_id ) {

						// if no benficiaries and submitted
						if ( report.report_status === 'complete' ) {
							// add status
							report.icon = 'check_circle';
							report.status = '#4db6ac';
							report.status_title = 'Complete';
							if (report.report_validation && report.report_validation ==='valid' ) {
								report.icon = 'done_all';
								report.status = '#4db6ac';
							}
							if (report.report_validation && report.report_validation === 'invalid') {
								report.icon = 'not_interested';
								report.status = '#f44336';
							}
							if (report.report_validation && report.report_validation === 'checked') {
								report.icon = 'watch_later';
								report.status = '#4db6ac';
							}
						}
						
						// if report is 'todo' and has records ( is saved )
						if ( report.report_status === 'todo' ) {
							// if beneficiaries ( report has been updated )
							if ( beneficiary ) {
								report.icon = 'watch_later';
								report.status = '#fff176';
								report.status_title = 'Pending';
							}
						}

    			}
    			b_next();
	    	}, function ( err ) {
		      if ( err ) return err;
					next();
		    });
	    }, function ( err ) {
	      if ( err ) return err;
				// return
				return res.json( 200, reports );
	    });

    });

	},

	// update to complete
	getReportDetailsById: function( req, res ) {
		
		// request input guards
		if ( !req.param( 'id' ) ) {
			return res.json(401, { err: 'id required!' });
		}

		Report
			.findOne( { id: req.param( 'id' ) } )
			.exec(function( err, report ){

				// return error
				if ( err ) return res.json({ err: true, error: err });

				// return reports
				return res.json( 200, report );

			});
	
	},	

	// get all Reports by project id
	getReport: function( req, res ) {

		// request input
		if ( !req.param( 'report_id' ) && ( !req.param( 'project_id' ) || ( !req.param( 'report_month' ) && !( req.param( 'report_month' ) === 0 ) ) || !req.param( 'report_year' ) ) ) {
			return res.json( 401, { err: 'report_id or project_id, report_month, report_year required!' });
		}

		var find;
		var findReport;
		var findLocation;

		// getReportById
		if ( req.param( 'report_id' ) ) {
			// set
			find = { id: req.param( 'report_id' ) }
			findReport = { report_id: req.param( 'report_id' ) }
			findLocation = { report_id: req.param( 'report_id' ) }
		}

		// getReportByParams
		if ( req.param( 'project_id' ) ) {
			// set
			find = { project_id: req.param( 'project_id' ), report_month: req.param( 'report_month' ), report_year: req.param( 'report_year' ) }
			findReport = find;
			findLocation = find;
		}

		// if location_group_id
		if ( req.param( 'location_group_id') ) {
			findLocation = _under.extend( {}, findLocation, { location_group_id: req.param( 'location_group_id') } );
		}

		// promise
    Promise.all([
      Report.findOne( find ),
      Location.find( findLocation ),
      Beneficiaries.find( findReport ).populateAll(),
      Trainings.find( findReport ),
      TrainingParticipants.find( findReport )
    ])
    .catch( function( err ) {
      return res.negotiate( err );
    })
    .then( function( result ) {

    	// gather results
    	var report = result[ 0 ];
    	var locations = result[ 1 ];
    	var beneficiaries = result[ 2 ];
    	var trainings = result[ 3 ];
    	var training_participants = result[ 4 ];

    	// placeholder
    	report.locations = [];

	    // async loop target_beneficiaries
	    async.each( locations, function ( location, next ) {

	    	// counter
	    	var locations_counter = 0;
	    	var locations_features = 2;

    		// set holders
    		location.beneficiaries = [];
    		location.trainings = [];

	    	// set next in locations array
	    	var set_next = function ( location ){
	    		locations_counter++;
					if( locations_counter === locations_features ){
						report.locations.push( location );
						next();
					}
	    	}

    		// beneficiaries
    		if ( beneficiaries.length ){
    			async.each( beneficiaries, function ( beneficiary, b_next ) {
	    			if ( location.id === beneficiary.location_id ) {
	    				// push
	    				location.beneficiaries.push( beneficiary );
	    			}
    				// next
    				b_next();
	    		}, function ( err ) {
			    	// error
			      if ( err ) return err;
			      // increment counter
			      set_next( location );
			    });
	    	} else {
		      // increment counter
		      set_next( location );
    		}

    		// trainings
    		if ( trainings.length ){
	    		async.each( trainings, function ( training, t_next ) {
	    			if ( location.id === training.location_id ) {
	    				// set holders
	    				training.training_participants = [];
	    				// participants
	    				if ( training_participants.length ){
								async.each( training_participants, function ( training_participant, tp_next ) { 						
	    						if ( training.id === training_participant.training_id ){
	    							training.training_participants.push( training_participant );
	    						}
	    						// next
	    						tp_next();
	    					}, function ( err ) {
						    	// error
						      if ( err ) return err;
			    				// push
			    				location.trainings.push( training );
									// next
    							t_next();
								});
	    				} else {
								// next
  							t_next();
	    				}
	    			} else {
	    				// next
	    				t_next();
	    			}
	    		}, function ( err ) {
			    	// error
			      if ( err ) return err;
			      // increment counter
			      set_next( location );
					});
    		} else {
		      // increment counter
		      set_next( location );
    		}

	    }, function ( err ) {
      	if ( err ) return err;
				return res.json( 200, report );
	    });

    });

	},

	// set report details by report id
	setReportById: function( req, res ) {

		// request input guards
		if ( !req.param( 'report' ) ) {
			return res.json(401, { err: 'report required!' });
		}

		// get report
		var report = req.param( 'report' );
		var locations = req.param( 'report' ).locations;

    // find
    var findProject = {
      project_id: report.project_id
    }
    var findReport = {
      report_id: report.id
    }
    var findLocation;
    var findTargetLocation;
    var findTraining;

		// get report by organization_id
		Report
			.update( { id: report.id }, report )
			.exec( function( err, report ){

				// return error
				if (err) return res.negotiate( err );

				// update / create locations
				report = report[0];
				report.locations = [];

				// prepare for cloning
	      var report_copy = JSON.parse( JSON.stringify( report ) );
	      delete report_copy.id;
	      delete report_copy.createdAt;
	      delete report_copy.updatedAt;

	      // async loop report locations
	      async.each( locations, function ( location, next ) {

	      	// set counter
		    	var locations_counter = 0;
		    	var locations_features = 2;

	    		// set beneficiaries / trainings
					var beneficiaries = location.beneficiaries;
					var trainings = location.trainings;

		    	// set next in locations array
		    	var set_next = function ( location ){
		    		locations_counter++;
						if( locations_counter === locations_features ){
							report.locations.push( location );
							next();
						}
		    	}

					// update or create
	        Location.updateOrCreate( _under.extend( {}, findProject, findReport ), { id: location.id }, location ).exec(function( err, result ){
	        	
	        	// set result, update / create beneficiaries, trainings
	        	location = ReportController.set_result( result );
	        	findLocation = { location_id: location.id }
	        	findTargetLocation = { target_location_reference_id: location.target_location_reference_id }
		    		location.beneficiaries = [];
		    		location.trainings = [];

						// prepare for cloning
			      var location_copy = JSON.parse( JSON.stringify( location ) );
			      delete location_copy.id;

			      // async loop report beneficiaries
			      async.each( beneficiaries, function ( beneficiary, b_next ) {
			      	// clone
			      	var b = _under.extend( {}, report_copy, location_copy, beneficiary );
							// update or create
			        Beneficiaries.updateOrCreate( _under.extend( {}, findProject, findReport, findLocation, findTargetLocation ), { id: b.id }, b ).exec(function( err, result ){
			        	location.beneficiaries.push( ReportController.set_result( result ) );
			        	b_next();
			        });
			      }, function ( err ) {
			        if ( err ) return err;
				      // increment counter
				      set_next( location );
			      });

			     
			      // async loop report beneficiaries
			      async.each( trainings, function ( training, t_next ) {

			      	// clone
			      	var t = _under.extend( {}, report_copy, location_copy, training );

			      	// set beneficiaries / trainings
							var training_participants = t.training_participants;

							// update or create
			        Trainings.updateOrCreate( _under.extend( {}, findProject, findReport, findLocation, findTargetLocation ), { id: t.id }, t ).exec(function( err, result ){
			        	
			        	// set result, update / create beneficiaries, trainings
			        	t = ReportController.set_result( result );
			        	findTraining = { training_id: t.id }
			        	t.training_participants = [];

								// prepare for cloning
					      var triaining_copy = JSON.parse( JSON.stringify( t ) );
					      delete triaining_copy.id;
			        	
			        	// if training_participants
			        	if ( training_participants && training_participants.length ) {
				      		// async loop report beneficiaries
				      		async.each( training_participants, function ( training_participant, tp_next ) {
						      	// clone
						      	var t_participant = _under.extend( {}, report_copy, location_copy, triaining_copy, training_participant );
										// update or create
						        TrainingParticipants.updateOrCreate( _under.extend( {}, findProject, findReport, findLocation, findTargetLocation, findTraining ), { id: t_participant.id }, t_participant ).exec(function( err, result ){
						        	t.training_participants.push( ReportController.set_result( result ) );
						        	tp_next();
						        });
					        }, function ( err ) {
						        if ( err ) return err;
						        // push
						        location.trainings.push( t );
							      // increment counter
							      t_next();
						      });
					      } else {
						      // increment counter
						      t_next();
					      }

					    });
			      }, function ( err ) {
			        if ( err ) return err;
				      // increment counter
				      set_next( location );
			      });


	        });
	      }, function ( err ) {
	      	if ( err ) return err;
					return res.json( 200, report );
	      });     

    });

	},

	// update to complete
	updateReportStatus: function( req, res ) {
		
		// request input guards
		if ( !req.param( 'report_id' ) && !req.param( 'report_status' ) ) {
			return res.json(401, { err: 'report_id, report_status required!' });
		}

		Report
			.update( { id: req.param( 'report_id' ) }, req.param( 'update' ) )
			.exec(function( err, report ){

				// return error
				if ( err ) return res.json({ err: true, error: err });

				// return reports
				return res.json( 200, report );

			});
	
	},

	// report validation
	updateReportValidation:function(req,res){

		if (!req.param('report_id') && !req.param('update')){
			return res.json(401, { err: 'report, validation required!' });
		}

		Report
			.update({ id: req.param('report_id') },req.param('update'))
			.exec(function (err,report) {
				// return error
				if (err) return res.json({ err: true, error: err });
				// return success
				return res.json(200, report);
			})

	},

	// remove
	removeBeneficiary: function( req, res ){

		// request input
		if ( !req.param( 'id' ) ) {
			return res.json(401, { err: 'id required!' });
		}

		// get report
		var $id = req.param( 'id' );

		// location_reference_id 're-links' association after any updates
			 // when updating target locations in project details (this affects monthly report)
		Beneficiaries
			// .update({ id: $id }, { location_id: null })
			.destroy({ id: $id })
			.exec(function( err, b ){

				// return error
				if ( err ) return res.json({ err: true, error: err });

				// return reports
				return res.json( 200, { msg: 'success' } );

			});

	},

	// remove
	removeTrainingById: function( req, res ){

		// request input
		if ( !req.param( 'id' ) ) {
			return res.json(401, { err: 'id required!' });
		}

		// get report
		var $id = req.param( 'id' );

		// promise
    Promise.all([
      Trainings.destroy({ id: $id }),
      TrainingParticipants.destroy({ training_id: $id })
    ])
    .catch( function( err ) {
      return res.negotiate( err );
    })
    .then( function( result ) {
    	return res.json( 200, { msg: 'success' } );
    });

	},

	// remove
	removeTraineeById: function( req, res ){

		// request input
		if ( !req.param( 'id' ) ) {
			return res.json(401, { err: 'id required!' });
		}

		// get report
		var $id = req.param( 'id' );

		// destroy
		TrainingParticipants
			.destroy({ id: $id })
			.exec(function( err, b ){

				// return error
				if ( err ) return res.json({ err: true, error: err });

				// return reports
				return res.json( 200, { msg: 'success' } );

			});

	},

	// dummy record
	getDummyReport:function(req,res){
		var id=req.param('report_id')
		var report = [
		{
			id: 't1',
			// support_partner: [{
			// 	id: '1s2w3erhshsh',
			// 	area_id: "information_management_coordination",
			// 	area_name: "Information Management and Coordination Support",
			// 	partner_category_id: "humanitarian_partner",
			// 	partner_category_name: "Humanitarian Partner",
			// 	collab_id: "02",
			// 	collab_name: "CC",
			// 	collabArray: [{ id: '01', name: 'YY' }, { id: '02', name: 'CC' }],
			// 	product_detail_id:'a3',
			// 	product_detail_name:'A3',
			// 	narative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
			// 	number_products: 101,
			// 	partner: " ORGA",
			// 	partner_id: "02",
			// 	product_id: "static_infographic",
			// 	product_name: "Static Infographic",
			// 	file: [{
			// 		admin0pcode: "AF",
			// 		adminRpcode: "EMRO",
			// 		cluster_id: "health",
			// 		createdAt: "2019-06-10T02:41:58.702Z",
			// 		fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
			// 		fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
			// 		filename: "leave-balance.2PNG.PNG",
			// 		filename_extension: ".PNG",
			// 		fileowner: "fakhrihawari",
			// 		id: "5cfdc376ee6ec8d107a11755",
			// 		mime_type: "image/png",
			// 		organization_tag: "immap",
			// 		project_end_date: "2018-12-31T00:00:00.000Z",
			// 		project_id: "pln123lstrk456coba78",
			// 		project_start_date: "2018-01-01T00:00:00.000Z",
			// 		report_id: "fkhrhwrrfn123test021",
			// 		reporting_period: "2018-12-01T00:00:00.000Z",
			// 		updatedAt: "2019-06-10T02:41:58.702Z"
			// 	}, {
			// 			admin0pcode: "AF",
			// 			adminRpcode: "EMRO",
			// 			cluster_id: "health",
			// 			createdAt: "2019-06-10T02:41:58.702Z",
			// 			fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
			// 			fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
			// 			filename: "leave-balance.2PNG.PNG",
			// 			filename_extension: ".PNG",
			// 			fileowner: "fakhrihawari",
			// 			id: "5cfdc376ee6ec8d107a11755",
			// 			mime_type: "image/png",
			// 			organization_tag: "immap",
			// 			project_end_date: "2018-12-31T00:00:00.000Z",
			// 			project_id: "pln123lstrk456coba78",
			// 			project_start_date: "2018-01-01T00:00:00.000Z",
			// 			report_id: "fkhrhwrrfn123test021",
			// 			reporting_period: "2018-12-01T00:00:00.000Z",
			// 			updatedAt: "2019-06-10T02:41:58.702Z"
			// 		}, {
			// 			admin0pcode: "AF",
			// 			adminRpcode: "EMRO",
			// 			cluster_id: "health",
			// 			createdAt: "2019-06-10T02:41:58.702Z",
			// 			fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
			// 			fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
			// 			filename: "leave-balance.2PNG.PNG",
			// 			filename_extension: ".PNG",
			// 			fileowner: "fakhrihawari",
			// 			id: "5cfdc376ee6ec8d107a11755",
			// 			mime_type: "image/png",
			// 			organization_tag: "immap",
			// 			project_end_date: "2018-12-31T00:00:00.000Z",
			// 			project_id: "pln123lstrk456coba78",
			// 			project_start_date: "2018-01-01T00:00:00.000Z",
			// 			report_id: "fkhrhwrrfn123test021",
			// 			reporting_period: "2018-12-01T00:00:00.000Z",
			// 			updatedAt: "2019-06-10T02:41:58.702Z"
			// 		}, {
			// 			admin0pcode: "AF",
			// 			adminRpcode: "EMRO",
			// 			cluster_id: "health",
			// 			createdAt: "2019-06-10T02:41:58.702Z",
			// 			fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
			// 			fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
			// 			filename: "leave-balance.2PNG.PNG",
			// 			filename_extension: ".PNG",
			// 			fileowner: "fakhrihawari",
			// 			id: "5cfdc376ee6ec8d107a11755",
			// 			mime_type: "image/png",
			// 			organization_tag: "immap",
			// 			project_end_date: "2018-12-31T00:00:00.000Z",
			// 			project_id: "pln123lstrk456coba78",
			// 			project_start_date: "2018-01-01T00:00:00.000Z",
			// 			report_id: "fkhrhwrrfn123test021",
			// 			reporting_period: "2018-12-01T00:00:00.000Z",
			// 			updatedAt: "2019-06-10T02:41:58.702Z"
			// 		}, {
			// 			admin0pcode: "AF",
			// 			adminRpcode: "EMRO",
			// 			cluster_id: "health",
			// 			createdAt: "2019-06-10T02:41:58.702Z",
			// 			fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
			// 			fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
			// 			filename: "leave-balance.2PNG.PNG",
			// 			filename_extension: ".PNG",
			// 			fileowner: "fakhrihawari",
			// 			id: "5cfdc376ee6ec8d107a11755",
			// 			mime_type: "image/png",
			// 			organization_tag: "immap",
			// 			project_end_date: "2018-12-31T00:00:00.000Z",
			// 			project_id: "pln123lstrk456coba78",
			// 			project_start_date: "2018-01-01T00:00:00.000Z",
			// 			report_id: "fkhrhwrrfn123test021",
			// 			reporting_period: "2018-12-01T00:00:00.000Z",
			// 			updatedAt: "2019-06-10T02:41:58.702Z"
			// 		}, {
			// 			admin0pcode: "AF",
			// 			adminRpcode: "EMRO",
			// 			cluster_id: "health",
			// 			createdAt: "2019-06-10T02:41:58.702Z",
			// 			fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
			// 			fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
			// 			filename: "leave-balance.2PNG.PNG",
			// 			filename_extension: ".PNG",
			// 			fileowner: "fakhrihawari",
			// 			id: "5cfdc376ee6ec8d107a11755",
			// 			mime_type: "image/png",
			// 			organization_tag: "immap",
			// 			project_end_date: "2018-12-31T00:00:00.000Z",
			// 			project_id: "pln123lstrk456coba78",
			// 			project_start_date: "2018-01-01T00:00:00.000Z",
			// 			report_id: "fkhrhwrrfn123test021",
			// 			reporting_period: "2018-12-01T00:00:00.000Z",
			// 			updatedAt: "2019-06-10T02:41:58.702Z"
			// 		}, {
			// 			admin0pcode: "AF",
			// 			adminRpcode: "EMRO",
			// 			cluster_id: "health",
			// 			createdAt: "2019-06-10T02:41:58.702Z",
			// 			fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
			// 			fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
			// 			filename: "leave-balance.2PNG.PNG",
			// 			filename_extension: ".PNG",
			// 			fileowner: "fakhrihawari",
			// 			id: "5cfdc376ee6ec8d107a11755",
			// 			mime_type: "image/png",
			// 			organization_tag: "immap",
			// 			project_end_date: "2018-12-31T00:00:00.000Z",
			// 			project_id: "pln123lstrk456coba78",
			// 			project_start_date: "2018-01-01T00:00:00.000Z",
			// 			report_id: "fkhrhwrrfn123test021",
			// 			reporting_period: "2018-12-01T00:00:00.000Z",
			// 			updatedAt: "2019-06-10T02:41:58.702Z"
			// 		}, {
			// 			admin0pcode: "AF",
			// 			adminRpcode: "EMRO",
			// 			cluster_id: "health",
			// 			createdAt: "2019-06-10T02:41:58.702Z",
			// 			fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
			// 			fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
			// 			filename: "leave-balance.2PNG.PNG",
			// 			filename_extension: ".PNG",
			// 			fileowner: "fakhrihawari",
			// 			id: "5cfdc376ee6ec8d107a11755",
			// 			mime_type: "image/png",
			// 			organization_tag: "immap",
			// 			project_end_date: "2018-12-31T00:00:00.000Z",
			// 			project_id: "pln123lstrk456coba78",
			// 			project_start_date: "2018-01-01T00:00:00.000Z",
			// 			report_id: "fkhrhwrrfn123test021",
			// 			reporting_period: "2018-12-01T00:00:00.000Z",
			// 			updatedAt: "2019-06-10T02:41:58.702Z"
			// 		}, {
			// 			admin0pcode: "AF",
			// 			adminRpcode: "EMRO",
			// 			cluster_id: "health",
			// 			createdAt: "2019-06-10T02:41:58.702Z",
			// 			fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
			// 			fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
			// 			filename: "leave-balance.2PNG.PNG",
			// 			filename_extension: ".PNG",
			// 			fileowner: "fakhrihawari",
			// 			id: "5cfdc376ee6ec8d107a11755",
			// 			mime_type: "image/png",
			// 			organization_tag: "immap",
			// 			project_end_date: "2018-12-31T00:00:00.000Z",
			// 			project_id: "pln123lstrk456coba78",
			// 			project_start_date: "2018-01-01T00:00:00.000Z",
			// 			report_id: "fkhrhwrrfn123test021",
			// 			reporting_period: "2018-12-01T00:00:00.000Z",
			// 			updatedAt: "2019-06-10T02:41:58.702Z"
			// 		}, {
			// 			admin0pcode: "AF",
			// 			adminRpcode: "EMRO",
			// 			cluster_id: "health",
			// 			createdAt: "2019-06-10T02:41:58.702Z",
			// 			fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
			// 			fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
			// 			filename: "leave-balance.2PNG.PNG",
			// 			filename_extension: ".PNG",
			// 			fileowner: "fakhrihawari",
			// 			id: "5cfdc376ee6ec8d107a11755",
			// 			mime_type: "image/png",
			// 			organization_tag: "immap",
			// 			project_end_date: "2018-12-31T00:00:00.000Z",
			// 			project_id: "pln123lstrk456coba78",
			// 			project_start_date: "2018-01-01T00:00:00.000Z",
			// 			report_id: "fkhrhwrrfn123test021",
			// 			reporting_period: "2018-12-01T00:00:00.000Z",
			// 			updatedAt: "2019-06-10T02:41:58.702Z"
			// 		}, {
			// 			admin0pcode: "AF",
			// 			adminRpcode: "EMRO",
			// 			cluster_id: "health",
			// 			createdAt: "2019-06-10T02:41:58.702Z",
			// 			fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
			// 			fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
			// 			filename: "leave-balance.2PNG.PNG",
			// 			filename_extension: ".PNG",
			// 			fileowner: "fakhrihawari",
			// 			id: "5cfdc376ee6ec8d107a11755",
			// 			mime_type: "image/png",
			// 			organization_tag: "immap",
			// 			project_end_date: "2018-12-31T00:00:00.000Z",
			// 			project_id: "pln123lstrk456coba78",
			// 			project_start_date: "2018-01-01T00:00:00.000Z",
			// 			report_id: "fkhrhwrrfn123test021",
			// 			reporting_period: "2018-12-01T00:00:00.000Z",
			// 			updatedAt: "2019-06-10T02:41:58.702Z"
			// 		}]
			// }],
			// planed_activity: [{
			// 	id: 'qw@#$1234mn',
			// 	area_id: "information_management_coordination",
			// 	area_name: "Information Management and Coordination Support",
			// 	partner_category_id: "humanitarian_partner",
			// 	partner_category_name: "Humanitarian Partner",
			// 	narative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
			// 	number_products: 1,
			// 	partner: " ORGA",
			// 	partner_id: "02",
			// 	product_id: "static_infographic",
			// 	product_name: "Static Infographic",
			// }],
			products: [{
				id: '1s2w3erhshsh',
				area_id: "information_management_coordination",
				area_name: "Information Management and Coordination Support",
				partner_category_id: "humanitarian_partner",
				partner_category_name: "Humanitarian Partner",
				collab_id: "02",
				collab_name: "CC",
				collabArray: [{ id: '01', name: 'YY' }, { id: '02', name: 'CC' }],
				collaborators: [{ id: '01', name: 'YY' }, { id: '02', name: 'CC' }],
				product_detail_id:'a3',
				product_detail_name:'A3',
				narrative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
				number_products: 101,
				partner: " ORGA",
				partner_id: "02",
				product_id: "static_infographic",
				product_name: "Static Infographic",
				files: [{
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}]
			}],
			planned_products: [{
				id: 'qw@#$1234mn',
				area_id: "information_management_coordination",
				area_name: "Information Management and Coordination Support",
				partner_category_id: "humanitarian_partner",
				partner_category_name: "Humanitarian Partner",
				narrative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
				number_products: 1,
				partner: " ORGA",
				partner_id: "02",
				product_id: "static_infographic",
				product_name: "Static Infographic",
			}],
			rating: 5,
			notes: 'SWAG',
			month_date: '2019-06-21',
			report_date: '2019-06-21',
			month: '6',
			report_month: '6',
			icon: 'alarm_on',
			report_status: 'todo',
			report_submit: false,
			upload_id:'fkhrhwrrfn123test021'
		},
			{
				id: 'c1',
				// support_partner: [{
				// 	id: '1s2w3erhshsh',
				// 	area_id: "information_management_coordination",
				// 	area_name: "Information Management and Coordination Support",
				// 	partner_category_id: "humanitarian_partner",
				// 	partner_category_name: "Humanitarian Partner",
				// 	collab_id: "02",
				// 	collab_name: "CC",
				// 	narative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
				// 	number_products: 5,
				// 	partner: " ORGA",
				// 	partner_id: "02",
				// 	product_id: "static_infographic",
				// 	product_name: "Static Infographic",
				// 	file: [{
				// 		admin0pcode: "AF",
				// 		adminRpcode: "EMRO",
				// 		cluster_id: "health",
				// 		createdAt: "2019-06-10T02:41:58.702Z",
				// 		fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
				// 		fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
				// 		filename: "leave-balance.2PNG.PNG",
				// 		filename_extension: ".PNG",
				// 		fileowner: "fakhrihawari",
				// 		id: "5cfdc376ee6ec8d107a11755",
				// 		mime_type: "image/png",
				// 		organization_tag: "immap",
				// 		project_end_date: "2018-12-31T00:00:00.000Z",
				// 		project_id: "pln123lstrk456coba78",
				// 		project_start_date: "2018-01-01T00:00:00.000Z",
				// 		report_id: "fkhrhwrrfn123test021",
				// 		reporting_period: "2018-12-01T00:00:00.000Z",
				// 		updatedAt: "2019-06-10T02:41:58.702Z"
				// 	}]
				// }],
				// planed_activity: [{
				// 	id: 'qw@#$1234mn',
				// 	area_id: "information_management_coordination",
				// 	area_name: "Information Management and Coordination Support",
				// 	partner_category_id: "humanitarian_partner",
				// 	partner_category_name: "Humanitarian Partner",
				// 	narative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
				// 	number_products: 6,
				// 	partner: " ORGA",
				// 	partner_id: "02",
				// 	product_id: "static_infographic",
				// 	product_name: "Static Infographic",
				// }],
				products: [{
					id: '1s2w3erhshsh',
					area_id: "information_management_coordination",
					area_name: "Information Management and Coordination Support",
					partner_category_id: "humanitarian_partner",
					partner_category_name: "Humanitarian Partner",
					collab_id: "02",
					collab_name: "CC",
					product_detail_id: 'a3',
					product_detail_name: 'A3',
					collaborators: [{ id: '02', name: 'CC' }],
					narrative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
					number_products: 5,
					partner: " ORGA",
					partner_id: "02",
					product_id: "static_infographic",
					product_name: "Static Infographic",
					files: [{
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}]
				}],
				planned_products: [{
					id: 'qw@#$1234mn',
					area_id: "information_management_coordination",
					area_name: "Information Management and Coordination Support",
					partner_category_id: "humanitarian_partner",
					partner_category_name: "Humanitarian Partner",
					narrative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
					number_products: 6,
					partner: " ORGA",
					partner_id: "02",
					product_id: "static_infographic",
					product_name: "Static Infographic",
				}],
				rating: 5,
				notes: 'SWAG',
				month_date: '2019-05-21',
				report_date: '2019-05-21',
				month: '5',
				report_month: '5',
				icon: 'done_all',
				report_status: 'complete',
				report_submit: true,
				upload_id: 'fkhrhwrrfn123test021'
			}];
			reportFilter = report.filter(function(el){return el.id === id})
		return res.json(200, reportFilter[0]);
	},
	getDummyReportList:function(req,res){
		var todo = [{
			id:'t1',
			// support_partner: [{
			// 	id: '1s2w3erhshsh',
			// 	area_activity_id: "information_management_coordination",
			// 	area_activity_name: "Information Management and Coordination Support",
			// 	area_id: "information_management_coordination",
			// 	area_name: "Information Management and Coordination Support",
			// 	category_id: "humanitarian_partner",
			// 	category_name: "Humanitarian Partner",
			// 	partner_category_id: "humanitarian_partner",
			// 	partner_category_name: "Humanitarian Partner",
			// 	collab_id: "02",
			// 	collab_name: "CC",
			// 	collabArray:[{ id: '01', name: 'YY' }, { id: '02', name: 'CC' }],
			// 	narative_activity_id: "01",
			// 	narative_activity_name: "Information Management Narative",
			// 	narative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
			// 	number_products: 10,
			// 	partner: " ORGA",
			// 	partner_id: "02",
			// 	product_id: "static_infographic",
			// 	product_name: "Static Infographic",
			// 	file: [{
			// 		admin0pcode: "AF",
			// 		adminRpcode: "EMRO",
			// 		cluster_id: "health",
			// 		createdAt: "2019-06-10T02:41:58.702Z",
			// 		fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
			// 		fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
			// 		filename: "leave-balance.2PNG.PNG",
			// 		filename_extension: ".PNG",
			// 		fileowner: "fakhrihawari",
			// 		id: "5cfdc376ee6ec8d107a11755",
			// 		mime_type: "image/png",
			// 		organization_tag: "immap",
			// 		project_end_date: "2018-12-31T00:00:00.000Z",
			// 		project_id: "pln123lstrk456coba78",
			// 		project_start_date: "2018-01-01T00:00:00.000Z",
			// 		report_id: "fkhrhwrrfn123test021",
			// 		reporting_period: "2018-12-01T00:00:00.000Z",
			// 		updatedAt: "2019-06-10T02:41:58.702Z"
			// 	}]
			// }],
			// planed_activity: [{
			// 	id: 'qw@#$1234mn',
			// 	area_activity_id: "information_management_coordination",
			// 	area_activity_name: "Information Management and Coordination Support",
			// 	area_id: "information_management_coordination",
			// 	area_name: "Information Management and Coordination Support",
			// 	category_id: "humanitarian_partner",
			// 	category_name: "Humanitarian Partner",
			// 	partner_category_id: "humanitarian_partner",
			// 	partner_category_name: "Humanitarian Partner",
			// 	narative_activity_id: "01",
			// 	narative_activity_name: "Information Management Narative",
			// 	number_products: 10,
			// 	partner: " ORGA",
			// 	partner_id: "02",
			// 	product_id: "static_infographic",
			// 	product_name: "Static Infographic",
			// }],
			products: [{
				id: '1s2w3erhshsh',
				area_id: "information_management_coordination",
				area_name: "Information Management and Coordination Support",
				partner_category_id: "humanitarian_partner",
				partner_category_name: "Humanitarian Partner",
				collab_id: "02",
				collab_name: "CC",
				collabArray: [{ id: '01', name: 'YY' }, { id: '02', name: 'CC' }],
				collaborators: [{ id: '01', name: 'YY' }, { id: '02', name: 'CC' }],
				product_detail_id: 'a3',
				product_detail_name: 'A3',
				narrative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
				number_products: 101,
				partner: " ORGA",
				partner_id: "02",
				product_id: "static_infographic",
				product_name: "Static Infographic",
				files: [{
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}]
			}],
			planned_products: [{
				id: 'qw@#$1234mn',
				area_id: "information_management_coordination",
				area_name: "Information Management and Coordination Support",
				partner_category_id: "humanitarian_partner",
				partner_category_name: "Humanitarian Partner",
				narrative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
				number_products: 1,
				partner: " ORGA",
				partner_id: "02",
				product_id: "static_infographic",
				product_name: "Static Infographic",
			}],
			rating: 5,
			notes: 'SWAG',
			month_date: '2019-06-21',
			report_date: '2019-06-21',
			reporting_period: '2019-06-1',
			report_year: '2019',
			month: '6',
			report_month: '6',
			icon: 'alarm_on',
			report_status: 'todo',
			report_submit: false,
			upload_id: 'fkhrhwrrfn123test021'
		}]
		var complete = [{
				id:'c1',
				// support_partner: [{
				// 	id: '1s2w3erhshsh',
				// 	area_activity_id: "information_management_coordination",
				// 	area_activity_name: "Information Management and Coordination Support",
				// 	area_id: "information_management_coordination",
				// 	area_name: "Information Management and Coordination Support",
				// 	category_id: "humanitarian_partner",
				// 	category_name: "Humanitarian Partner",
				// 	partner_category_id: "humanitarian_partner",
				// 	partner_category_name: "Humanitarian Partner",
				// 	collab_id: "02",
				// 	collab_name: "CC",
				// 	narative_activity_id: "01",
				// 	narative_activity_name: "Information Management Narative",
				// 	narative:"Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
				// 	partner_name: " ORGA",
				// 	partner: " ORGA",
				// 	partner_id: "02",
				// 	product_id: "static_infographic",
				// 	product_name: "Static Infographic",
				// 	product_details_id:"01",
				// 	product_details_name:"Information Management Narative",
				// 	file: [{
				// 		admin0pcode: "AF",
				// 		adminRpcode: "EMRO",
				// 		cluster_id: "health",
				// 		createdAt: "2019-06-10T02:41:58.702Z",
				// 		fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
				// 		fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
				// 		filename: "leave-balance.2PNG.PNG",
				// 		filename_extension: ".PNG",
				// 		fileowner: "fakhrihawari",
				// 		id: "5cfdc376ee6ec8d107a11755",
				// 		mime_type: "image/png",
				// 		organization_tag: "immap",
				// 		project_end_date: "2018-12-31T00:00:00.000Z",
				// 		project_id: "pln123lstrk456coba78",
				// 		project_start_date: "2018-01-01T00:00:00.000Z",
				// 		report_id: "fkhrhwrrfn123test021",
				// 		reporting_period: "2018-12-01T00:00:00.000Z",
				// 		updatedAt: "2019-06-10T02:41:58.702Z"
				// 	}]
				// }],
				// planed_activity: [{
				// 	id: 'qw@#$1234mn',
				// 	area_activity_id: "information_management_coordination",
				// 	area_activity_name: "Information Management and Coordination Support",
				// 	area_id: "information_management_coordination",
				// 	area_name: "Information Management and Coordination Support",
				// 	category_id: "humanitarian_partner",
				// 	category_name: "Humanitarian Partner",
				// 	partner_category_id: "humanitarian_partner",
				// 	partner_category_name: "Humanitarian Partner",
				// 	narative_activity_id: "01",
				// 	narative_activity_name: "Information Management Narative",
				// 	number_products: 10,
				// 	partner: " ORGA",
				// 	partner_id: "02",
				// 	product_id: "static_infographic",
				// 	product_name: "Static Infographic",
				// }],
			products: [{
				id: '1s2w3erhshsh',
				area_id: "information_management_coordination",
				area_name: "Information Management and Coordination Support",
				partner_category_id: "humanitarian_partner",
				partner_category_name: "Humanitarian Partner",
				collab_id: "02",
				collab_name: "CC",
				product_detail_id: 'a3',
				product_detail_name: 'A3',
				collaborators: [{ id: '02', name: 'CC' }],
				narrative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
				number_products: 5,
				partner: " ORGA",
				partner_id: "02",
				product_id: "static_infographic",
				product_name: "Static Infographic",
				files: [{
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}]
			}],
			planned_products: [{
				id: 'qw@#$1234mn',
				area_id: "information_management_coordination",
				area_name: "Information Management and Coordination Support",
				partner_category_id: "humanitarian_partner",
				partner_category_name: "Humanitarian Partner",
				narrative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
				number_products: 6,
				partner: " ORGA",
				partner_id: "02",
				product_id: "static_infographic",
				product_name: "Static Infographic",
			}],
				rating: 5,
				notes: 'SWAG',
				month_date: '2019-05-21',
				report_date: '2019-05-21',
				reporting_period: '2019-05-1',
				report_year: '2019',
				month: '5',
				report_month: '5',
				icon:'done_all',
				report_status: 'complete',
				report_submit: true,
				upload_id:'fkhrhwrrfn123test021'
			}];
		var report;
			if(req.param('status')=== 'complete'){
			report = complete;			
		}else{
			report = todo;
		}
		return res.json(200, report);
	},
	getLicenseDummyList:function(req,res){
		var list =[{
			id: 'asdfasdsdfasdfasdfadfa',
			admin0name: 'Afghanistan',
			admin0pcode: 'AF',
			adminRpcode: 'EMRO',
			email: 'dummyzero@immap.org',
			expired_date: '2019-05-01',
			license_id: 'adobe_reader',
			license_name: 'Adobe Reader',
			name: 'fharifin',
			organization: 'iMMAP',
			organization_tag: 'immap',
			start_date: '2019-05-01',
			status: 'REQUESTED',
			username: 'dummzero',
		},{
				id: 'asdfsdwasd',
				admin0name: 'Afghanistan',
				admin0pcode: 'AF',
				adminRpcode: 'EMRO',
				email: 'dummyzero@immap.org',
				expired_date: '2019-05-02',
				license_id: 'adobe_photoshop',
				license_name: 'Adobe Photoshop',
				name: 'fharifin',
				organization: 'iMMAP',
				organization_tag: 'immap',
				start_date: '2019-05-02',
				status: 'ACTIVE',
				username: 'dummzero',
			}, {
				id:'asdfasd',
				admin0name: 'Afghanistan',
				admin0pcode: 'AF',
				adminRpcode: 'EMRO',
				email: 'dummyzero@immap.org',
				expired_date: '2019-05-03',
				license_id: 'adobe_indesign',
				license_name: 'Adobe Indesign',
				name: 'fharifin',
				organization: 'iMMAP',
				organization_tag: 'immap',
				start_date: '2019-05-03',
				status: 'TERMINATED',
				username: 'dummzero',
			}];
		return res.json(200, list);
	},
	getTeamLicenseDummyList:function(req,res){
		list=[]
		var request=[{
			id: 'asdfasdsdfasdfasdfadfa',
			admin0name: 'Afghanistan',
			admin0pcode: 'AF',
			adminRpcode: 'EMRO',
			email: 'dummyzero@immap.org',
			expired_date: '2019-05-01',
			license_id: 'adobe_reader',
			license_name: 'Adobe Reader',
			name: 'fharifin',
			organization: 'iMMAP',
			organization_tag: 'immap',
			start_date: '2019-05-01',
			status: 'REQUESTED',
			username: 'dummzero',
		}, {
				id: 'asdfasdsdfasdfasdfadfa',
				admin0name: 'Afghanistan',
				admin0pcode: 'AF',
				adminRpcode: 'EMRO',
				email: 'dummyzero@immap.org',
				expired_date: '2019-05-01',
				license_id: 'adobe_reader',
				license_name: 'Adobe Reader',
				name: 'fharifin',
				organization: 'iMMAP',
				organization_tag: 'immap',
				start_date: '2019-05-01',
				status: 'REQUESTED',
				username: 'dummzero',
			}, {
				id: 'asdfasdsdfasdfasdfadfa',
				admin0name: 'Afghanistan',
				admin0pcode: 'AF',
				adminRpcode: 'EMRO',
				email: 'dummyzero@immap.org',
				expired_date: '2019-05-01',
				license_id: 'adobe_reader',
				license_name: 'Adobe Reader',
				name: 'fharifin',
				organization: 'iMMAP',
				organization_tag: 'immap',
				start_date: '2019-05-01',
				status: 'REQUESTED',
				username: 'dummzero',
			}];
		var active =[{
				id: 'asdfsdwasd',
				admin0name: 'Afghanistan',
				admin0pcode: 'AF',
				adminRpcode: 'EMRO',
				email: 'dummyzero@immap.org',
				expired_date: '2019-05-02',
				license_id: 'adobe_photoshop',
				license_name: 'Adobe Photoshop',
				name: 'fharifin',
				organization: 'iMMAP',
				organization_tag: 'immap',
				start_date: '2019-05-02',
				status: 'ACTIVE',
				username: 'dummzero',
		}, {
				id: 'asdfsdwasd',
				admin0name: 'Afghanistan',
				admin0pcode: 'AF',
				adminRpcode: 'EMRO',
				email: 'dummyzero@immap.org',
				expired_date: '2019-05-02',
				license_id: 'adobe_photoshop',
				license_name: 'Adobe Photoshop',
				name: 'fharifin',
				organization: 'iMMAP',
				organization_tag: 'immap',
				start_date: '2019-05-02',
				status: 'ACTIVE',
				username: 'dummzero',
			}, {
				id: 'asdfsdwasd',
				admin0name: 'Afghanistan',
				admin0pcode: 'AF',
				adminRpcode: 'EMRO',
				email: 'dummyzero@immap.org',
				expired_date: '2019-05-02',
				license_id: 'adobe_photoshop',
				license_name: 'Adobe Photoshop',
				name: 'fharifin',
				organization: 'iMMAP',
				organization_tag: 'immap',
				start_date: '2019-05-02',
				status: 'ACTIVE',
				username: 'dummzero',
			}]; 
		var terminated=[{
				id:'asdfasd',
				admin0name: 'Afghanistan',
				admin0pcode: 'AF',
				adminRpcode: 'EMRO',
				email: 'dummyzero@immap.org',
				expired_date: '2019-05-03',
				license_id: 'adobe_indesign',
				license_name: 'Adobe Indesign',
				name: 'fharifin',
				organization: 'iMMAP',
				organization_tag: 'immap',
				start_date: '2019-05-03',
				status: 'TERMINATED',
				username: 'dummzero',
			},{
					id: 'asdfasd',
					admin0name: 'Afghanistan',
					admin0pcode: 'AF',
					adminRpcode: 'EMRO',
					email: 'dummyzero@immap.org',
					expired_date: '2019-05-03',
					license_id: 'adobe_indesign',
					license_name: 'Adobe Indesign',
					name: 'fharifin',
					organization: 'iMMAP',
					organization_tag: 'immap',
					start_date: '2019-05-03',
					status: 'TERMINATED',
					username: 'dummzero',
			},{
					id: 'asdfasd',
					admin0name: 'Afghanistan',
					admin0pcode: 'AF',
					adminRpcode: 'EMRO',
					email: 'dummyzero@immap.org',
					expired_date: '2019-05-03',
					license_id: 'adobe_indesign',
					license_name: 'Adobe Indesign',
					name: 'fharifin',
					organization: 'iMMAP',
					organization_tag: 'immap',
					start_date: '2019-05-03',
					status: 'TERMINATED',
					username: 'dummzero',
			}];
		if (req.param('status') === 'request'){
			list = request;
		}
		if (req.param('status') === 'active'){
			list = active;
		}
		if(req.param('status') === 'terminated'){
			list = terminated;
		}
		return res.json(200, list);
	},
	getProductDummyIndicator:function(req,res){
		var chart=[]
		var sector_chart = [{
			color: "#f48fb1", label: 1407, name: "WASH", y: 54.29992892679459
		}, { color: "#90caf9", label: 1407, name: "Health", y: 45.7000710732054 }];
		var type_chart = [{
			color: "#f48fb1", label: 1407, name: "Map", y: 54.29992892679459
		}, { color: "#90caf9", label: 1407, name: "Dashboard", y: 45.7000710732054 }];
		var prod_chart = [{
			color: "#f48fb1", label: 1407, name: "Map", y: 50.29992892679459
		}, { color: "#90caf9", label: 1407, name: "Dashboard", y: 30.7000710732054 },
			{ color: "#5cb85c", label: 1407, name: "Infographics", y: 19.0000000000000 }];
		if (req.param('indicator') ==='sector_chart'){
			chart= sector_chart;
		}
		if (req.param('indicator') === 'type_chart'){
			chart = type_chart;
		}
		if (req.param('indicator') === 'prod_chart') {
			chart = prod_chart;
		}
		if (req.param('indicator') === 'bar_chart_user'){
			var bar_chart = [
				{
					name: 'Map',
					color: '#7cb5ec',
					data: [
						10, //data for user A 
						19, //data for user AB
						11, //data for user AC
						12, //data for user AD
						15, //data for user AE
						21, //data for user AF	 
						5, //data for user AG 
						25, //data for user AH 
						40, //data for user AI 
						31, //data for user AJ 
						8 // data for user AK
					]
				},
				{
					name: 'Dashboard',
					color: '#be2126',
					data: [
						5,//data for user A
						10,//data for user AB
						4,//data for user AC
						6,//data for user AD
						7,//data for user AE
						10,//data for user AF
						2,//data for user AG
						12,//data for user AH
						20,//data for user AI
						15,//data for user AJ
						4 //data for user AK
					]
				}]

			chart = bar_chart;
			// for barchart categories
			var barchart_xAxis_categories_user = ['User A',
				'User AB',
				'User AC',
				'User AD',
				'User AE',
				'User AF',
				'User AG',
				'User AH',
				'User AI',
				'User AJ',
				'User AK']
			return res.json({ data: chart, categories: barchart_xAxis_categories_user });
		}
		if (req.param('indicator') === 'bar_chart_partner') {
			var bar_chart = [
				{
					name: 'Map',
					color: '#7cb5ec',
					data: [
						10, //data for user A 
						19, //data for user AB
						11, //data for user AC
						12, //data for user AD
						15, //data for user AE
						21, //data for user AF	 
						5, //data for user AG 
						25, //data for user AH 
						40, //data for user AI 
						31, //data for user AJ 
						8 // data for user AK
					]
				},
				{
					name: 'Dashboard',
					color: '#be2126',
					data: [
						2,//data for user A
						5,//data for user AB
						2,//data for user AC
						3,//data for user AD
						4,//data for user AE
						5,//data for user AF
						1,//data for user AG
						6,//data for user AH
						10,//data for user AI
						7,//data for user AJ
						2 //data for user AK
					]
				}];

			chart = bar_chart;
			// for barchart categories
				var barchart_xAxis_categories_partner = ['Partner A',
					'Partner AB',
					'Partner AC',
					'Partner AD',
					'Partner AE',
					'Partner AF',
					'Partner AG',
					'Partner AH',
					'Partner AI',
					'Partner AJ',
					'Partner AK']
			return res.json({ data: chart, categories: barchart_xAxis_categories_partner });
		}
		if (req.param('indicator') === 'products'){
			return res.json(200, { value: 1 })
		}
		if (req.param('indicator') === 'sectors') {
			return res.json(200, { value: 1 })
		}
		if (req.param('indicator') === 'contributors') {
			return res.json(200, { value: 1 })
		}
		if(req.param('indicator')==='lists'){
			var list0=[{
				"id": "5cfdc376ee6ec8d107a11755",
        "timestamp" : "7/31/2018 12:12:04",
        "email" : "pfitzgerald@immap.org",
        "project" : "Dummy",
        "country" : "Afghanistan",
        "product_sector" : "Health",
        "product_month" : "July",
        "product_year" : "2018",
				"product_type" : "Map",
				"partner":"ORGA",
				"category_name":'Humanitarian Partner',
				"area_activity_name":"Information Management and Coordination Support",
				"collab_name":"CC",
        "product_description" : "4W Analysis for Health",
        "product_upload" : [
                "https://drive.google.com/open?id=1KB2pUffgVZU5L7M5AZjuYzJTYPWQriSy"
        ],
        "product_id" : [
								"1KB2pUffgVZU5L7M5AZjuYzJTYPWQriSy",								
								"1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV"
        ],
        "form_url" : "https://docs.google.com/forms/d/e/1FAIpQLSdMYljeEtH5CdwcDi0xUaj4WE5KHPkuEnck86KGi-BayR65jA/viewform?edit2=2_ABaOnudnpWEK8fZ1QDivqCaxb623pbdeGZIiuq0xMpfp8XPsUiUuuaoNiMU55tA",
        "timestamp_format" : "Tue, 31 Jul 2018 12:12:04",
        "product_sector_id" : "health",
        "product_type_id" : "map",
        "product_date" : "2018-07-01T00:00:00.000Z",
        "product_sector_short" : "HEA",
        "theme" : {
                "color" : "#2196f3"
        },
        "adminRpcode" : "AFRO",
        "adminRname" : "AFRO",
        "adminRzoom" : 3,
        "adminRlng" : 23.669468,
        "adminRlat" : -1.173667,
        "admin0pcode" : "AF",
        "admin0name" : "Afghanistan",
        "admin0lng" : 39.041495,
        "admin0lat" : 8.308214,
        "admin0zoom" : 6,
        "createdAt" : '2019-04-30',
				"updatedAt": '2019-04-30'
			}];
			list = [{
				id: 't1',
				support_partner: [{
					id: '1s2w3erhshsh',
					area_id: "information_management_coordination",
					area_name: "Information Management and Coordination Support",
					partner_category_id: "humanitarian_partner",
					partner_category_name: "Humanitarian Partner",
					collab_id: "02",
					collab_name: "CC",
					collabArray: [{ id: '01', name: 'YY' }, { id: '02', name: 'CC' }],
					product_detail_id: 'a3',
					product_detail_name: 'A3',
					narative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
					number_products: 101,
					partner: " ORGA",
					partner_id: "02",
					product_id: "static_infographic",
					product_name: "Static Infographic",
					file: [{
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}, {
						admin0pcode: "AF",
						adminRpcode: "EMRO",
						cluster_id: "health",
						createdAt: "2019-06-10T02:41:58.702Z",
						fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
						fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
						filename: "leave-balance.2PNG.PNG",
						filename_extension: ".PNG",
						fileowner: "fakhrihawari",
						id: "5cfdc376ee6ec8d107a11755",
						mime_type: "image/png",
						organization_tag: "immap",
						project_end_date: "2018-12-31T00:00:00.000Z",
						project_id: "pln123lstrk456coba78",
						project_start_date: "2018-01-01T00:00:00.000Z",
						report_id: "fkhrhwrrfn123test021",
						reporting_period: "2018-12-01T00:00:00.000Z",
						updatedAt: "2019-06-10T02:41:58.702Z"
					}]
				}],
				planed_activity: [{
					id: 'qw@#$1234mn',
					area_id: "information_management_coordination",
					area_name: "Information Management and Coordination Support",
					partner_category_id: "humanitarian_partner",
					partner_category_name: "Humanitarian Partner",
					narative: "Todo Upload ideally should be per row and could be multipart(to come with best solution-number_products: 10",
					number_products: 1,
					partner: " ORGA",
					partner_id: "02",
					product_id: "static_infographic",
					product_name: "Static Infographic",
				}],
				rating: 5,
				notes: 'SWAG',
				month_date: '2019-06-21',
				report_date: '2019-06-21',
				reporting_period: '2019-06-1',
				report_year: '2019',
				month: '6',
				report_month: '6',
				icon: 'alarm_on',
				report_status: 'todo',
				report_submit: false,
				upload_id: 'fkhrhwrrfn123test021',
				email: "dummyzero@immap.org",
				name: "fharifin",
				phone: "01010110",
				username: "dummzero"
			},]
			return res.json(200,list)
		}
		if(req.param('indicator')==='list_product'){
			var list = [{
				admin0pcode: "AF",
				adminRpcode: "EMRO",
				cluster_id: "health",
				createdAt: "2019-06-10T02:41:58.702Z",
				fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
				fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
				filename: "leave-balance.2PNG.PNG",
				filename_extension: ".PNG",
				fileowner: "fakhrihawari",
				id: "5cfdc376ee6ec8d107a11755",
				mime_type: "image/png",
				organization_tag: "immap",
				project_end_date: "2018-12-31T00:00:00.000Z",
				project_id: "pln123lstrk456coba78",
				project_start_date: "2018-01-01T00:00:00.000Z",
				report_id: "fkhrhwrrfn123test021",
				reporting_period: "2018-12-01T00:00:00.000Z",
				updatedAt: "2019-06-10T02:41:58.702Z"
			}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}, {
					admin0pcode: "AF",
					adminRpcode: "EMRO",
					cluster_id: "health",
					createdAt: "2019-06-10T02:41:58.702Z",
					fileid: "1fIpwiNVX-HbRV2Q62Hb3Mo_KM_3T4uuV",
					fileid_local: "1fd73000-4568-4050-a89d-00ed87a1a554.PNG",
					filename: "leave-balance.2PNG.PNG",
					filename_extension: ".PNG",
					fileowner: "fakhrihawari",
					id: "5cfdc376ee6ec8d107a11755",
					mime_type: "image/png",
					organization_tag: "immap",
					project_end_date: "2018-12-31T00:00:00.000Z",
					project_id: "pln123lstrk456coba78",
					project_start_date: "2018-01-01T00:00:00.000Z",
					report_id: "fkhrhwrrfn123test021",
					reporting_period: "2018-12-01T00:00:00.000Z",
					updatedAt: "2019-06-10T02:41:58.702Z"
				}];
			return res.json(200, list)
		}
		if (req.param('indicator') ==='infographics'){
			return res.json(200,{value:5})
		}
		if (req.param('indicator') === 'map') {
			return res.json(200, { value: 5 })
		}
		if (req.param('indicator') === 'dashboard_map') {
			return res.json(200, { value: 5 })
		}
		if (req.param('indicator') === 'area') {
			return res.json(200, { value: 5 })
		}
		if (req.param('indicator') === 'partner') {
			return res.json(200, { value: 8 })
		}
		if (req.param('indicator') === 'total_product') {
			return res.json(200, { value: 15 })
		}
		return res.json(200,{data:chart})
	},
	getDummyMenu:function(req,res){
		var menu = [];
		var menu_items = req.param('menu_items');
		console.log(menu_items);
		Products
			.find()
			.exec(function (err, products) {

				// return error
				if (err) return res.negotiate(err);
	

		// product_sector_id
		if (menu_items.indexOf('product_sector_id') !== -1) {

			// menu
			menu.push({
				'search': true,
				'id': 'search-product_sector_id-products',
				'icon': 'donut_large',
				'title': 'Sector',
				'class': 'teal lighten-1 white-text',
				'rows': []
			});

			// get unique product_sector_id
			var list = _.uniq(products, function (p) {
				return p.product_sector_id;
			});

			// sort
			list.sort(function (a, b) {
				return a.product_sector_id.localeCompare(b.product_sector_id);
			});

			// add all
			list.unshift({ product_sector: 'All', product_sector_id: 'all' });

			// for each
			list.forEach(function (d, i) {
				menu[menu.length - 1].rows.push({
					'title': d.product_sector,
					'param': 'product_sector_id',
					'active': d.product_sector_id,
					'class': 'grey-text text-darken-2 waves-effect waves-teal waves-teal-lighten-4',
					'href': '/desk/#/immap/products/' + req.param('admin0pcode') + '/' +
						req.param('project') + '/' +
						d.product_sector_id + '/' +
						req.param('product_type_id') + '/' +
						req.param('email') + '/' +
						req.param('start_date') + '/' +
						req.param('end_date')
				});
			});

		}

				// area
				if (menu_items.indexOf('area') !== -1) {

					// menu
					menu.push({
						'search': true,
						'id': 'search-country-products',
						'icon': 'map',
						'title': 'Area',
						'class': 'teal lighten-1 white-text',
						'rows': []
					});

					// get unique countries
					var list = _.uniq(products, function (p) {
						return p.admin0pcode;
					});

					// sort
					list.sort(function (a, b) {
						return a.admin0pcode.localeCompare(b.admin0pcode);
					});

					// add all
					list.unshift({ admin0name: 'All', admin0pcode: 'all' });

					// for each
					list.forEach(function (d, i) {
						menu[menu.length - 1].rows.push({
							'title': d.admin0name,
							'param': 'admin0pcode',
							'active': d.admin0pcode,
							'class': 'grey-text text-darken-2 waves-effect waves-teal waves-teal-lighten-4',
							'href': '/desk/#/immap/products/' + d.admin0pcode + '/' +
								req.param('project') + '/' +
								req.param('product_sector_id') + '/' +
								req.param('product_type_id') + '/' +
								req.param('email') + '/' +
								req.param('start_date') + '/' +
								req.param('end_date')
						});
					});

				}

		// product_type_id
		if (menu_items.indexOf('product_type_id') !== -1) {

			// menu
			menu.push({
				'search': true,
				'id': 'search-product_type_id-products',
				'icon': 'crop_original',
				'title': 'Type',
				'class': 'teal lighten-1 white-text',
				'rows': []
			});

			// get unique product_type_id
			var list = _.uniq(products, function (p) {
				return p.product_type_id;
			});

			// sort
			list.sort(function (a, b) {
				return a.product_type_id.localeCompare(b.product_type_id);
			});

			// add all
			list.unshift({ product_type: 'All', product_type_id: 'all' });

			// for each
			list.forEach(function (d, i) {
				menu[menu.length - 1].rows.push({
					'title': d.product_type,
					'param': 'product_type_id',
					'active': d.product_type_id,
					'class': 'grey-text text-darken-2 waves-effect waves-teal waves-teal-lighten-4',
					'href': '/desk/#/immap/products/' + req.param('admin0pcode') + '/' +
						req.param('project') + '/' +
						req.param('product_sector_id') + '/' +
						d.product_type_id + '/' +
						req.param('email') + '/' +
						req.param('start_date') + '/' +
						req.param('end_date')
				});
			});

		}

		// partner
		if (menu_items.indexOf('partner') !== -1) {

			// menu
			menu.push({
				'search': true,
				'id': 'search-country-products',
				'icon': 'compare_arrows',
				'title': 'Partner',
				'class': 'teal lighten-1 white-text',
				'rows': []
			});

			// get unique countries
			var list = _.uniq(products, function (p) {
				return p.admin0pcode;
			});

			// sort
			list.sort(function (a, b) {
				return a.admin0pcode.localeCompare(b.admin0pcode);
			});

			// add all
			list.unshift({ admin0name: 'All', admin0pcode: 'all' });

			// for each
			list.forEach(function (d, i) {
				menu[menu.length - 1].rows.push({
					'title': d.admin0name,
					'param': 'admin0pcode',
					'active': d.admin0pcode,
					'class': 'grey-text text-darken-2 waves-effect waves-teal waves-teal-lighten-4',
					'href': '/desk/#/immap/products/' + d.admin0pcode + '/' +
						req.param('project') + '/' +
						req.param('product_sector_id') + '/' +
						req.param('product_type_id') + '/' +
						req.param('email') + '/' +
						req.param('start_date') + '/' +
						req.param('end_date')
				});
			});

		}

		// user
		if (menu_items.indexOf('user') !== -1) {

			// menu
			menu.push({
				'search': true,
				'id': 'search-country-products',
				'icon': 'person_pin',
				'title': 'User',
				'class': 'teal lighten-1 white-text',
				'rows': []
			});

			// get unique countries
			var list = _.uniq(products, function (p) {
				return p.admin0pcode;
			});

			// sort
			list.sort(function (a, b) {
				return a.admin0pcode.localeCompare(b.admin0pcode);
			});

			// add all
			list.unshift({ admin0name: 'All', admin0pcode: 'all' });

			// for each
			list.forEach(function (d, i) {
				menu[menu.length - 1].rows.push({
					'title': d.admin0name,
					'param': 'admin0pcode',
					'active': d.admin0pcode,
					'class': 'grey-text text-darken-2 waves-effect waves-teal waves-teal-lighten-4',
					'href': '/desk/#/immap/products/' + d.admin0pcode + '/' +
						req.param('project') + '/' +
						req.param('product_sector_id') + '/' +
						req.param('product_type_id') + '/' +
						req.param('email') + '/' +
						req.param('start_date') + '/' +
						req.param('end_date')
				});
			});

		}

		// email
		if (menu_items.indexOf('email') !== -1) {

			// menu
			menu.push({
				'search': true,
				'id': 'search-email-products',
				'icon': 'email',
				'title': 'Email',
				'class': 'teal lighten-1 white-text',
				'rows': []
			});

			// get unique product_type_id
			var list = _.uniq(products, function (p) {
				return p.email;
			});

			// sort
			list.sort(function (a, b) {
				return a.email.localeCompare(b.email);
			});

			// add all
			list.unshift({ email: 'all' });

			// for each
			list.forEach(function (d, i) {
				menu[menu.length - 1].rows.push({
					'title': d.email === 'all' ? 'All' : d.email,
					'param': 'email',
					'active': d.email,
					'class': 'grey-text text-darken-2 waves-effect waves-teal waves-teal-lighten-4',
					'href': '/desk/#/immap/products/' + req.param('admin0pcode') + '/' +
						req.param('project') + '/' +
						req.param('product_sector_id') + '/' +
						req.param('product_type_id') + '/' +
						d.email + '/' +
						req.param('start_date') + '/' +
						req.param('end_date')
				});
			});

		}
		console.log();

		// return menu
		return res.json(200, menu);})

	},
	setDummyReport:function(req,res) {
		var report=req.param('report')
		return res.json(200, report)
	},
	getTeamReporting:function(req,res){
		ImmapUser.find().exec(function (err, users) {
			console.log(users.length, req.param('indicator'))
			if(req.param('indicator') === 'total_active'){
				return res.json(200, { value: users.length })
			}
			return res.json(200,users)
		})
	}

};

module.exports = ReportController;
