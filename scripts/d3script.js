

function renderChart(params) {

  // exposed variables
  var attrs = {
    id: 'id' + Math.floor((Math.random() * 1000000)),
    svgWidth: 1000,
    svgHeight: 800,
    marginTop: 50,
    marginBottom: 50,
    marginRight: 50,
    marginLeft: 50,
    container: 'body',
    firstTime: true,
    data: null,
    spacing: {
      bar: 2,
      unit: 30,
      category: 3
    },
    slicesOpacity: 0.3,
    colors: {
      point: "grey",
      fullname: "#4B4948",
      offline: "grey",
      online: "lightgreen",
      categorytext: "",
      unitslegend: "#4B4948",
    },
    tooltipRows: [{ left: "User", right: "{fullname}" },
    { left: "Blitz", right: "{blitzrating}" },
    { left: "Bullet", right: "{bulletrating}" },
    { left: "Classical", right: "{classicalrating}" },
    { left: "Unit", right: "{unit}" }]
  };

  /*############### IF EXISTS OVERWRITE ATTRIBUTES FROM PASSED PARAM  #######  */

  var attrKeys = Object.keys(attrs);
  attrKeys.forEach(function (key) {
    if (params && params[key]) {
      attrs[key] = params[key];
    }
  })

  //innerFunctions which will update visuals
  var updateData;

  //main chart object
  var main = function (selection) {
    selection.each(function scope() {

      var scales = {};
      var axis = {};

      //calculated properties
      var calc = {}
      calc.chartLeftMargin = attrs.marginLeft;
      calc.chartTopMargin = attrs.marginTop;
      calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
      calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;

      //###################################### color ##########################################################

      var METRONIC_DARK_COLORS = ["#1BBC9B", "#E7505A", "#E87E04", "#5E738B", "#578EBE"];

      // var color = d3.scaleOrdinal(d3.schemeCategory20b);
      var color = d3.scaleOrdinal().range(METRONIC_DARK_COLORS);

      //###################################### color ##########################################################



      //drawing containers
      var container = d3.select(this);
      container.html('');

      //add svg
      var svg = patternify({ container: container, selector: 'svg-chart-container', elementTag: 'svg' })
        .attr('width', attrs.svgWidth)
        .attr('height', attrs.svgHeight)
        .attr('overflow', 'visible')
        .style('font-family', 'Helvetica')
        .attr("viewBox", "0 0 " + attrs.svgWidth + " " + attrs.svgHeight)
        .attr("preserveAspectRatio", "xMidYMid meet");


      d3.select(window).on('resize.' + attrs.id, function () {
        setDimensions();
      })


      function setDimensions() {
        var width = container.node().getBoundingClientRect().width;
       
        main.svgWidth(width);
        container.call(main);


      }

      if (attrs.firstTime) {
        attrs.firstTime = false;
        setDimensions();
      }


      //add container g element
      var chart = patternify({ container: svg, selector: 'chart', elementTag: 'g' })
      chart.attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ')');


      //################################   FILTERS  &   SHADOWS  ##################################

      // Add filters ( Shadows)
      var defs = svg.append("defs");

      calc.dropShadowUrl = "id";
      calc.filterUrl = `url(#id)`;
      //Drop shadow filter
      var dropShadowFilter = defs
        .append("filter")
        .attr("id", 'id')
        .attr("height", "130%");
      dropShadowFilter
        .append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 5)
        .attr("result", "blur");
      dropShadowFilter
        .append("feOffset")
        .attr("in", "blur")
        .attr("dx", 2)
        .attr("dy", 4)
        .attr("result", "offsetBlur");

      dropShadowFilter
        .append("feFlood")
        .attr("flood-color", "black")
        .attr("flood-opacity", "0.4")
        .attr("result", "offsetColor");
      dropShadowFilter
        .append("feComposite")
        .attr("in", "offsetColor")
        .attr("in2", "offsetBlur")
        .attr("operator", "in")
        .attr("result", "offsetBlur");

      var feMerge = dropShadowFilter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "offsetBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");

      // ################################ FILTERS  &   SHADOWS  END ##################################

      //########################################  SCALES ############################################

      //var scales = {};


      scales.yMax = d3.max(attrs.data.result, function (d) { return Math.max(d.classicalrating, d.bulletrating, d.blitzrating) });
      scales.yMin = d3.min(attrs.data.result, function (d) { return Math.min(d.classicalrating, d.bulletrating, d.blitzrating) });


      scales.xScale = d3.scalePoint()
        .domain(attrs.data.result.map(function (d) { return d.fullname }))
        .range([0, calc.chartWidth]);

      scales.yScale = d3.scaleLinear()
        .domain([scales.yMin * 0.8, scales.yMax * 1.1])
        .range([calc.chartHeight, 0]);

      attrs.data.ratingClasses[0].rangeStart = scales.yMin * 0.8;
      //########################################  AXIS ############################################

      //var axis = {};

      axis.yAxis = d3.axisLeft().scale(scales.yScale).tickSize(-calc.chartWidth);
      axis.xAxis = d3.axisBottom().scale(scales.xScale).tickSize(-calc.chartHeight);

      // var xAxisGroup = patternify({ container: chart, selector: 'x-axis-group', elementTag: 'g' })
      //     xAxisGroup.attr("transform", "translate(0," + calc.chartHeight + ")")
      //               .attr('stroke-width', '2');


      var yAxisGroup = patternify({ container: chart, selector: 'y-axis-group', elementTag: 'g' })
      yAxisGroup.attr('stroke-width', '2');

      // xAxisGroup.transition().duration(attrs.transTimeOut).call(xAxis);
      yAxisGroup.call(axis.yAxis);

      chart.selectAll(".tick line")
        .attr('stroke', 'lightgrey')
        .attr('stroke-width', '0.3px')
        .attr('stroke-dasharray', '5,3');

      chart.selectAll('.domain')
        .attr('stroke-width', '0.1px')
        .attr('stroke', 'lightgrey');



      // ########################################  Category Groups ############################################


      // count width for elements 
      var ratingCategoryGroupWidth = calc.chartWidth / attrs.data.ratingCategories.length;

      var unitGroupWidth = (ratingCategoryGroupWidth - attrs.spacing.category - attrs.spacing.unit) / attrs.data.units.length;
      var maxMemberNumber = GetMaxMemberNumberInUnits(attrs.data.result);
      var ratingBarWidth = (unitGroupWidth - attrs.spacing.unit) / maxMemberNumber - attrs.spacing.bar;



      var ratingCategoryGroups = patternify({
        container: chart,
        selector: 'category-group',
        elementTag: 'g',
        data: d => { return attrs.data.ratingCategories.map(c => c.name) }
      });



      ratingCategoryGroups.attr('transform', function (d, i) {
        return 'translate(' + (ratingCategoryGroupWidth * i) + ',' + 0 + ')'
      });


      var ratingCategoryRects = patternify({
        container: ratingCategoryGroups,
        selector: 'category-rect',
        elementTag: 'rect',
        data: d => { return attrs.data.ratingCategories.map(c => c.name).filter(v => v == d) }
      });


      ratingCategoryRects.attr('height', calc.chartHeight)
        .attr('width', ratingCategoryGroupWidth)
        .attr('opacity', function (d) {
          var i = attrs.data.ratingCategories.findIndex(x => x.name == d);
          return 0.1 / (1 + i);
        });


      //ratingCategoryGroups.append('rect').attr('height', calc.chartHeight).attr('width', ratingCategoryGroupWidth).attr('opacity', (d, i) => 0.1 / (1 + i))


      var ratingCategoryTexts = patternify({
        container: ratingCategoryGroups,
        selector: 'category-text',
        elementTag: 'text',
        data: d => { return attrs.data.ratingCategories.map(c => c.name).filter(v => v == d) }
      });


      ratingCategoryTexts
        .text(function (d) { return attrs.data.ratingCategories.filter(v => v.name == d)[0].desc; })
        .attr("fill", function (d) { return "#769656" })
        .attr('alignment-baseline', 'hanging')
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .attr('font-size', 50)
        .attr('y', 10)
        .attr('opacity', 0.4)
        .attr('x', ratingCategoryGroupWidth / 2);



      // ########################################  CLASSES  ############################################

      var ratingClassGroup = patternify({
        container: chart,
        selector: 'classes-group',
        elementTag: 'g'
      });

      ratingClassGroup.attr('transform', function () {
        return 'translate(' + (calc.chartWidth - 15) + ',' + 0 + ')'
      });


      var ratingClasses = patternify({
        container: ratingClassGroup,
        selector: 'class-group',
        elementTag: 'g',
        data: function () { return attrs.data.ratingClasses.filter(x => x.rangeEnd <= scales.yScale.domain()[1]) }
      });


      ratingClasses.attr('transform', function (d) {
        if (d.rangeStart > 0) {
          return `rotate(-90) translate (${-scales.yScale(d.rangeStart)},0)`;
        }
        else {
          return `rotate(-90) translate (${-calc.chartHeight},0)`;
        }
      });

      var ratingClassNames = patternify({
        container: ratingClasses,
        selector: 'class-name',
        elementTag: 'text',
        data: d => [d]
      });

      ratingClassNames.text(d => d.name)
        .attr('x', '10')
        .attr('y', '10')
        .attr("fill", attrs.colors.unitslegend)
        .attr('text-anchor', 'start')
        .style('font-size', '8px')
        .style('text-transform', 'uppercase');

      var ratingClassLines = patternify({
        container: ratingClasses,
        selector: 'class-line',
        elementTag: 'polyline',
        data: d => [d]
      });

      ratingClassLines.style("stroke", function (d) {
        return 'grey';
      })
        .style('stroke-width', '2px')
        .style("fill", "none")
        .attr("points", function (d) {
          return `00,10,00,15,${scales.yScale(scales.yScale.domain()[1] - (d.rangeEnd - d.rangeStart))},15,${scales.yScale(scales.yScale.domain()[1] - (d.rangeEnd - d.rangeStart))},10`
        });


      // ########################################  Unit Groups ############################################

      var unitGroups = patternify({
        container: ratingCategoryGroups,
        selector: 'unit-group',
        elementTag: 'g',
        data: d => {

          var usersData = JSON.parse(JSON.stringify(attrs.data.result));

          var sortedUserData = usersData.sort(function (x, y) {
            return d3.descending(x[d], y[d]);
          });

          let uniqueUnits = [...new Set(sortedUserData.map(item => item.unit))];



          //var unitAvgValue = d3.mean(selectedData,function(d) { return +d.value});



          return uniqueUnits.map(u => {
            return {
              unit: u,
              category: d,
              unitAvg: d3.mean(JSON.parse(JSON.stringify(attrs.data.result)).filter(x => x.unit == u), function (i) { return +i[d] }),
              // unitMemberNumber : JSON.parse(JSON.stringify(attrs.data.result)).filter(x => x.unit == u && x[d] >= this.$unitAvg).length
            }
          })
        }
      });

      unitGroups.attr('transform', function (d, i) {
        return 'translate(' + (unitGroupWidth * i) + ',' + 0 + ')'
      });


      var unitLegendGroup = patternify({
        container: unitGroups,
        selector: 'unit-legend-group',
        elementTag: 'g',
        data: d => [d]
      });

      unitLegendGroup.attr('transform', d => `translate(0,${calc.chartHeight})`);




      unitLegendLine = patternify({
        container: unitLegendGroup,
        selector: 'unit-legend-line',
        elementTag: 'polyline',
        data: d => [d]
      });


      unitLegendLine
        .style("stroke", function (d) {
          return color(d.unit);
        })
        .style('stroke-width', '2px')
        .style("fill", "none")
        .attr("points", `00,00,00,10,${unitGroupWidth},10,${unitGroupWidth},00`);



      var unitLegendTexts = patternify({
        container: unitLegendGroup,
        selector: 'unit-legend-text',
        elementTag: 'text',
        data: d => [d]
      });


      unitLegendTexts.text(function (d) { return d.unit; })
        .attr("fill", attrs.colors.unitslegend)
        .attr('text-anchor', 'middle')
        .style('font-size', '8px')
        .attr('y', '8')
        .attr('x', unitGroupWidth / 2)
        .style('text-transform', 'uppercase');



      // unitGroups.append('rect').attr('height', calc.chartHeight).attr('width', unitGroupWidth).attr('opacity', (d, i) => 0.2 / (1 + i))
      // unitGroups.each((d,i)=>console.log(d));

      // ########################################  Bar ############################################

      var ratingBars = patternify({
        container: unitGroups,
        selector: 'rating-bar',
        elementTag: 'g',
        data: d => {

          var res = JSON.parse(JSON.stringify(attrs.data.result)).filter(item => item.unit == d.unit).map(function (userItem) {
            return Object.assign(userItem, d)
          });

          return res.sort(function (x, y) {
            return d3.descending(x[d.category], y[d.category]);
          })
        }
      })
      //ratingBars.each(d => console.log(d))

      ratingBars.attr('transform', function (d, i) {
        return 'translate(' + (i * (ratingBarWidth + attrs.spacing.bar)) + ',' + (scales.yScale(d[d.category])) + ')'
      });


      // ----------------------------------------------------------
      var ratingBarRects = patternify({
        container: ratingBars,
        selector: 'rating-bar-rect',
        elementTag: 'rect',
        data: d => [d]
      });



      // rating 
      ratingBarRects
        .attr("width", ratingBarWidth)
        .attr("height", function (d) { return calc.chartHeight - scales.yScale(d[d.category]); })
        .attr("fill", function (d) {
          return color(d.unit);
        });


      // var ratingBarRects = ratingBars.selectAll('.rating-bar-rect').data(d => [d]);

      // var ratingBarRectsExit = ratingBarRects.exit().remove();

      // ratingBarRects.enter()
      //   .append('rect')
      //   .attr("width", ratingBarWidth)
      //   .attr('y', function (d) { return calc.chartHeight - scales.yScale(d[d.category]); })
      //   .attr("height", function (d) { return 0; })
      //   .merge(ratingBarRects)

      //   .attr('y', function (d) { return calc.chartHeight - scales.yScale(d[d.category]) })
      //   .attr("height", function (d) { return 0 })

      //   //.transition().duration(1000)
      //   .attr('class', 'rating-bar-rect')
      //   .attr("width", ratingBarWidth)
      //   .attr('y', 0)
      //   .attr("height", function (d) { return calc.chartHeight - scales.yScale(d[d.category]); })
      //   .attr("fill", function (d) {
      //     return color(d.unit);
      //   });


      //---------------------------------------------------------------
      var ratingBarStatusRects = patternify({
        container: ratingBars,
        selector: 'rating-bar-status-rect',
        elementTag: 'rect',
        data: d => [d]
      });


      // offline-online
      ratingBarStatusRects
        .attr("width", ratingBarWidth)
        .attr("height", 10)
        .attr('rx', '5')
        .attr("fill", function (d) {
          return d.isOnline ? attrs.colors.online : attrs.colors.offline;
        });


      // var ratingBarStatusRects = ratingBars.selectAll('.rating-bar-status-rect').data(d => [d]);
      // var ratingBarStatusRectsExit = ratingBarStatusRects.exit().remove();
      // ratingBarStatusRects.enter()
      //   .append('rect')
      //   .merge(ratingBarStatusRects)
      //   .attr('class', 'rating-bar-status-rect')
      //   .attr("width", ratingBarWidth)
      //   .attr("height", 10)
      //   .attr('rx', '5')
      //   .attr("fill", function (d) {
      //     return d.isOnline ? attrs.colors.online : attrs.colors.offline;
      //   });



      //---------------------------------------------------------------
      var ratingBarPointTextGroups = patternify({
        container: ratingBars,
        selector: 'rating-bar-point-text-group',
        elementTag: 'g',
        data: d => [d]
      });

      ratingBarPointTextGroups.attr('transform', d => `translate(${ratingBarWidth},-5)`);

      var ratingBarPointTexts = patternify({
        container: ratingBarPointTextGroups,
        selector: 'rating-bar-point-text',
        elementTag: 'text',
        data: d => [d]
      });

      // point text
      ratingBarPointTexts
        .text(d => d[d.category])
        .attr("fill", attrs.colors.point)
        .style('font-size', '8px')
        .attr('transform', 'rotate(-90)')

      var ratingBarNameTextGroups = patternify({
        container: ratingBars,
        selector: 'rating-bar-name-text-group',
        elementTag: 'g',
        data: d => [d]
      });

      ratingBarNameTextGroups.attr('transform', d => `translate(0,${calc.chartHeight - scales.yScale(d[d.category]) + 25})`);


      var ratingBarNameTexts =
        patternify({
          container: ratingBarNameTextGroups,
          selector: 'rating-bar-name-text',
          elementTag: 'text',
          data: d => [d]
        });


      // fullname text
      ratingBarNameTexts.text(d => d.fullname)
        .attr('x', ratingBarWidth / 1)
        .attr("fill", attrs.colors.fullname)
        .attr('text-anchor', 'end')
        .style('font-size', '10px')
        .attr('transform', d => `rotate(-45)`);

      // ################################## avg lines  ##################################

      var unitAvgFlags = patternify({
        container: unitGroups,
        selector: 'unit-group-avg-flag-group',
        elementTag: 'g',
        data: d => [d]
      });

      unitAvgFlags.attr('transform', d => `translate(-10,${scales.yScale(d.unitAvg)})`);



      unitAvgFlags.append('rect')
        .attr("width", 20)
        .attr("height", 10)
        .attr('x', -20)
        .attr("fill", function (d) {
          return color(d.unit);
        });




      unitAvgFlags.append('rect')
        .attr("width", Math.sqrt(50))
        .attr("height", Math.sqrt(50))
        .attr("fill", function (d) {
          return color(d.unit);
        })
        .attr('transform', `rotate(45) `);


      unitAvgFlags.append('text')
        .text(d => { return Math.floor(d.unitAvg) })

        .attr('x', -20)
        .attr('y', 8)
        .attr("fill", function (d) {
          return 'white';
        })
        .attr('font-size', 8);

      // unitAvgLines
      //   .style("stroke", function (d, i) {  return 'black'; })
      //   .style("stroke-width", 1)
      //   .style("stroke-dasharray","5,5")
      //   .attr("x1",  -30 )
      //   .attr("y1", function(d) { return  scales.yScale(d.unitAvg) })
      //   .attr("x2", function (d, i) { return unitGroupWidth-10; } )
      //   .attr("y2", function(d) { return scales.yScale(d.unitAvg) });          



      // //################################## legend ######################################

      // var legend = patternify({ container: chart, selector: 'legend-group', elementTag: 'g' });

      // var legendItems = patternify({ container: legend, selector: 'legend-item', elementTag: 'g', data: attrs.data.units });


      // var legendLines = patternify({
      //   container: legendItems,
      //   selector: 'legend-line',
      //   elementTag: 'line',
      //   data: d => { return attrs.data.units.filter(u => u == d) }
      // });




      // legendLines
      //   .style("stroke", function (d, i) { return color(d); })
      //   .style("stroke-width", 4)
      //   .attr("x1", function (d, i) { return 0; })
      //   .attr("y1", attrs.marginTop)
      //   .attr("x2", function (d, i) { return 30; })
      //   .attr("y2", attrs.marginTop)
      //   .attr("class", "legend-line");

      // var legendTexts = patternify({
      //   container: legendItems,
      //   selector: 'legend-text',
      //   elementTag: 'text',
      //   data: d => { return attrs.data.units.filter(u => u == d) }
      // });


      // legendTexts
      //   .text(function (d, i) { return d; })
      //   .attr("x", function (d, i) { return 35; })
      //   .attr("y", attrs.marginTop + 5)
      //   .attr("class", "legend-text");



      // var startX = ratingCategoryGroupWidth + ((ratingCategoryGroupWidth - (attrs.data.units.length * 70)) / 2);

      // legendItems.each(function (d, i, arr) {
      //   var wrapper = d3.select(this);
      //   var text = wrapper.select('text');
      //   var bbox = text.node().getBBox();
      //   wrapper.attr('transform', 'translate(' + startX + ',-30)');
      //   startX += bbox.width + 50;
      // })

      // #####################################  events ############################################################

      ratingBars.on('mouseenter', function (d) {
        debugger;
        ratingBarRects.attr('filter', calc.filterUrl)
          .filter(function (v) {

            return v.id != d.id;
          })
          .attr('filter', 'none')
          .attr('opacity', attrs.slicesOpacity);

        ratingBarStatusRects.attr('filter', calc.filterUrl)
          .filter(function (v) {

            return v.id != d.id;
          })
          .attr('filter', 'none')
          .attr('opacity', attrs.slicesOpacity);

        unitAvgFlags.attr('opacity', attrs.slicesOpacity);



        var x = d3.mouse(this)[0];
        displayTooltip(
          true,
          chart,
          attrs.tooltipRows,
          'bottom',
          GetTooltipPosition(d).x,
          GetTooltipPosition(d).y,
          d,
          calc.dropShadowUrl
        );



      })
        .on('mouseout', function (d) {
          ratingBarRects.attr('opacity', 1).attr('filter', 'none');
          ratingBarStatusRects.attr('opacity', 1).attr('filter', 'none');
          unitAvgFlags.attr('opacity', 1).attr('filter', 'none');
          displayTooltip(false, chart);
        });




      ratingClasses.on('mouseenter', function (d) {
        debugger;
        ratingBarRects.attr('filter', calc.filterUrl)

          .filter(function (v) {
            debugger;
            return v[v.category] < d.rangeStart || v[v.category] > d.rangeEnd;
          })
          .attr('filter', 'none')
          .attr('opacity', attrs.slicesOpacity);

        ratingBarStatusRects.attr('filter', calc.filterUrl)
          .filter(function (v) {

            return v[v.category] < d.rangeStart || v[v.category] > d.rangeEnd;
          })
          .attr('filter', 'none')
          .attr('opacity', attrs.slicesOpacity);

        unitAvgFlags.attr('opacity', attrs.slicesOpacity);

      })
        .on('mouseout', function (d) {
          ratingBarRects.attr('opacity', 1).attr('filter', 'none');
          ratingBarStatusRects.attr('opacity', 1).attr('filter', 'none');
          unitAvgFlags.attr('opacity', 1).attr('filter', 'none');
        });

      function GetMaxMemberNumberInUnits(initialData) {
        var nestedData = d3.nest().key(function (d) { return d.unit; })
          .rollup(function (leaves) {
            return leaves.length;
          }).entries(initialData);

        var maxMemberNumber = Math.max.apply(Math, nestedData.map(function (o) { return o.value; }))



        return maxMemberNumber;
      }



      function GetTooltipPosition(userInfo) {
        var position = {
          x: 0,
          y: 0
        };




        var sortedData = attrs.data.result.filter(x => x.unit == userInfo.unit)
          .sort(function (x, y) {
            return d3.descending(x[userInfo.category], y[userInfo.category]);
          });


        var usersData = JSON.parse(JSON.stringify(attrs.data.result));

        var sortedUserData = usersData.sort(function (x, y) {
          return d3.descending(x[userInfo.category], y[userInfo.category]);
        });

        let uniqueUnits = [...new Set(sortedUserData.map(item => item.unit))];


        position.y = scales.yScale(userInfo[userInfo.category]) - 50;

        position.x = ratingCategoryGroupWidth * (attrs.data.ratingCategories.findIndex(x => x.name == userInfo.category)) +
          unitGroupWidth * uniqueUnits.indexOf(userInfo.unit) +
          ratingBarWidth * sortedData.findIndex(x => x.username == userInfo.username);




        return position;

      }



      // smoothly handle data updating
      updateData = function (newdata) {

        newdata.result.forEach(function (newuser) {
          var olduser = attrs.data.result.filter(u => u.id == newuser.id);

          olduser.id = newuser.id,
            olduser.isOnline = newuser.isOnline,
            olduser.username = newuser.username,
            olduser.blitzrating = newuser.blitzrating,
            olduser.bulletrating = newuser.bulletrating,
            olduser.classicalrating = newuser.classicalrating,
            olduser.fullname = newuser.fullname,
            olduser.unit = newuser.unit
        });

        main.run();

      }



      //#########################################  UTIL FUNCS ##################################

      //enter exit update pattern principle
      function patternify(params) {
        var container = params.container;
        var selector = params.selector;
        var elementTag = params.elementTag;
        var data = params.data || [selector];

        // pattern in action
        var selection = container.selectAll('.' + selector).data(data)
        selection.exit().remove();
        selection = selection.enter().append(elementTag).merge(selection)
        selection.attr('class', selector);
        return selection;
      }



      function debug() {
        if (attrs.isDebug) {
          //stringify func
          var stringified = scope + "";

          // parse variable names
          var groupVariables = stringified
            //match var x-xx= {};
            .match(/var\s+([\w])+\s*=\s*{\s*}/gi)
            //match xxx
            .map(d => d.match(/\s+\w*/gi).filter(s => s.trim()))
            //get xxx
            .map(v => v[0].trim())

          //assign local variables to the scope
          groupVariables.forEach(v => {
            main['P_' + v] = eval(v)
          })
        }
      }

      debug();
    });
  };

  //dinamic functions
  Object.keys(attrs).forEach(key => {
    // Attach variables to main function
    return main[key] = function (_) {
      var string = `attrs['${key}'] = _`;
      if (!arguments.length) { return eval(` attrs['${key}'];`); }
      eval(string);
      return main;
    };
  });

  //set attrs as property
  main.attrs = attrs;

  //debugging visuals
  main.debug = function (isDebug) {
    attrs.isDebug = isDebug;
    if (isDebug) {
      if (!window.charts) window.charts = [];
      window.charts.push(main);
    }
    return main;
  }

  //exposed update functions
  main.data = function (value) {

    if (!arguments.length) return attrs.data;
    if (typeof updateData === 'function') {
      updateData(value);
    } else {
      attrs.data = value;
    }
    return main;
  }

  // run  visual
  main.run = function () {
    d3.selectAll(attrs.container).call(main);
    return main;
  }

  return main;
}
