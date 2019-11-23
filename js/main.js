//Using D3 to create a choropleth map 
//A Fritz GEOG 575  Lab 2 - October 2019

(function(){

//pseudo global variables, attArray variable are 1st row in stateOilStaff.csv
var attrArray = [
    //"State",
    "FIPS codes",
    "2008", 
    "Production Rank in 2008",
    "2009", 
    "2010", 
    "Production Rank in 2010",
    "2010", 
    "2011", 
    "2012", 
    "Production Rank in 2012",
    "2013", 
    "2014", 
    "2015",
    "2016", 
    "2017",
    "Production Rank in 2017",
    "Number of Staff responding to oil releases",
    "Percent of staff per barrels oil produced"
];
    
var expressed = attrArray[0];  //initial attribute

//execute script when window is loaded and style block
window.onload = setMap();

function setMap(){
    var width = 960,  
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
    .defer(d3.csv, "data/stateOilStaff.csv")
   // .defer(d3.csv, "data/stateOilStaff_noRanks.csv")
    .defer(d3.json, "data/states.topojson")
  //  .defer(d3.json, "data/shaleOilPlay.topojson") //shale oil basins in US
    .await(callback); 
    
    function callback(error, csvData, stateData){
        console.log("csv: ", csvData, "states: ", stateData); //correctly reads csvData as array, and stateData as object; in csvData: numbers are text and need to be converted to numbers, stateData is type:collection
     
    //translate states topojson  
    var stateData = topojson.feature(stateData, stateData.objects.states).features;
        console.log("stateD: ", stateData);  //reads correctly where stateData is object. [52].properties.NAME, where [52]is ID of stateData geojson
  
    //translate oil topojson (not implemented yet)   
/*    var oil = topojson.feature(oilPlay,{
        type: "GeometryCollection",
        geometrics: oilPlay.objects.collection.geometries
    });    
        console.log("oil", oil);*/
        
    //add state to map
    var stateRegions = map.selectAll(".stateRegions")
        .data(stateData)
        .enter()
        .append("path")
        .attr("class", function(d) {
            return "FIPS "+ d.properties.ID; //This was .properties.NAME.  but does this need to be .properties.STATEFP if I'm going to join the data by the FIPS codes rather than the state name? Let's try it out and see
        })
        .attr("d", path);
 
    //add shale oil plays to map (not implemented)   
/*    var oilRegions = map.selectAll(".oilRegions")
        .data(oilRegions)
        .enter()
        .append("path");
      */
  
    var stateRegions = joinData(csvData, stateRegions);         
    var colorScale = makeColorScale(csvData);       
 
    createDropdown(csvData);
          
    };  //end of callback function
    
}; //end of setMap
    
  //ex 2.5 and 2.6 from 2-2 Lesson 2, Drawing Graticules
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
};  //end of setGraticule (works)

//create a joinData function  
//  [].properties.id or .properties.name from states.topojson and [].FID or .STATE from csvData are primary keys.  
    
function joinData(csvData, states){
        console.log("from joinData 1st states:", states); //reads correctly here.
    
    for (var i=0; i<csvData.length; i++) {

          var csvRegion = csvData[i];
          var csvKey = csvRegion.STATE;

        console.log("from joinData csvKey: ", csvKey);  //reads csvKey here; 
 
       for (var a=0; a<states.length; a++){ //if this line runs it works runs but skips the rest of this function, still get NaN errors in colorScale and choropleth (Oriana's suggested changes not implemented yet)
         //  console.log("stateRegions length", stateRegions.length);
       
       //for (var a=0; a<56; a++){  //if this line runs throws error at var geojsonProps = stateRegions[a].properties, cannot read properties and crashes.
              
              console.log("from joinData 2nd states", states);  //reads an array here
              
              var geojsonProps = objects.states.geometries[a].properties.name;
              var geojsonKey = geojsonProps.id;
              
              console.log("from joinData state geojsonKey: ", geojsonKey); //not getting to this line here
              
              if (geojsonKey == csvKey) {
                  
                  attrArray.forEach(function(attr){
                     var val = parseFloat(csvRegion[attr]);
                    geojsonProps[attr] = val; 
                      
                  });
            };
        };     
    }; 
    
    return states;
    console.log("geojsonProps: ", geojsonProps); //doesn't get to here if line 135 is run
    console.log("csvData: ", csvData);  //doesn't get to here if line 135 is run
    
};    //end of joinData      
    
//create dropdown    
function createDropdown(csvData){
    var dropdown = d3.select("body")
        .append("div")
        .attr("class", "dropdown")
        .html("<h4>Data Selection:</h3>")
        .append("select")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });
 
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("class", "true")
        .text("Select Attribute");
    
    var attrOptions = dropdown.selectAll("options")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d})
        .text(function(d){return d});

};  //end of create dropDown
 
    
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

    
    //build array of all values of the expressed attributes
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        
        var val = parseFloat(data[i][expressed]);
        if (typeof val == 'number' && !isNaN(val)){
            domainArray.push(val)};
        console.log("val from makeColorScale function: ", val);
     //   domainArray.push(val);
    };
    console.log("domainArray:", domainArray);  //returns empty array
    
    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    console.log(clusters);  //this returns NaN
    
    //set cluster domains to mins
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove 1st value of array to create breakpoint
    domainArray.shift();
    
    //assign array of last 4 cluster mins as domain
    colorScale.domain(domainArray);
    
    return colorScale;
    
    console.log("test1"); //this is not printing to console
    
};  //returns colorScale; end of makeColorScale 
 
function setEnumerationUnits(stateRegions, map, path, colorScale) {
    var regions = map.selectAll(".regions")
        .data(stateRegions)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.stateRegions;
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
        
    var desc = stateRegions.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
    console.log("test");
}; //end of setEnumerationUnits
    
    
    
function choropleth(d, reColor) {
    var value = d.properties[expressed];
    if(value) {
        return reColor(value);
    } else {
        return "#aaa";
    };
};  //end of choropleth (doesn't quite work yet?)
    
function changeAttribute(expressed, csvData){
    d3.selectAll(".states")
        .style("fill", function(d) {
        return choropleth(d, makeColorScale(csvData));
    });
};  //end changeAttribute    
    
    
})(); //last line of main.js