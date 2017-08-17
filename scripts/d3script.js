

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
    data: null
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
      var svg = d3.select(this)
        .append('svg')//patternify({ container: container, selector: 'svg-chart-container', elementTag: 'svg' })
        .attr('width', attrs.svgWidth)
        .attr('height', attrs.svgHeight);
      // .attr("viewBox", "0 0 " + attrs.svgWidth + " " + attrs.svgHeight)
      // .attr("preserveAspectRatio", "xMidYMid meet")

      //add container g element
      var chart = patternify({ container: svg, selector: 'chart', elementTag: 'g' })
      chart.attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ')');

      var color = d3.scaleOrdinal(d3.schemeCategory20b);

      debugger;
      var xScale = d3.scalePoint()
        .domain(attrs.data.result.map(function (d) { return d.fullname }))
        .range([0, calc.chartWidth]);

      var yScale = d3.scaleLinear()
        .domain(d3.extent(attrs.data.result, function (d) { return Math.max(d.classicalrating, d.bulletrating, d.blitzrating) }))
        .range([calc.chartHeight, 0]);

      var yAxis = d3.axisLeft().scale(yScale).tickSize(-calc.chartWidth);
      var xAxis = d3.axisBottom().scale(xScale).tickSize(-calc.chartHeight);


      chart.append("g")
        .attr("transform", "translate(0," + calc.chartHeight + ")")
        .attr('stroke-width', '2')
        .attr("class", "xaxis");


      chart.append("g")
        .attr('stroke-width', '2')
        .attr("class", "yaxis");

      chart.selectAll("g .xaxis").transition().duration(attrs.transTimeOut).call(xAxis);
      chart.selectAll("g .yaxis").transition().duration(attrs.transTimeOut).call(yAxis);
      
       chart.selectAll(".tick line")
                    .attr('stroke', 'lightgrey')
                    .attr('stroke-width', '0.7px')
                    .attr('stroke-dasharray', '5,3');

                chart.selectAll('.domain')
                    .attr('stroke-width', '0.1px')
                    .attr('stroke', 'lightgrey');

      // smoothly handle data updating
      updateData = function () {


      }







      //#########################################  UTIL FUNCS ##################################

      //enter exit update pattern principle
      function patternify(params) {
        var container = params.container;
        var selector = params.selector;
        var elementTag = params.elementTag;

        // pattern in action
        var selection = container.selectAll('.' + selector).data([selector])
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
