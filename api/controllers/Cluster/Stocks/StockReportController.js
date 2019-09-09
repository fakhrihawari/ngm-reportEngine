/**
 * ReportController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

// set moment
var moment = require('moment');

module.exports = {

  // get all reports
  getReportsList: function( req, res ) {

    // request input
    if ( !req.param( 'filter' ) ) {
      return res.json( 401, { err: 'filter required!' });
		}
		filter = req.param('filter');
		if (filter === 'get') {
			filter = req.allParams();
			delete filter.filter;
		}

    // get by organization_id & status
    StockReport
      .find( filter )
      .sort( 'report_month ASC' )
      .populate('stocklocations')
      .exec ( function( err, reports ){

        // return error
        if ( err ) return res.negotiate( err );

        // counter
        var counter=0,
            length=reports.length;

        if (length){
          reports = _.difference(reports, _.where(reports, {stocklocations:[]}))
          length = reports.length;
        }

        // no reports
        if ( !length ) {
          return res.json( 200, reports );
        }

        // determine status
        if ( length )  {

          // reports
          reports.forEach( function( d, i ){

            // check if form has been edited
            Stock
              .count( { report_id: d.id } )
              .exec(function( err, b ){

                // return error
                if (err) return res.negotiate( err );

                // add status as green
                reports[i].status = '#4db6ac';

                // if report is 'todo' and past due date!
                if ( reports[i].report_status === 'todo' && moment().isAfter( moment( reports[i].reporting_due_date ) ) ) {

                  // set to red (overdue!)
                  reports[i].status = '#e57373'

                  // if beneficiaries ( report has been updated )
                  if ( b ) {
                    reports[i].status = '#fff176'
                  }
                }

                // reutrn
                counter++;
                if ( counter === length ) {
                  // table
                  return res.json( 200, reports );
                }

              });

          });

        }

      });

  },

  // get all Reports
  getReportById: function( req, res ) {

    // request input
    if ( !req.param( 'id' ) ) {
      return res.json(401, { err: 'id required!' });
    }

    if ( req.param('previous')) var prev = true;

    // report for UI
    var $report = {};

    // get report by organization_id
    StockReport
      .findOne( { id: req.param( 'id' ) } )
      .exec( function( err, report ){

        // return error
        if (err) return res.negotiate( err );

        // clone to update
        $report = report.toObject();
        var reporting_period = moment($report.reporting_period)
          .startOf("month")
          .format("YYYY-MM-DD");

        // get report by organization_id
        StockLocation
          .find({
            report_id: $report.id,
            or: [{
              date_inactivated: null
            }, {
              date_inactivated: {
                '>': new Date(reporting_period)
              }
            }]
          })

          // .populate('stock')
          .populateAll()
          .exec( function( err, locations ){

          // return error
          if (err) return res.negotiate( err );

          // add locations ( associations included )
          $report.stocklocations = locations;

          if (prev) {
            query_previous = {
              report_month: moment($report.reporting_period).subtract(1, 'M').month(),
              report_year: moment($report.reporting_period).subtract(1, 'M').year(),
              organization_tag: $report.organization_tag,
              cluster_id: $report.cluster_id,
              admin0pcode: $report.admin0pcode
            };

            StockReport
              .findOne(query_previous)
              .exec(function (err, report_prev) {

                // return error
                if (err) return res.negotiate(err);

                if (report_prev) {
                  // clone to update
                  $report_prev = report_prev.toObject();

                  // get report by organization_id
                  StockLocation
                    .find({
                      report_id: $report_prev.id
                    })
                    // .populate('stock')
                    .populateAll()
                    .exec(function (err, locations_prev) {

                      // return error
                      if (err) return res.negotiate(err);

                      // add locations ( associations included )
                      $report_prev.stocklocations = locations_prev;

                      // return report
                      return res.json(200, $report_prev);

                    });
                } else return res.json(200, {});
              });


          } else {
          // return report
          return res.json( 200, $report );
          }
        });

      });

  },

  // set report details by report id
  setReportById: function( req, res ) {

    // request input
    if ( !req.param( 'report' ) ) {
      return res.json(401, { err: 'report required!' });
    }

    // get report
    var $report = req.param( 'report' );

    // update report
    StockReport
      .update( { id: $report.id }, $report )
      .exec( function( err, report ){

        // return error
        if ( err ) return res.negotiate( err );

        // clone to update
        $report = report[0].toObject();

        // get report by organization_id
        StockLocation
          .find( { report_id: $report.id } )
          // .populate('stock')
          .populateAll()
          .exec( function( err, locations ){

            // return error
            if (err) return res.negotiate( err );

            // add locations ( associations included )
            $report.stocklocations = locations;

            // return Report
            return res.json( 200, $report );

        });

      });

  },

  // removes reports with stock_warehouse_id
  removeReportLocation: function( req, res ) {

    // request input
    if ( !req.param( 'stock_warehouse_id' ) ) {
      return res.json(401, { err: 'stock_warehouse_id required!' });
    }

    // stock_warehouse_id
    var stock_warehouse_id = req.param( 'stock_warehouse_id' );

    // uncomment to test diff dates
    // var inactivation_date = moment('2017-10-03').startOf('month').format('YYYY-MM-DD');

    var inactivation_date = moment().format();
    var month = moment().month(),
        year  = moment().year();

    // update report
    StockLocation
      .update( { stock_warehouse_id: stock_warehouse_id }, { date_inactivated: new Date(inactivation_date), active: false })
      .exec( function( err, stocklocations ){

        // return error
        if ( err ) return res.negotiate( err );

        // null all reports locations, else only this month and above
        var ifCreatedThisMonth = stocklocations[0]&&moment(stocklocations[0].createdOn).format('YYYY-MM') === moment().format('YYYY-MM');

        if (ifCreatedThisMonth) {
          var updateQuery = { stock_warehouse_id: stock_warehouse_id };
        } else {
          var updateQuery = { stock_warehouse_id: stock_warehouse_id, report_year: year, report_month: { ">=": month } };
        }

        StockLocation
            .update( updateQuery, { report_id: null })
            .exec(function (err, stocklocations) {

              // return error
              if (err) return res.negotiate(err);
              // return Report
              return res.json(200, stocklocations);

            });

        });

  }

};

