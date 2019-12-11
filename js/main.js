//Using D3 to create a choropleth map 
//A Fritz GEOG 575  Lab 2 - November 2019

(function(){

//pseudo global variables, attArray variable are 1st row in USEmployment.csv
    var attrArray = [
        "Quarterly Establishments",
        "January Employment", 
        "February Employment",
        "March Employment", 
        "Total Quarterly Wages", 
        "Average Weekly Wage",
        "March Employment Location Quotient", 
        "Total Quarterly Location Wages Quotient"
        ];
    
    var expressed = attrArray[0];  //initial attribute
    
        //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 460,
        leftPadding = 20,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    var yScale = d3.scaleLinear()
        .range([chartHeight-10, 0])
        .domain([0, 1600000]);  //csv max is 1550398
  
//execute script when window is loaded 
window.onload = setMap();

function setMap(){
    var width = window.innerWidth * 0.5,
        height = 600;
    
    //creates container for map; 
    var map = d3.select("body")
        .append("svg")
        .attr("class", map)
        .attr("width", width)
        .attr("height", height);
    
    //creates US Albers equal area projection
    var projection = d3.geoAlbersUsa()
        .scale(1100)  //scale factor so Florida doesn't escape off the screen
        .translate([width/2, height/ 2]);
    
    var path = d3.geoPath()
        .projection(projection);
   
   //call graticule function. Style in .css 
    setGraticule(map, path); 
    
   //use d3.queue to load data
    d3.queue()
    .defer(d3.csv, "data/USEmployment1.csv") //csv attributes 
    .defer(d3.json, "data/states.topojson") //topojson states 
    .await(callback); 
    
    function callback(error, csv, states){
        console.log("csv: ", csv, "states: ", states); 
     
    //translate states topojson  
    var stateData = topojson.feature(states, states.objects.states).features;
        
    console.log("test: after translate topojson", stateData);  

  //call joinData to join csv to state geojson
    stateData = joinData(stateData, csv);  
        console.log("stateData:", stateData); 
        
    //create the colorscale    
    var colorScale = makeColorScale(csv); 
        console.log("test: after colorScale");
 
    //call setEnumerationUnits to add states to map, colored appropriately
    setEnumerationUnits(stateData, map, path, colorScale);
        
    //add the coordinated viz to page 
    setChart(csv, colorScale);
        
    //create dropdown to select different variable    
    createDropdown(csv);
          
    };  //end of callback function
    
}; //end of setMap
    
  //drawing graticules
function setGraticule(map, path){
   var graticule = d3.geoGraticule()
        .step([5, 5]);
    
    var gratBackground = map.append("path")
        .datum(graticule.outline()) 
        .attr("class", "gratBackground") 
        .attr("d", path);
    
    var gratLines = map.selectAll(".gratLines") 
            .data(graticule.lines()) 
            .enter() 
            .append("path") 
            .attr("class", "gratLines") 
            .attr("d", path); 
};  //end of setGraticule


function joinData(stateData, csv){
   //loop through csv to assign csv attribute to geojson state 
    for (var i=0; i<csv.length; i++) {
          var csvRegion = csv[i];
          var csvKey = csvRegion.state;
        
        //console.log("csvKey:", csvKey);
 
        //loop through geojson states to find correct one
       for (var a=0; a<stateData.length; a++){  

           
              var geojsonProps = stateData[a].properties;
              var geojsonKey = geojsonProps.name;
           
                    if (geojsonKey == csvKey) {
                    attrArray.forEach(function(attr){
                     var val = parseFloat(csvRegion[attr]);
                    geojsonProps[attr] = val; 
                  }); //end of .forEach function
            }; //end of if statement
        };  //end of inner for loop  
    }; //end of outer for loop
   
    console.log("line 133, states:", stateData); //values linked, but NaN
    
    return stateData;

};    //end of joinData      
    
function setEnumerationUnits(stateData, map, path, colorScale) {
    var statePath = map.selectAll(".statePath")
        .data(stateData)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "statePath " + d.properties.name;
        })
        .attr("d", path)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
        .on("mouseover", function(d){
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
        
    var desc = statePath.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
    console.log("test Set Enumeration");
}; //end of setEnumerationUnits
    
 function makeColorScale(data) {
     var colorClasses = [
        "#edf8e9",
        "#bae4b3",
        "#74c476",
        "#31a354",
        "#006d2c",
    ];
    
    //create color scale generator; creates scale with 5 classes
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);
    console.log(colorClasses);
    
    //build array of all values of the expressed attributes
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        if (typeof val == 'number' && !isNaN(val)){
            domainArray.push(val)};
    };//end of for loop

     console.log("domainArray:", domainArray);
    
    //CLUSTER THROWING AN ERROR cluster data using ckmeans clustering algorithm to create natural breaks
/*    var clusters = ss.ckmeans(domainArray, 5);

    
    //set cluster domains to mins
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });*/
    //remove 1st value of array to create breakpoint
    domainArray.shift();
    
    //assign array of last 4 cluster mins as domain
    colorScale.domain(domainArray);
    
    return colorScale;
    
    console.log("test1"); //
    
};  // end of makeColorScale 
 
