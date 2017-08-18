

function renderChart(params) {

  // exposed variables
  var attrs = {
    svgWidth: 1000,
    svgHeight: 500,
    marginTop: 50,
    marginBottom: 50,
    marginRight: 50,
    marginLeft: 50,
    container: 'body',
    data: null,
    spacing : {
      bar : 3,
      unit : 20,
      category : 30
    }
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

      //calculated properties
      var calc = {}
      calc.chartLeftMargin = attrs.marginLeft;
      calc.chartTopMargin = attrs.marginTop;
      calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
      calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;

      //drawing containers
      var container = d3.select(this);
      debugger;
      //add svg
      var svg = patternify({ container: container, selector: 'svg-chart-container', elementTag: 'svg' })
                .attr('width', attrs.svgWidth)
                .attr('height', attrs.svgHeight)
                .style('font-family','Helvetica');
              //.attr("viewBox", "0 0 " + attrs.svgWidth + " " + attrs.svgHeight)
              //.attr("preserveAspectRatio", "xMidYMid meet")

      //add container g element
      var chart = patternify({ container: svg, selector: 'chart', elementTag: 'g' })
          chart.attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ')');

    
      //########################################  SCALES ############################################

      var scales = {};
      

      scales.yMax = d3.max(attrs.data.result, function (d) { return Math.max(d.classicalrating, d.bulletrating, d.blitzrating) });
      scales.yMin = d3.min(attrs.data.result, function (d) { return Math.min(d.classicalrating, d.bulletrating, d.blitzrating) });
     
      scales.xScale = d3.scalePoint()
        .domain(attrs.data.result.map(function (d) { return d.fullname }))
        .range([0, calc.chartWidth]);

      scales.yScale = d3.scaleLinear()
        .domain([scales.yMin*0.9,  scales.yMax*1.1])
        .range([calc.chartHeight, 0]);

     
     //########################################  AXIS ############################################

      var axis = {};

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
     
      var unitGroupWidth = (ratingCategoryGroupWidth - attrs.spacing.category - attrs.spacing.unit)/ attrs.data.units.length;
      var maxMemberNumber = GetMaxMemberNumberInUnits(attrs.data.result);
      var ratingBarWidth = (unitGroupWidth - attrs.spacing.unit )/ maxMemberNumber -attrs.spacing.bar;



      var ratingCategoryGroups = patternify({ container: chart, 
                                              selector: 'category-group', 
                                              elementTag: 'g', 
                                              data: d=> {return  attrs.data.ratingCategories.map(c => c.name) }
                                            });



      ratingCategoryGroups.attr('transform', function (d, i) {
        return 'translate(' + (ratingCategoryGroupWidth * i)  + ',' + 0 + ')'
      });

      ratingCategoryGroups.append('rect').attr('height', calc.chartHeight).attr('width', ratingCategoryGroupWidth).attr('opacity', (d, i) => 0.1 / (1 + i))

      ratingCategoryGroups.append("text")
                          .text(function(d){ return  attrs.data.ratingCategories.filter(v => v.name == d)[0].desc; })
                          .attr("fill", function (d) { return "#769656" })
                          .attr('alignment-baseline','hanging')
                          .attr('text-anchor','middle')
                          .style('font-weight', 'bold')
                          .attr('font-size',50)
                          .attr('y',40)
                          .attr('opacity',0.4)
                          .attr('x', ratingCategoryGroupWidth/2);


      // ########################################  Unit Groups ############################################

      var unitGroups = patternify({
        container: ratingCategoryGroups,
        selector: 'unit-group',
        elementTag: 'g',
        data: d => { return attrs.data.units.map(u => { return { unit: u, category: d } }) }
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
            debugger;
            return JSON.parse(JSON.stringify(attrs.data.result)).filter(item => item.unit == d.unit).map(function (userItem) {
               debugger;
            return Object.assign(userItem, d)
          })
        }
      })
      ratingBars.each(d => console.log(d))

       ratingBars.attr('transform', function (d, i) {
        return 'translate(' + (i *( ratingBarWidth + attrs.spacing.bar)) + ',' + scales.yScale(d[d.category]) + ')'
      });


      ratingBars.append("rect")
        .attr("width", ratingBarWidth)
        .attr("height", function (d) { return calc.chartHeight - scales.yScale(d[d.category]); })
        .attr("fill", function (d) { return "#769656" });


      ratingBars.append("text")
         .text(d => d[d.category])
        .attr("height", function (d) { return calc.chartHeight - scales.yScale(d[d.category]); })
        .attr("fill", function (d) { return "grey" })
        .attr('text-allignment','hanging')
        .attr('y',18)
        .attr('transform','rotate(-90)')













      function GetMaxMemberNumberInUnits(initialData) {
        var nestedData = d3.nest().key(function (d) { return d.unit; })
          .rollup(function (leaves) {
            return leaves.length;
          }).entries(initialData);

        var maxMemberNumber = Math.max.apply(Math, nestedData.map(function (o) { return o.value; }))



        return maxMemberNumber;
      }



      // smoothly handle data updating
      updateData = function () {


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
    attrs.data = value;
    if (typeof updateData === 'function') {
      updateData();
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
