$(document).ready(function() {
  
    /////////////////////////////////////   VARIABLES     /////////////////////////////////////////
    
    //Initial variables
    var lanDataSorted;
    var kommunDataSorted;
    var kommunShapeSorted;
    var lanShapeSorted;
    var ltDataSorted;
    var ltDataBarChart = [];
    var lanShapeData;
    var allKomData = [];
    var vkvData;
    var active = d3.select(null);
    var mapClick = false;
    var activeKom;
    var currentView = 'trend';
    var vkvSweShape;
    var defs;
    var vkvLegend;
    var formatPercent = d3.format('%');

    
    
    //map colours,
    var nodata = "#f2f2f2";
    var red = "#db031b";
    var orange = "#f39501";
    var yellow = "#fbde00";
    var lightGreen = "#55ab26";
    var darkGreen = "#05673a";
    
    //graph area variables
    var $graphTitle = $('#graphTitle');
    var $sweResult = $('#sweResult');
    var $lanResult = $('#lanResult');
    var $kommunResult = $('#kommunResult');
    var $sweden = $('#sweden');
    var $lanName = $('#lanName');
    var $kommunName = $('#kommunName');
    var $playBtn = $('#playBtn');
    
    var $komStatGraph = $('#komStatGraph');
    
    
    //trend variables
    var lineChartDefaultData;
    var lineChartScaleX;
    var lineChartScaleY;
    var line;
    var lineChartMargin = {top: 20, right: 20, bottom: 30, left: 50};
    var lineChartWidth = 560;
    var lineChartHeight = 320;
    var lineChart;
    var lineChartSVG;
    var activeLan;
    var lanKommunerData;
    var lanKommunerShape;
    var activeLanId;
    
    var slider;
    var isPlaying = false;
    var interval;
    var currentFrame = 2007;
    var frameLength = 1200;
    var sliderScale;
    var val;
    var timeLegendData;
    var defaultLegendData = [];
    
        
    //komstat variables
    var barChartWidth = 660;
    var barChartHeight = 8200;
    var barHeight = 28;
    var barChart;
    var bar;
    var rectangle;
    var barChartScaleX = d3.scale.linear()
            .domain([-10, 75])
            .range([0, 500]);
    var barXAxis;
    var availableSearch;
    
    
    var margin = {
        top: 20,
        right: 20,
        left: 20,
        bottom: 20
    };
    var width = 490;
    var height = 600;
    
    var projection = d3.geo.mercator()
        .center([16, 62.5])
        .scale(1100)
        .translate([width / 2, height / 2]);
    
        
    var geoPath = d3.geo.path()
        .projection(projection);
   
    
    
//////////////////////////////////////////   INITIAL SETTINGS     /////////////////////////////////////////   
    $komStatGraph.hide();   //hide kommun statistics graph
    $('#topListGraph').hide();   //hide toplist graph
    $('#vkvGraph').hide();  //hide vkv graph
    $kommunResult.hide();   //hide kommun result
    $kommunName.hide();     //hide kommun name  
    $('#backToSwe').hide(); //hide b2swe navigation
    
    $playBtn.hide();    //hide play button
        
    //set up time slider
    createSlider(); 
    playEvents();   
    
    
    //create map SVG
    var svg = d3.select('#mapView').append('svg')
        .attr({
            width: width,
            height: height,
            id: 'mapSVG'
        });
    
    var g = svg.append('g')
        .attr({
            class: 'g',
            transform: 'translate(' + margin.left + ',' + margin.top + ')'
        });
    

//////////////////////////////////////////   LOAD DATA     /////////////////////////////////////////  
    
    //queue data
    queue()
        .defer(d3.csv, 'data/lan_data.csv', type)
        .defer(d3.csv, 'data/kommun_data.csv', type)
        .defer(d3.json, 'data/kommuner_shape.geojson')
        .defer(d3.json, 'data/lan_shape.geojson')
        .defer(d3.csv, 'data/vkv.csv', vkvType)
        .defer(d3.json, 'data/swe_shape.geojson')
        .defer(d3.csv, 'data/landsting.csv', ltType)
        .await(pushData);
    
    
    
    //load data
    function pushData(error, lanData, kommunData, kommunShape, lanShape, vkv, sweShape, ltData) {

        if (error) throw error;
        
        //push kommun data into new array for full country bargraph
        for (var i = 0; i < kommunData.length; i++) {
            allKomData.push(kommunData[i]);
        }
        
        //sort kommun data
        kommunDataSorted = kommunData.sort(function(a,b) {
            return a.KOM_IDID - b.KOM_IDID;
        });
        
        //sort kommun shape boundaries
        kommunShapeSorted = kommunShape.features.sort(function(a,b) {
            return a.properties.ID - b.properties.ID;
        });
        
        //sort län data
        lanDataSorted = lanData.sort(function(a,b) {
            return a.LNKOD - b.LNKOD;
        });
        
        //sort landsting data
        ltDataSorted = ltData.sort(function(a,b) {
            return a.LNKOD - b.LNKOD;
        });
        
        //push landstingdata into array for bargraph
        for (var i = 0; i < ltData.length; i++) {
            ltDataBarChart.push(ltData[i]);
        }
        
        vkvData = vkv;  //update variable with vkv data        
        vkvSweShape = sweShape; //update variable with vkv shape data
        lanShapeData = lanShape;    //update variable with lan shape data
            
        drawSweLan(lanShapeData, lanDataSorted);   //draw lan boundaries
        defaultLineChart();     //run default linechart for trendview
        drawLanResults(lanDataSorted);  //draw lan result lines in trendgraph
        swedenResults();    //draw sweden result in trendgraph
        
        
    };
     
      
    
    //parse csv data 
    function type(d) {
        d['2015'] = +d['2015'];
        d['2014'] = +d['2014'];
        d['2013'] = +d['2013'];
        d['2012'] = +d['2012'];
        d['2011'] = +d['2011'];
        d['2010'] = +d['2010'];
        d['2009'] = +d['2009'];
        d['2008'] = +d['2008'];
        d.Mål = +d.Mål;
        d.Mål_År = +d.Mål_År;
        d.KOM_IDID = +d.KOM_IDID;
        d.LNKOD = +d.LNKOD;
        return d;
        
    } //end type
    
    //parse vkv csv data 
    function vkvType(d) {
        d.Ekovarde = +d.Ekovarde;
        return d;
        
    } //end vkvType
    
    //parse landsting csv data 
    function ltType(d) {
        d.LNKOD = +d.LNKOD;
        d['2015'] = +d['2015'];
        return d;
        
    } //end vkvType
    

//////////////////////////////////////////   RESULT STYLING     /////////////////////////////////////////
    
    //set colour depending on result
    function getColour(objectResult) {
        
        return objectResult === null ? nodata :
           objectResult >= 0 && objectResult <= 9 ? red :
           objectResult > 9 && objectResult <= 19 ? orange :
           objectResult > 19 && objectResult <= 29 ? yellow :
           objectResult > 29 && objectResult <= 39 ? lightGreen :
           objectResult > 39 ? darkGreen :
                      nodata;
    }; //end get colour
    
    

////////////////////////////////////   MAP SHAPES, DATA & EVENTS     ///////////////////////////////////////
    
    //draw sweden lan on map
    function drawSweLan(lanShape, data) {
        
        timeLegendData = [];  // empty legend data array
            
        var lanPath = g.selectAll('path.sweden')
            .data(lanShape.features)
            .enter().append('path')
            .attr({
                d: geoPath,
                class: 'sweden',
                id: function(d,i) {
                    return d.properties.LNNAMN;
                }
            })
            .style({
                fill: function(d,i) {
                    timeLegendData.push(getColour(data[i]['2015']));
                    defaultLegendData.push(getColour(data[i]['2015']));
                    return getColour(data[i]['2015']);
                },
                stroke: '#fff',
                'stroke-width': '0.8px',
                opacity: 1
            })
            .on('mouseenter', function(d) {
                
                if (!isPlaying && !mapClick && currentView != 'vkv' && currentView != 'komStat') {
                    
                    //update style on hovered lan
                    var lanId = +d.properties.LNKOD;

                    //update lan name and result when hovered
                    for (var j = 0; j < lanDataSorted.length; j++) {
                        if (lanDataSorted[j].LNKOD == lanId) {
                            $lanResult.html('<p>' + lanDataSorted[j]['2015'] + '%</p>');
                            $lanName.text(lanDataSorted[j].Län);
                            
                            //re-draw lanline on hover
                            var hoverLan = [];
                            hoverLan.push(lanDataSorted[j]);
                            drawActiveLan(hoverLan);
                        }
                    }
                    //set opactiy on other lan
                    $('path.sweden').not(this).css('opacity', 0.7);
                }
            })
            .on('mouseleave', function(d) {
                
                if (!isPlaying && !mapClick && currentView != 'vkv' && currentView != 'komStat') {
                    var lanId = +d.properties.LNKOD;
                    
                    //remove hoverlan
                    d3.selectAll('path.activeLine').remove();
             
                    //reset lan name and result
                    $lanResult.html('');
                    $lanName.text('Län');
                    //reset opactiy on other lan
                    $('path.sweden').not(this).css('opacity', 1);
                }
            });
            
        if (currentView == 'trend' || mapClick) {
            lanPath
                .on('click', clicked);
        }
            
        
         alterLegend(timeLegendData);    //update map legend
    }
        
    
    //draw kommuner on map
    function drawKommuner(lanKomData, lanKomShape, lanId) {
        
        timeLegendData = [];  // empty legend data array
        
        //show kommuner result and name divs
        $kommunResult.show();
        $kommunName.show();
        
        //update name and result fields of the active lan
        for (var j = 0; j < lanDataSorted.length; j++) {

            if (lanDataSorted[j].LNKOD == lanId) {
                $lanResult.html('<p>' + lanDataSorted[j]['2015'] + '%</p>');
                $lanName.text(lanDataSorted[j].Län);
            }
        }
        
        //draw kommuner shapes in lan              
        var kommunPath = g.selectAll('path.kommun')
            .data(lanKomShape)
            .enter().append('path')
            .attr({
                d: geoPath,
                class: 'kommun',
                id: function(d) {
                    return d.properties.ID;
                }
            })
            .style({
                fill: function(d,i) {
                    timeLegendData.push(getColour(lanKomData[i]['2015']));
                    return getColour(lanKomData[i]['2015']);
                },
                'stroke-width': '0.2px',
                stroke: '#fff',
                opacity: 1
            }).on('mouseenter', function(d) {

                    if (!isPlaying && mapClick) {
                        
                        var komId = +d.properties.ID;
                        
                        
                        //events based on current view
                        if (currentView == 'trend') {    
                           
                            //update kommun name and results when hovered                    
                            for (var j = 0; j < lanKomData.length; j++) {

                                if (lanKomData[j].KOM_IDID == komId) {
                                   
                                    
                                    //check for null data and update accordingly
                                    if (!isNaN(lanKomData[j]['2015'])) {
                                        $kommunResult.html('<p>' + lanKomData[j]['2015'] + '%</p>');
                                    } else {
                                        $kommunResult.html('<p>n/a</p>');
                                    }
                                    
                                    $kommunName.text(lanKomData[j].Kommun); //update kommun name
                                    
                                    //store hover kommun and redraw
                                    var hoverKommun = [];
                                    hoverKommun.push(lanKomData[j]);
                                    drawActiveKom(hoverKommun);
                                }
                            }                            
                        } else if (currentView == 'komStat') {
                            //update name results and targets in bargraph of each kommun when hovered
                            for (var j = 0; j < activeKom.length; j++) {
                                if (activeKom[j].KOM_IDID == komId) {
                                    
                                    var activeCol = getColour(activeKom[j]['2015']); //get colour from result
                                    $('#komStatGoal').show();   //show the goal div
                                    $('#komStatName').text(activeKom[j].Kommun); //update kommun name
                                    $('#komStatResult').css('backgroundColor', activeCol); //update div colour  
                                    
                                    //check for null data and update accordingly
                                    if (!isNaN(activeKom[j]['2015'])) {
                                        $('#komStatResult').html('<p>' + activeKom[j]['2015'] + '%</p>');
                                        $('#komStatResult').css('color', '#fff');
                                    } else {
                                        $('#komStatResult').html('<p>n/a</p>');
                                        $('#komStatResult').css('color', '#139fbb');
                                    }
                                    
                                    if (!isNaN(activeKom[j].Mål)) {
                                        $('#komStatGoal').html('<p>' + activeKom[j].Mål + '%</p>');
                                    } else {
                                        $('#komStatGoal').html('<p>n/a</p>');
                                    }
                                    
                                    if (!isNaN(activeKom[j].Mål_År)) {
                                        $('#komStatGoalName').text(activeKom[j].Mål_År + ' MÅL');
                                    } else {
                                        $('#komStatGoalName').text('INGET ANGIVET ÅR');
                                    }
                                    
                                }
                            } 
                            
                        }
                        //style other kommuner in lan on hover
                        $('path.kommun').not(this).css('opacity', 0.7);
                    }
                })
                .on('mouseleave', function(d) {

                    if (!isPlaying) {
                        
                        //reset kommunline style results
                        var komId = +d.properties.ID;
                        if (currentView == 'trend') {    
                            
                            //remove hover kommun
                            d3.selectAll('path.activeKomLine').remove();

                            $kommunResult.html('');
                            $kommunName.text('Kommuner');
                        } else if (currentView =='komStat') {
                            
                            //reset names and results in bargraph
                            $('#komStatName').text('');
                            $('#komStatGoalName').text('');
                            $('#komStatResult').html('');
                            $('#komStatResult').css('backgroundColor', 'rgba(0,0,0,0)');
                            $('#komStatGoal').html('');
                            $('#komStatGoal').hide();
                        }
                        
                        //reset other kommun styling
                        $('path.kommun').not(this).css('opacity', 1);
                    }
                    
                }); 
        
        
        drawKomResults(lanKomData);     //draw kommuner in linegraph
        alterLegend(timeLegendData);    //update map legend
      
    }//end draw kommun
    

    
    
    //draw vkvSweShape
     function drawVkvSwe(data) {
         
       defs = svg.append('defs')
            .append('linearGradient')
                .attr({
                    id: 'vkvGradient1',
                    x1: '0%',
                    x2: '0%',
                    y1: '100%',
                    y2: '0%'
            });

            defs.append('stop')
            .attr({
                offset: '0%'
            })
            .style({
                'stop-color': '#6a213e'
            });

            defs.append('stop')
            .attr({
                offset: '0%'
            })
            .style({
                'stop-color': 'rgb(255,255,255)',
                'stop-opacity': 0.4
            });
         
         

        var vkvSwePath = g.selectAll('path.vkvSwe')
            .data(data.features)
            .enter().append('path')
            .attr({
                d: geoPath,
                class: 'vkvSwe'
            })
            .style({
                fill: 'url(#vkvGradient1)',
                stroke: 'none',
                opacity: 1
            });
         
         defs.selectAll('stop')
            .transition()
                .duration(800)
                .ease('cubic-in-out')
                .attr({
                    offset: '31%'
                });
        
         vkvLegend = d3.select('g.g')
            .append('text')
            .attr({
                x: 40,
                y: 565,
                class: 'vkvText'
            })
            .text(0); 
         
         vkvLegend
            .transition()
            .duration(800)
            .ease('cubic-in-out')
            .attr({
                y: 389.85
            })
            .tween('text', tweenText(0.31));
    }   
    
   //transition offset of defs depending on data
    function transitionOffset(percent) {
        d3.selectAll('path.vkvSwe')  
            .append('text')
            .text('hello');

        defs.selectAll('stop')
            .transition()
                .duration(800)
                .ease('cubic-in-out')
                .attr({
                    offset: (percent * 100)  +'%'
                });
        
        var legendTextPosition = 565 - (5.65 * (percent * 100));
        
        vkvLegend
            .transition()
            .duration(800)
            .ease('cubic-in-out')
            .attr({
                y: legendTextPosition
            })
            .tween('text', tweenText(percent));
    }

     function transitionResetOffset() {
        //transition stop back to 0%
        defs.selectAll('stop')
            .transition()
                .duration(800)
                .ease('cubic-in-out')
                .attr({
                    offset: '31%'
        });
         
         vkvLegend
            .transition()
            .duration(800)
            .ease('cubic-in-out')
            .attr({
                y: 389.85
            })
            .tween('text', tweenText(0.31));

     }
        
    //tween between percent values
    function tweenText( newValue ) {
       return function() {
          var currentValue = parseFloat(this.textContent);
          currentValue = currentValue / 100;
           
          var i = d3.interpolate( currentValue, newValue );

          return function(t) {
              d3.select(this).text(formatPercent(i(t)));
          };
        }
    }   //end tweentext
    
    
    
     //map click function
    function clicked(d) {
        
        
        //check if the timeline is playing
        if (!isPlaying) {
            
            currentFrame ='2015';   //reset currentFrame
            $('#graphYear').text('2015'); //update year in trendgraph
            
            mapClick = true; //set mapclick to true
            
            var lanName = d.properties.LNNAMN;  //set lanName as clicked lan
            activeLanId = d.properties.LNKOD;   //set lanId as clicked lan id
            
            checkLanNameLength(lanName);

            //empty arrays to store data and shapes of kommuner in the lan
            lanKommunerData = [];
            lanKommunerShape = [];
            activeLan = [];

            
            active.classed("active", false);    //remove active class from previous lan
            active = d3.select(this).classed("active", true);   //set active class on clicked lan   


            //capture bounds of clicked lan and zoom to boundaries
            var bounds = geoPath.bounds(d),
              dx = bounds[1][0] - bounds[0][0],
              dy = bounds[1][1] - bounds[0][1],
              x = (bounds[0][0] + bounds[1][0]) / 2,
              y = (bounds[0][1] + bounds[1][1]) / 2,
              scale = .8 / Math.max(dx / width, dy / height),
              translate = [width / 2 - scale * x + 45, height / 2 - scale * y];

            g.transition()
              .duration(750)
              .style("stroke-width", 0.2 / scale + "px")
              .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
            
            
            $('#backToSwe').show(); //show b2swe button for navigation
            
            //update arrays of kommuner data and shapes if lan is the same as active lanName
            for (var i = 0; i < kommunDataSorted.length; i++) {
                if (kommunDataSorted[i].Lan == lanName) {
                    lanKommunerData.push(kommunDataSorted[i]);
                    lanKommunerShape.push(kommunShapeSorted[i]);
                }
            }
            //update the active lan array 
            for (var j = 0; j < lanDataSorted.length; j++) {
                if (lanDataSorted[j].LNKOD == activeLanId) {
                    activeLan.push(lanDataSorted[j]);
                }
            }

            $('path.sweden').remove();
            drawSweLan(lanShapeData, lanDataSorted);   //draw lan boundaries
            $('path.sweden').css('opacity', 0.2);   //set opacity on the swePath

            d3.selectAll('path.kommun').remove();   //remove all kommuner paths
            d3.selectAll('path.lanLine').remove();  //remove all lan lines in trendgraph
            d3.selectAll('path.activeLine').remove();   //remove all active lines in trendgraph
            
            //check if view is komstat and push active kommuner to bargraph
            if (currentView == 'komStat') {
                $('#topListGraph').hide();   //hide toplist graph
                $komStatGraph.show();       //hide komstat graph
                sortActiveKommuner(lanKommunerData);
                
            } else if (currentView == 'trend') { 
               drawActiveLan(activeLan);   //draw active lan in trendgraph
            }
            
            drawKommuner(lanKommunerData, lanKommunerShape, activeLanId);   //draw active kom shapes
        }
    }
    
    
    
    //reset map click
    function reset() {
    
        mapClick = false;
        
        active.classed("active", false);
        active = d3.select(null);

        g.transition()
          .duration(750)
          .style('stroke-width', '0.8px')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    }
    
    

    //get occurrences of each colour to update legend graph
    function alterLegend(legendData) {

        var nodataLength = $.grep(legendData, function(a) {
            return a == nodata; 
        }).length;
        var redLength = $.grep(legendData, function(a) {
            return a == red; 
        }).length;
        var orangeLength = $.grep(legendData, function(a) {
            return a == orange; 
        }).length;
        var yellowLength = $.grep(legendData, function(a) {
            return a == yellow; 
        }).length;
        var lightGreenLength = $.grep(legendData, function(a) {
            return a == lightGreen; 
        }).length;
        var darkGreenLength = $.grep(legendData, function(a) {
            return a == darkGreen; 
        }).length;

        var nodataHeight = (456 * (nodataLength / legendData.length)) + 14;
        var redHeight = (456 * (redLength / legendData.length)) + 14;
        var orangeHeight = (456 * (orangeLength / legendData.length)) + 14;
        var yellowHeight = (456 * (yellowLength / legendData.length)) + 14;
        var lightGreenHeight = (456 * (lightGreenLength / legendData.length)) + 14;
        var darkGreenHeight = (456 * (darkGreenLength / legendData.length)) + 14;

        $('p#legNa').animate({
            height: nodataHeight + 'px'
        }, 500);

        $('p#leg9').animate({
            height: redHeight + 'px'
        }, 500);

        $('p#leg19').animate({
            height: orangeHeight + 'px'
        }, 500);

        $('p#leg29').animate({
            height: yellowHeight + 'px'
        }, 500);

        $('p#leg39').animate({
            height: lightGreenHeight + 'px'
        }, 500);

        $('p#leg49').animate({
            height: darkGreenHeight + 'px'
        }, 500);

    }

    
//////////////////////////////////////////   TREND VIEW     /////////////////////////////////////////   
    
    //default linegraph settings
    function defaultLineChart() {
        
        //update graph title
        $graphTitle.html('<h4 class="trend">Trend</h4>');
        
        //crate result circles
        $sweResult.html('<p>31%</p>');
        
        //set up lingraph scales
        lineChartScaleX = d3.scale.linear()
                .domain([2008, 2016])
                .range([0, lineChartWidth -70]);

        lineChartScaleY = d3.scale.linear()
            .domain([0, 100])
            .range([lineChartHeight -70, 0]);
        
        //set up x and y axis
        var xAxis = d3.svg.axis()
            .scale(lineChartScaleX)
            .tickPadding(12)
            .tickFormat(d3.format("d"))
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(lineChartScaleY)
            .tickPadding(12)
            .tickValues([0,20,40,60,80,100])
            .tickFormat(function(d) { return d + "%";})
            .orient("left");
        
        //line interpolation based on year and percent with accounting for null data
        line = d3.svg.line()
            .interpolate("cardinal")
            .x(function(d) { return lineChartScaleX(d.year) })
            .y(function(d) { return lineChartScaleY(d.percent) })
            .defined(function(d) { return !isNaN(d.percent); });
        
        //set up linegraph svg
        lineChart = d3.selectAll("#svgArea").append("svg")
            .attr("width", lineChartWidth)
            .attr("height", lineChartHeight)
            .attr("class", "lineChartSVG")
            .append("g")
            .attr("class", "viz")
            .attr("transform", "translate(" + lineChartMargin.left + "," + lineChartMargin.top + ")");

        lineChart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (lineChartHeight - 70) + ")")
            .call(xAxis)
          .selectAll('text')
            .attr({
                transform: 'rotate(-45)',
                y: 15,
                x: -20,
                dy: '0.5em'
            });

        lineChart.append("g")
            .attr("class", "y axis")
            .call(yAxis);

    } //end set up default line chart
    
    
     //set sweden results in linegraph
        function swedenResults() {
            
            lineChartDefaultData = [
                {year: 2008, percent: 7},
                {year: 2009, percent: 9},
                {year: 2010, percent: 13},
                {year: 2011, percent: 17},
                {year: 2012, percent: 20},
                {year: 2013, percent: 22},
                {year: 2014, percent: 23},
                {year: 2015, percent: 31}
            ];
            
            lineChart.append("path")
                .datum(lineChartDefaultData)
                .attr({
                    class: 'sweLine',
                    d: line
                });

        }; //end sweden results
    
    
    
    
    //draw län result to linegraph 
    function drawLanResults(lanData) {
        
        for (var i = 0; i < lanData.length; i ++) {
            
            var lanId = lanData[i].LNKOD;
            
             var lanResults = [
            {year: 2008, percent:lanData[i]["2008"]},
            {year: 2009, percent:lanData[i]["2009"]},
            {year: 2010, percent:lanData[i]["2010"]},
            {year: 2011, percent:lanData[i]["2011"]},
            {year: 2012, percent:lanData[i]["2012"]},
            {year: 2013, percent:lanData[i]["2013"]},
            {year: 2014, percent:lanData[i]["2014"]},
            {year: 2015, percent:lanData[i]["2015"]}
            ];
        

            lineChart.append("path")
                .datum(lanResults)
                .transition()
                .duration(150)
                .ease("quad")
                .attr({
                    class: 'lanLine',
                    d: line,
                    id: 'l' + lanId
                });
            
        }; 
    } //end draw lan resultat
    
    
    //draw active län result to linegraph
    function drawActiveLan(lanData) {
        
        checkLanNameLength(lanData[0].Län);
        
        for (var i = 0; i < lanData.length; i ++) {
            
            var lanId = lanData[i].LNKOD;
            
             var lanResults = [
            {year: 2008, percent:lanData[i]["2008"]},
            {year: 2009, percent:lanData[i]["2009"]},
            {year: 2010, percent:lanData[i]["2010"]},
            {year: 2011, percent:lanData[i]["2011"]},
            {year: 2012, percent:lanData[i]["2012"]},
            {year: 2013, percent:lanData[i]["2013"]},
            {year: 2014, percent:lanData[i]["2014"]},
            {year: 2015, percent:lanData[i]["2015"]}
            ];

            lineChart.append("path")
                .datum(lanResults)
                .transition(500)
                .duration(150)
                .ease("quad")
                .attr({
                    class: 'activeLine',
                    d: line,
                    id: 'l' + lanId
                });
            
        };
    } //end draw active lan resultat
    
    
    //draw kommuner result to linegraph 
    function drawKomResults(komData) {
        
        d3.selectAll('path.komLine').remove();       
        activeKom = komData;
        
        
        for (var i = 0; i < komData.length; i ++) {
            
            var komId = komData[i].KOM_IDID;
            
             var komResults = [
            {year: 2008, percent:komData[i]["2008"]},
            {year: 2009, percent:komData[i]["2009"]},
            {year: 2010, percent:komData[i]["2010"]},
            {year: 2011, percent:komData[i]["2011"]},
            {year: 2012, percent:komData[i]["2012"]},
            {year: 2013, percent:komData[i]["2013"]},
            {year: 2014, percent:komData[i]["2014"]},
            {year: 2015, percent:komData[i]["2015"]}
            ];
            
          
            lineChart.append("path")
                .datum(komResults)
                .transition()
                .duration(150)
                .ease("quad")
                .attr({
                    class: 'komLine',
                    d: line,
                    id: 'k' + komId
                });
            
        };
    } //end draw kommun resultat
    
    
    //draw active län result to linegraph
    function drawActiveKom(komData) {
        
        for (var i = 0; i < komData.length; i ++) {
            
            var komId = komData[i].KOM_IDID;
            
             var komResults = [
            {year: 2008, percent:komData[i]["2008"]},
            {year: 2009, percent:komData[i]["2009"]},
            {year: 2010, percent:komData[i]["2010"]},
            {year: 2011, percent:komData[i]["2011"]},
            {year: 2012, percent:komData[i]["2012"]},
            {year: 2013, percent:komData[i]["2013"]},
            {year: 2014, percent:komData[i]["2014"]},
            {year: 2015, percent:komData[i]["2015"]}
            ];

            lineChart.append("path")
                .datum(komResults)
                .transition(500)
                .duration(150)
                .ease("quad")
                .attr({
                    class: 'activeKomLine',
                    d: line,
                    id: 'k' + komId
                });
            
        };
    } //end draw active lan resultat
    
    
    function checkLanNameLength(lanName) {
        //check for lan name length to adjust kommun name position
            if (lanName.length > 7 ) {
                $kommunResult.css('left', '520px');
                $kommunName.css('left', '560px');
            } else {
                $kommunResult.css('left', '460px');
                $kommunName.css('left', '500px');                                        
            }
    }
       
    
    
/////////////////////////////////////   TIME SLIDER     /////////////////////////////////////////
    
    //create slider
    function createSlider() {
        
        sliderScale = d3.scale.linear()
            .domain([2008, 2015]);
        
        val = slider ? slider.value() : 2008;
        
        slider = d3.slider()
                .scale(sliderScale)
                .value(val);
        
    } //end create slider
    
        
    //timeslider interval and animation
    function animate() {

        interval = setInterval(function() {
            currentFrame++;

            if (currentFrame == 2016) {
                currentFrame = 2008;
            }

            slider.value(currentFrame);
            
            drawYear(currentFrame, true);

            if (currentFrame == 2015) {
                isPlaying = false;
                $('#playBtn').attr('src', 'media/play_button.png');

                d3.select('#playBtn')
                    .classed('pause', false);

                clearInterval(interval);
                return;
            }
        }, frameLength);            

    }   //end animate

    //update style based on year
    function drawYear(year) {

        $('#graphYear').text(year); //update year in trendgraph
        timeLegendData = [];    //empty timeLegendData array
        
        if (mapClick) {
            
            g.selectAll('path.kommun')
            .transition()
            .duration(100)
            .style({
                fill: function(d,i) {
                    timeLegendData.push(getColour(lanKommunerData[i][year]));
                    return getColour(lanKommunerData[i][year]);
                }
            });
            
             alterLegend(timeLegendData);
            
        } else {
            
            g.selectAll('path.sweden')
            .transition()
            .duration(100)
            .style({
                fill: function(d,i) {
                    timeLegendData.push(getColour(lanDataSorted[i][year]));
                    return getColour(lanDataSorted[i][year]);
                }
            });
            
             alterLegend(timeLegendData);
        }
        
    }   //end draw year


    //playBtn events
    function playEvents() {

        $('#svgArea').mouseenter(function() {
            $('#playBtn').fadeIn();
        }).mouseleave(function() {
            $('#playBtn').fadeOut();
        }); 
    

        d3.select('#playBtn')
            .on('click', function() {

                if (!isPlaying) {
                    isPlaying = true;
                    $('#playBtn').attr('src', 'media/pause_button.png');

                    d3.select(this)
                        .classed('pause', true)

                    animate();

                } else {
                    isPlaying = false;
                    $('#playBtn').attr('src', 'media/play_button.png');
                    d3.select(this)
                        .classed('pause', false);

                    clearInterval(interval);
            }

        });
    }

    
    
//////////////////////////////////////  KOMMUN STATISTICS VIEW     /////////////////////////////////////////
    
    //set default bar chart
    function defaultBarChart(data) {

    
        barXAxis = d3.svg.axis()
            .scale(barChartScaleX)
            .tickFormat(function(d) { return d + "%";})
            .orient("bottom");

        barChart = d3.select('#svgArea').append('svg')
            .attr({
                width: barChartWidth,
                height: barChartHeight,
                class: 'barChartSVG'
            });

        sortActiveKommuner(data);
    }
    
     //sort kommun data for bar chart
    function sortActiveKommuner(activeKomParam) {
        
        var sortedKomResults = activeKomParam.sort(function(a,b) {
            return -(!isNaN(a['2015']))+(!isNaN(b['2015'])) || -(a['2015']>b['2015'])||+(a['2015']  <b['2015']);
        });
        
        for (var i = 0; i < sortedKomResults.length; i++) {
            var prevResult = sortedKomResults[i - 1];
            
            if (i != 0) {
               if (sortedKomResults[i]['2015'] == prevResult['2015']) {
                    sortedKomResults[i].placement = prevResult.placement;
                } else {
                    sortedKomResults[i].placement = i; 
                } 
            } else {
                sortedKomResults[i].placement = i;
            }
          
        }
        drawBars(sortedKomResults);
    }   //end sortactivekommuner
    
    
    function drawBars(sortedKomResults) {
        
        $('#svgArea').scrollTop(0);

        if ( sortedKomResults.length > 10 ) {
            $('#svgArea').css('overflowY', 'scroll');
            //$('#svgArea').css('overflow', '-moz-scrollbars-none');  //remove scrollbars for firefox
            $('#moreResults').show();
        } else {
            $('#svgArea').css('overflowY', 'hidden');
            $('#moreResults').hide();
        }
        
        //remove rectangles from barChart
        barChart.selectAll("g")
            .remove();
        
        if (!mapClick) {
            topListResults(sortedKomResults);
        } else {
            barGoals(sortedKomResults);
            barResults(sortedKomResults); 
        }
       
    }   //end drawbars
    
    
     function barResults(sortedKomResults) {
                     
            bar = barChart.selectAll("g.barResults")
            .data(sortedKomResults)
            .enter().append("g")
            .attr("transform", function(d, i){
                return "translate(100," + i * barHeight + ")"
            })
            .attr('class', 'barResults');

       
            rectangle = bar.append('rect')
                .style({
                    fill: function(d) {
                        return getColour(d['2015']);
                    },
                    opacity: 1
                    })
                .attr({
                    width: 5,
                    height: barHeight - 3,
                    class: 'rectangle'
                    });

            rectangle.transition()
                .delay(800)
                .duration(800)
                .ease("quad")
                .attr("width", function(d) { 
                    if (!isNaN(d['2015'])) {
                        return barChartScaleX(d['2015']);
                    } else {
                        return 5;
                    }
            })

            var textLabel = bar.append('text')
                .attr({
                    x: -10,
                    y: barHeight / 2,
                    dy: '0.35em',
                    'text-anchor': 'end'
                })
                .style({
                    fill: '#fff'
                })
                .text(function(d) {
                    return d.Kommun;
            });
            
    }   //end bar results
    
    
    function barGoals(sortedKomResults) {
        
            
            var goal = barChart.selectAll("g.barGoals")
            .data(sortedKomResults)
            .enter().append("g")
            .attr("transform", function(d, i){
                return "translate(100," + i * barHeight + ")"
            })
            .attr('class', 'barGoals');

       
            rectangle = goal.append('rect')
                .style({
                    fill: '#fff',
                    opacity: 0.3
                    })
                .attr({
                    width: 5,
                    height: barHeight - 3,
                    class: 'rectangle'
                    });

            rectangle.transition()
                .duration(800)
                .ease("quad")
                .attr("width", function(d) { 
                    if (!isNaN(d.Mål)) {
                        return barChartScaleX(d.Mål);
                    } else {
                        return 0;
                    }
            });
            
        } //end bar goals
    
    
    function topListResults(sortedKomResults) {
        
        //remove rectangles from barChart
        barChart.selectAll("g")
            .remove();
        
        var topList = barChart.selectAll("g.barTopList")
            .data(sortedKomResults)
            .enter().append("g")
            .attr({
                transform: function(d, i){
                    if ($('#viewKommun').hasClass('active')) {
                        return "translate(140," + i * barHeight + ")";
                    } else {
                        return "translate(200," + i * barHeight + ")";
                    }
                },
                class: 'barTopList',
                id: function(d, i) {
                    return d.Kommun;
                }
            });

       
            rectangle = topList.append('rect')
                .style({
                    fill: function(d) {
                        return getColour(d['2015']);
                    },
                    opacity: 1
                    })
                .attr({
                    width: 5,
                    height: barHeight - 3,
                    class: 'rectangle'
                    });

            rectangle.transition()
                .duration(800)
                .ease("quad")
                .attr("width", function(d) { 
                    if (!isNaN(d['2015'])) {
                        return barChartScaleX(d['2015']);
                    } else {
                        return 5;
                    }
                });
        
        var textLabel = topList.append('text')
                .attr({
                    x: -10,
                    y: barHeight / 2,
                    dy: '0.35em',
                    'text-anchor': 'end'
                })
                .style({
                    fill: '#fff'
                })
                .text(function(d) {
                    if ($('#viewKommun').hasClass('active')) {
                        return d.Kommun;
                    } else {
                        return d.Landsting;
                    }
                    
                });
        
        var textPlacement = topList.append('text')
                .attr({
                    x: function() {
                        if ($('#viewKommun').hasClass('active')) {
                            return -140;
                        } else {
                            return -200;
                        }
                    },
                    y: barHeight / 2,
                    dy: '0.35em',
                    'text-anchor': 'start',
                    'font-family': 'Futura Heavy'
                })
                .style({
                    fill: '#fff',
                    opacity: 0.6
                })
                .text(function(d, i) {
                    if (!isNaN(d['2015'])) {
                        return d.placement + 1 + '.';
                    }
                });
        
        var textResult = topList.append('text')
                .attr({
                    x: 10,
                    y: barHeight / 2,
                    dy: '0.35em',
                    'text-anchor': 'start',
                    'font-family': 'Futura Heavy'
                })
                .style({
                    fill: '#fff'
                })
                .text(function(d) {
                     if (!isNaN(d['2015'])) {
                        return d['2015'] + '%';
                    } else {
                        return 'n/a';
                    }
                });
        
        textResult
            .transition()
            .duration(800)
            .ease("quad")
            .attr({
                x: function(d) {
                    if (!isNaN(d['2015'])) {
                        return barChartScaleX(d['2015'] + 1 );
                    } else {
                        return 10;
                    }
                }
            });
                   
            
        
        if ($('#viewKommun').hasClass('active')) {
            searchFunction('#komSearch', 'Sök Kommun');
        } else {
            searchFunction('#ltSearch', 'Sök Landsting');
        }
        
    
        //topList Search Function
        function searchFunction(id, value) {
            availableSearch = [];
            for (var j = 0; j < sortedKomResults.length; j++) {
                if ($('#viewKommun').hasClass('active')) {
                    availableSearch.push(sortedKomResults[j].Kommun);
                } else {
                    availableSearch.push(sortedKomResults[j].Landsting); 
                }
            }

            $('input' + id).on('focus', function() {
                $(id).val('');
                $(id).autocomplete({
                    source: availableSearch,
                    select: function( event, ui ) {
                        var selected = ui.item.label;
                        var position = (barHeight * availableSearch.indexOf(selected)) + 25;
                        $('#svgArea').animate({
                            scrollTop: position
                        }, 500, function() {
                             $(id).val(value);
                        });
                    }
                });
            })
            .on('blur', function() {
                $(id).val(value);
            });
            
        }   //end search function
        
    }   //end toplist results
    

//////////////////////////////////////////   VKV VIEW     /////////////////////////////////////////
    
    function radarChart(data) {
        var cfg = {
             w: 280,				//Width of the circle
             h: 280,				//Height of the circle
             margin: {top: 50, right: 150, bottom: 100, left: 150        }, //The margins of the SVG
             levels: 4,				//How many levels or inner circles should there be drawn
             maxValue: 1, 			//What is the value that the biggest circle will represent
             labelFactor: 1.25, 	//How much farther than the radius of the outer circle should the labels be placed
             wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
             opacityArea: 0.35, 	//The opacity of the area of the blob
             dotRadius: 4, 			//The size of the colored circles of each blog
             opacityCircles: 0.1, 	//The opacity of the circles of each blob
             strokeWidth: 2, 		//The width of the stroke around each blob
             roundStrokes: true	//If true the area and stroke will follow a round path (cardinal-closed)
//             color: '#6a213e'	//Color
        };
        
        var allAxis = (data.map(function(i, j){ return i.Produktgrupp}));	//Names of each axis
		var total = allAxis.length;				//The number of different axes
		var radius = Math.min(cfg.w/2, cfg.h/2); 	//Radius of the outermost circle
		var format = d3.format('%');			 	//Percentage formatting
		var angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"
        
        //Scale for the radius
        var rScale = d3.scale.linear()
            .range([0, radius])
            .domain([0, 1]);
        
        
//        //Remove whatever chart with the same id/class was present before
//        d3.select(id).select("svg").remove();

        //Initiate the radar chart SVG
        var svg = d3.select('#svgArea').append("svg")
                .attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
                .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
                .attr("class", "radar");
        
        //Append a g element		
        var g = svg.append("g") 
            .attr('class', 'mainG')
            .attr("transform", "translate(" + 300 + "," + 180 + ")");
        
        
        
        //Wrapper for the grid & axes
        var axisGrid = g.append("g").attr("class", "axisWrapper");
        
        //Draw the background circles
        axisGrid.selectAll('.levels')
           .data(d3.range(1,(cfg.levels+1)).reverse())
           .enter()
            .append('circle')
            .attr({
                class: 'gridCirlcle',
                r: function(d, i) {
                    return radius / cfg.levels * d;
                }
            })
            .style({
                fill: '#71C6D6',
                stroke: 'rgba(255,255,255,0.4)',
                'stroke-width': function(d, i) {
                    if (i > 0) {
                        return '1px';
                    } else {
                        return '0px';
                    }
                },
                'stroke-dasharray': function(d, i) {
                    if (i > 0) {
                        return '5,5';
                    } 
                }
            });
        
        
         //The radial line function
        var radarLine = d3.svg.line.radial()
            .interpolate("cardinal-closed")
            .radius(function(d) { return rScale(d.Ekovarde); })
            .angle(function(d,i) {return i * angleSlice; });

        
        //Create a wrapper for the blobs	
        var blobWrapper = g.append("g")
            .attr("class", "radarWrapper");

        //Append the backgrounds	
        var blob = blobWrapper
            .append('path')
            .attr({
                class:'radarArea',
                d: radarLine(vkvData)
                
            })
            .style({
                fill: '#6a213e',
                opacity: 0.6
            });
        
       //Create the outlines	
	   blobWrapper.append('path')
        .attr({
            class: 'radarStroke',
            d: function(d, i) {
                return radarLine(vkvData);
            }
        })
        .style({
            stroke: '#6a213e',
            'stroke-width': '3px',
            fill: 'none'
        });
        
        
        //Text indicating at what % each level is
        var percentAxis = g.append("g").attr("class", "percentAxis");
        
        percentAxis.selectAll('.axisPerc')
            .data(d3.range(1,(cfg.levels+1)).reverse())
            .enter().append('text')
            .attr({
                class: 'percentPerc',
                x: 4,
                y: function(d) {
                    return -d * radius / cfg.levels; 
                },
                dy: '-0.5em',
                dx: '-1.5em',
                transform: 'rotate(25)'
            })
            .style({
                'font-size': '10px',
                fill: '#fff',
                opacity: 1,
                'font-family': 'Futura Heavy'
            })
            .text(function(d,i) { 
                if (d < 4) {
                    return format(1 * d/cfg.levels); 
                }
            });
       
        
        //Create the straight lines radiating outward from the center
        var axis = axisGrid.selectAll(".axis")
            .data(vkvData)
            .enter()
            .append("g")
            .attr("class", "axis");
        
        function titleAlign(d, i) {
            if (i == 0 || i == 8) {
                return 'middle';
            } else if (i > 0 && i < 8) {
                return 'start';
            } else if (i > 8) {
                return 'end';
            }
        }
        
        //Append the lines
        axis.append('line')
            .attr({
                x1: 0,
                y1: 0,
                x2: function(d, i) {
                    return rScale(1.1) * Math.cos(angleSlice * i - Math.PI / 2);
                },
                y2: function(d, i) {
                    return rScale(1.1) * Math.sin(angleSlice * i- Math.PI / 2);
                },
                class: 'radialLine'
            })
            .style({
                stroke: 'rgba(255,255,255,0.4)',
                'stroke-width': '1px'
            });

        //Append the labels at each axis
        axis.append('text')
            .attr({
                class: 'radialLegend',
                'text-anchor': function(d,i) {
                    return titleAlign(d,i);
                },
                dy: '0.5em',
                x: function(d, i) {
                    return rScale(1.2) * Math.cos(angleSlice * i - Math.PI / 2);
                },
                y: function(d, i) {
                    return rScale(1.2) * Math.sin(angleSlice * i - Math.PI / 2);
                }
            })
            .style({
                'font-size': '12px',
                'opacity': 0.6
            })
            .text(function(d) {
                return d.Produktgrupp;
            })
            .on('mouseenter', function(d, i) {
            
                d3.selectAll('path.sweden').style('opacity', 0);
                d3.select(this).style({opacity: 1, 'font-family': 'Futura Heavy'});
            
                var ekovarde = d.Ekovarde;
                transitionOffset(ekovarde);   //transition the stop offsets
            })
            .on('mouseleave', function(d, i) {

                d3.select(this).style({opacity: 0.6, 'font-family': 'Futura Medium'});
            
                transitionResetOffset();
            
            });

        
    }
    
  
    
   
      
    
//////////////////////////////////////////   EVENT HANDLERS     /////////////////////////////////////////
    
        
    //icon click function 
    function iconClick(clickedIcon) {
       
        var iconId = clickedIcon;
        $('#statArea > div.active').toggleClass('active');  //remove active class of icons
        $('#' + clickedIcon).toggleClass('active');  //set active class on clicked icon
        
        $('#svgArea').children().detach();  //empty SVG area
        d3.selectAll('defs').remove();  //remove defs from svg 
        d3.selectAll('path.vkvSwe').remove();   //remove vkv map 
        d3.selectAll('text.vkvText').remove();  //remove vkv map legend
        
        //hide all graphs
        $komStatGraph.hide();   //hide kommun statistics graph
        $('#vkvGraph').hide();  //hide vkv graph
        $('#trendGraph').hide();//hide trend graph  
        $('#topListGraph').hide(); //hide toplist graph
        $('#svgArea').css('cursor', 'pointer'); //set svgarea cursor to pointer
        
        
        
        d3.selectAll('path.sweden').style('opacity', 1);    //show swepath
        $('#legend').show();    //show legend
        
        
        
        //settings depending on which icon was clicked
        // TREND ICON VIEW //
        if (iconId == 'trendIcon') {
            
            currentView = 'trend';  //update current view
            
            $('#trendGraph').show();//show trend graph
            $('#legend').show();    //show legend
            $('#svgArea').css('height', '320px');   //set svgArea height
            
            defaultLineChart();     //draw default linegraph
            
            //update play button and current year of linegraph
            $('#svgArea').append('<p id="graphYear">2015</p>');
            $('#svgArea').append('<img id="playBtn" src="media/play_button.png" width="84px" height="85px" alt="Play Button">');
            playEvents();
            
            //check if in national or kommun view
            //national view
            if (!mapClick) {
                
                $kommunResult.hide();   //hide kommun result
                $kommunName.hide();     //hide kommun name
                
                d3.selectAll('path.kommun').remove();    //hide kommuner on map
                d3.selectAll('path.sweden').remove();    //remove any swepath
                drawSweLan(lanShapeData, lanDataSorted);   //draw lan boundaries on map
                drawLanResults(lanDataSorted);  //draw lan results to linegraph
                swedenResults();    //draw sweresults on line graph
              
            //kommun view    
            } else {
                
                $kommunResult.show();   //hide kommun result
                $kommunName.show();     //hide kommun name
                
                d3.selectAll('path.sweden').style('opacity', 0.2);    //show swepath
                drawKomResults(lanKommunerData);     //draw kommuner in linegraph
                drawActiveLan(activeLan);   //draw active lan results in linegraph
                swedenResults();    //draw swe results on linegraph
            }
            
            
          // VKV VIEW //  
        } else if (iconId == 'vkvIcon') {
            
            if (mapClick) {
                reset();    //reset map to national view
                $('#backToSwe').hide(); //remove the back to swe button
            }
            
            currentView = 'vkv';    //update current view
            
            d3.selectAll('path.sweden').remove();    //remove any swepath
            d3.selectAll('path.kommun').remove();    //hide kommuner on map
            $('#legend').hide();    //hide map legend
            
            $('#vkvGraph').show();  //show vkvGraph
            $('#svgArea').css('height', '520px');   //set svgArea height
                        
            radarChart(vkvData);    //run radarChart
            drawVkvSwe(vkvSweShape);   //draw vkvsweshape on map
                       
            
            
        // KOMMUN STATISTIK VIEW //    
        } else if (iconId == 'komIcon') {
            
            
            currentView = 'komStat';    //update current view
           
            $('#svgArea').css('height', '320px');   //set svgArea height
            $('#svgArea').css('cursor', 'default'); //set svgarea cursor to default
            
            $('#moreResults').hide();   //hide moreresults as default
            $('#komStatGoal').hide();   //hide komstatgoal as default
            

            //check if in kommun or national view
            //national view
            if (!mapClick) {
                
                $('#topBar > p.active').toggleClass('active');  //remove active class of view
                $('#searchBar > div.active').toggleClass('active');  //remove active class of searchbar
                $('#viewKommun').toggleClass('active');  //set active class on kommun view
                $('#kommunSearch').toggleClass('active');  //toogle active class on kommun search
                
                d3.selectAll('path.sweden').remove();    //remove swepath from map
                drawKommuner(kommunDataSorted, kommunShapeSorted);  //draw all kommuner on map
                
                $('#topListGraph').show();   //show toplist graph
                defaultBarChart(allKomData);    //draw bargraph with all kommuner data
                
          
                
            //kommun view    
            } else {    
                d3.selectAll('path.sweden').style('opacity', 0.2);    //show swepath
                
                $komStatGraph.show();       //show komstat graph
                //defaultBarChart(activeKom);     //draw bargraph with active kommuner
                 defaultBarChart(lanKommunerData);     //draw bargraph with active kommuner
            }
            
        }
        
    }//end iconclick
    
    //trend icon events
    $('#trendIcon').click(function() {  if (!$(this).hasClass('active')) { iconClick(this.getAttribute('id')); }     });
    
    //vkv icon events
    $('#vkvIcon').click(function() {    if (!$(this).hasClass('active')) { iconClick(this.getAttribute('id')); }    });
    
    //komstat icon events
    $('#komIcon').click(function() {    if (!$(this).hasClass('active')) { iconClick(this.getAttribute('id')); }    });
    
    
    
    //back2swe click events
    $('#backToSwe').click(function() {
        
        reset();    //reset map zoom to national view
        $('#backToSwe').hide(); //remove back to swe button
        
        currentFrame ='2015';   //reset currentFrame for time animation
        $('#graphYear').text('2015'); //update year in trendgraph
        
        //check for current view type
        //Trend graph view
        if (currentView == 'trend') {
            iconClick('trendIcon'); 
        
        //Kommun Stat view        
        } else if (currentView == 'komStat') {
            iconClick('komIcon');
        } 
    });
    
    
    
    //prepare to swap views
    function prepTopList(clickedView, view) {
        
        $('#topBar > p.active').toggleClass('active');  //remove active class of view
        $('#searchBar > div.active').toggleClass('active');  //remove active class of searchbar
        $(clickedView).toggleClass('active');  //set active class on clicked icon
        $(view).toggleClass('active');  //toogle active class on kommun search
       
        d3.selectAll('svg.barChartSVG').remove();    //remove old bars
    }
    
    //TOPLIST STAT: KOMMUN VIEW
    $('#viewKommun').click(function() {
        
        prepTopList(this, '#kommunSearch');
        defaultBarChart(allKomData);    //draw bargraph with all kommuner
        
        d3.selectAll('path.sweden').remove();   //remove sweshapes
        
        drawKommuner(kommunDataSorted, kommunShapeSorted);  //draw all kommuner on map
        
    });
    
    //TOPLIST STAT: LANDSTING VIEW
    $('#viewLandsting').click(function() {
        
        prepTopList(this, '#landstingSearch');
        
        d3.selectAll('path.kommun').remove();   //remove kommun shapes
        
        drawSweLan(lanShapeData, ltDataSorted);   //draw landsting on map
        defaultBarChart(ltDataBarChart);    //draw bargraph with all landsting        
        
    });

    

}); // end all 