function choropleth(props, colorScale) {
    var val = parseFloat(props[expressed]);
        if (typeof val == 'number' && !isNaN(val) && val !== 0){
            return colorScale(val);
        } else {
            return "#808080";
        };
};  //end of choropleth 
 
function setChart(csv, colorScale){
    // chart frame dimensions set in global var

    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
   
    //chart background
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);   
     
    //set bars for each province using linear y-scale and adjustable height accordign to values
    var bars = chart.selectAll(".bar")
        .data(csv)
        .enter()
        .append("rect")
        .sort(function(a,b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.state;
        })
        .attr("width", chartInnerWidth / csv.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
    
    var desc = bars.append("desc").text('{"stroke": "none", "stroke-width": "0px"}');
    
    var chartTitle = chart.append("text")
        .attr("x", 20)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Variable " + expressed[3] + " in each state");
    

    //Either choose axis generator or Numbers on bars
    var yAxis = d3.axisLeft()
        .scale(yScale);
    
    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);  //axis generator
 
     
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);  
    
    //set bar position, heights and colors
    updateChart(bars, csv.length, colorScale);
    
};  //end of setChart
    
//create dropdown    
function createDropdown(csv){
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csv)
        });
 
    //initial option in dropdown
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Statistic")
        .on("change", function(){
            changeAttribute(this.value, csv)
        });
    
    //add attribute name options    
    var attrOptions = dropdown.selectAll("Attroptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d})
        .text(function(d){return d});

};  //end of createdropDown    
    
 //event listener for dropdown
function changeAttribute(attribute, csv){
    expressed = attribute;
    
         // change yscale dynamically
    csvmax = d3.max(csv, function(d) {return           parseFloat(d[expressed]); });
    console.log(csvmax);
    
    yScale = d3.scaleLinear()
        .range([chartHeight - 10, 0])
        .domain([0, csvmax*1.1]);
    
    //update vertical axis
    d3.select(".axis").remove();
    var yAxis = d3.axisLeft()
        .scale(yScale);
    
    //place axis on chart
    var axis = d3.select(".chart")
        .append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
        
    var colorScale = makeColorScale(csv);
    
    //recolor enumeration units on map
    var regions = d3.selectAll(".regions")
        .style("fill", function(d){
        return choropleth(d.properties, colorScale)
    });
    
    //resort, resize and recolor bars in chart
    var bars = d3.selectAll(".bar")
        .sort(function (a,b){  //re-sort bars
            return b[expressed] - a[expressed];
        })
        .transition()
        .delay(function(d,i){
            return i * 20
        })
        .duration(500);
    
    
    updateChart(bars, csv.length, colorScale);
    
}; //end of changeAttribute   

function updateChart(bars, n, colorScale) {
    bars.attr("x", function(d,i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        .attr("height", function(d, i){
            if (yScale(parseFloat(d[expressed])) >= 0){
                return (chartHeight-10) - yScale(parseFloat(d[expressed]))};
            })
        .attr("y", function(d, i){
            if (yScale(parseFloat(d[expressed])) >= 0){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;}
        })
        .style("fill", function(d){
        return choropleth(d, colorScale);
        });
    
    var chartTitle = d3.select(".chartTitle")
        .text("Number of variable " + expressed[3] + " in each region");
    
};  //end of updateChart
    
function highlight(props){
    var selected = d3.selectAll("." + props.name)
        .style("stroke", "yellow")
        .style("stroke-width", "2");
    
    setLabel(props);  
    
}; //end of highlight
    
function dehighlight(props){
    var selected = d3.selectAll("." + props.name)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });
    
    d3.select(".infolabel")
        .remove();
    
    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();
        
        var styleObject = JSON.parse(styleText);
        
        return styleObject[styleName];
    };
}  //end of dehighlight
    
function setLabel(props){
    var labelAttribute = "<h2>" + props[expressed]+"</h2>"+ expressed;
    
    //create info label
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.name + "_label")
        .html(labelAttribute);
    
    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
} //end of setLabel   
    
function moveLabel(){
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;
    
    var x1 = d3.event.clientX +10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;
    
    //horizontal label coordinate with testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    
    //vertical label coordinate with test for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 
    
    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
    
}   //end of moveLabel 
    
    
})(); //last line of main.js