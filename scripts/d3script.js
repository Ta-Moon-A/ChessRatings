

function renderChart(params) {

  // exposed variables
  var attrs = {
    svgWidth: 1000,
    svgHeight: 600,
    marginTop: 50,
    marginBottom: 150,
    marginRight: 50,
    marginLeft: 50,
    container: 'body',
    data: null,
    spacing: {
      bar: 3,
      unit: 20,
      category: 30
    },
    slicesOpacity: 0.3,
    colors: {
      point: "grey",
      fullname: "#4B4948",
      offline: "grey",
      online: "lightgreen",
      categorytext: ""
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
      debugger;


      var scales  = {};
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

      //add svg
      var svg = patternify({ container: container, selector: 'svg-chart-container', elementTag: 'svg' })
        .attr('width', attrs.svgWidth)
        .attr('height', attrs.svgHeight)
        .attr('overflow', 'visible')
        .style('font-family', 'Helvetica')
        .attr("viewBox", "0 0 " + attrs.svgWidth + " " + attrs.svgHeight)
        .attr("preserveAspectRatio", "xMidYMid meet");

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
        .domain([scales.yMin * 0.8, scales.yMax * 1.2])
        .range([calc.chartHeight, 0]);


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

      ratingCategoryGroups.append('rect').attr('height', calc.chartHeight).attr('width', ratingCategoryGroupWidth).attr('opacity', (d, i) => 0.1 / (1 + i))

      ratingCategoryGroups.append("text")
        .text(function (d) { return attrs.data.ratingCategories.filter(v => v.name == d)[0].desc; })
        .attr("fill", function (d) { return "#769656" })
        .attr('alignment-baseline', 'hanging')
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .attr('font-size', 50)
        .attr('y', 40)
        .attr('opacity', 0.4)
        .attr('x', ratingCategoryGroupWidth / 2);


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


          return uniqueUnits.map(u => { return { unit: u, category: d } })
        }
      });

      unitGroups.attr('transform', function (d, i) {
        return 'translate(' + (unitGroupWidth * i) + ',' + 0 + ')'
      });

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


      // rating 
      ratingBars.append("rect")
        .attr("width", ratingBarWidth)
        .attr("height", function (d) { return calc.chartHeight - scales.yScale(d[d.category]); })
        .attr("fill", function (d) {
          return color(d.unit);
        });


      // offline-online
      ratingBars.append("rect")
        .attr("width", ratingBarWidth)
        .attr("height", 10)
        .attr("fill", function (d) {
          return d.isOnline ? attrs.colors.online : attrs.colors.offline;
        });


      // point text
      ratingBars
        .append('g')
        .attr('transform', d => `translate(${ratingBarWidth},-5)`)
        .append("text")
        .text(d => d[d.category])
        .attr("fill", attrs.colors.point)
        .style('font-size', '12px')
        .attr('transform', 'rotate(-90)')


      // fullname text
      ratingBars
        .append('g')
        .attr('transform', d => `translate(0,${calc.chartHeight - scales.yScale(d[d.category]) + 20})`)
        .append("text")
        .text(d => d.fullname)
        .attr('x', ratingBarWidth / 2)
        .attr("fill", attrs.colors.fullname)
        .attr('text-anchor', 'end')
        .style('font-size', '10px')
        .attr('transform', d => `rotate(-45)`);

      //################################## legend ######################################

      var legend = patternify({ container: chart, selector: 'legend-group', elementTag: 'g' });

      var legendItems = patternify({ container: legend, selector: 'legend-item', elementTag: 'g', data: attrs.data.units });


      legendItems.append('line')
        .style("stroke", function (d, i) { return color(d); })
        .style("stroke-width", 4)
        .attr("x1", function (d, i) { return 0; })
        .attr("y1", attrs.marginTop)
        .attr("x2", function (d, i) { return 30; })
        .attr("y2", attrs.marginTop)
        .attr("class", "legend-line");


      legendItems.append('text')
        .text(function (d, i) { return d; })
        .attr("x", function (d, i) { return 35; })
        .attr("y", attrs.marginTop + 5)
        .attr("class", "legend-text");

      debugger;
      var startX = ratingCategoryGroupWidth + ((ratingCategoryGroupWidth - (attrs.data.units.length * 70)) / 2);

      legendItems.each(function (d, i, arr) {
        var wrapper = d3.select(this);
        var text = wrapper.select('text');
        var bbox = text.node().getBBox();
        wrapper.attr('transform', 'translate(' + startX + ',-30)');
        startX += bbox.width + 50;
      })

      // #####################################  events ############################################################

      ratingBars.on('mouseenter', function (d) {
        ratingBars.attr('filter', calc.filterUrl)
          .filter(function (v) {

            return v.id != d.id;
          })
          .attr('filter', 'none')
          .attr('opacity', attrs.slicesOpacity);


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
          ratingBars.attr('opacity', 1).attr('filter', 'none');
          displayTooltip(false, chart);
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

      function DrawChart(attrs, calc)
      {
     
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
