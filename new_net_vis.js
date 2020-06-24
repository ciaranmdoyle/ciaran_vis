//copyright Railsbank 2020


looker.plugins.visualizations.add({

  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  options: {
    radius: {
      section: "Data",
      order: 1,
      type: "number",
      label: "Circle Radius"
    },
    keyword_search: {
      section: "Data",
      order: 2,
      type: "string",
      label: "Custom keyword to search for",
      placeholder: "Enter row value to display score"
    },
    label_value: {
      section: "Data",
      order: 3,
      type: "string",
      label: "Data Labels",
      values: [
        {"On":"on"},
        {"Off":"off"}
        ],
      display: "radio",
      default: "off"
    },
    legend: {
      section: "Data",
      order: 4,
      type: "string",
      label: "Legend",
      values: [
        { "Left": "left" },
        { "Right": "right" },
        { "Off": "off"}
      ],
      display: "radio",
      default: "off"
    },
    color_range: {
      section: "Format",
      order: 1,
      type: "array",
      label: "Color Range",
      display: "colors",
      default: ["#9E0041", "#C32F4B", "#E1514B", "#F47245", "#FB9F59", "#FEC574", "#FAE38C", "#EAF195", "#C7E89E", "#9CD6A4", "#6CC4A4", "#4D9DB4", "#4776B4", "#5E4EA1"]
    },
    chart_size: {
      section: "Format",
      order: 2,
      type: "string",
      label: "Chart Size",
      default: '100%'
    },
    inner_circle_color: {
      section: "Inner Circle",
      order: 1,
      type: "string",
      label: "Circle Color",
      display: "color",
      default: "#ffffff"
    },
    text_color: {
      section: "Inner Circle",
      order: 2,
      type: "string",
      label: "Text Color",
      display: "color",
      default: "#000000"
    },
    font_size: {
      section: "Inner Circle",
      order: 3,
      type: "number",
      label: "Font Size",
      display: "range",
      min: 10,
      max: 100,
      default: 40
    }
  },
  // Set up the initial state of the visualization
  create: function(element, config) {

    var css = `
      <style>
        body {
      font: 10px sans-serif;
    }
    .axis path,
    .axis line {
      fill: none;
      stroke: #000;
      shape-rendering: crispEdges;
    }
    .bar {
      fill: orange;
    }
    .solidArc:hover {
      fill: orangered ;
    }
    .solidArc {
        -moz-transition: all 0.3s;
        -o-transition: all 0.3s;
        -webkit-transition: all 0.3s;
        transition: all 0.3s;
    }
    .x.axis path {
      display: none;
    }
    .aster-score {
      line-height: 1;
      font-weight: bold;
    }
    .d3-tip {
      line-height: 1;
      font-weight: bold;
      padding: 12px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      border-radius: 2px;
    }
    /* Creates a small triangle extender for the tooltip */
    .d3-tip:after {
      box-sizing: border-box;
      display: inline;
      font-size: 10px;
      width: 100%;
      line-height: 1;
      color: rgba(0, 0, 0, 0.8);
      content: "\\25BC";
      position: absolute;
      text-align: center;
    }
    /* Style northward tooltips differently */
    .d3-tip.n:after {
      margin: -1px 0 0 0;
      top: 100%;
      left: 0;
    }
    .legend rect {
      fill:white;
      stroke:black;
      opacity:0.8;
    }
      </style> `;

    element.innerHTML = css;
    var container = element.appendChild(document.createElement("div")); // Create a container element to let us center the text.
    this.container = container
    container.className = "d3-aster-plot";
    this._textElement = container.appendChild(document.createElement("div")); // Create an element to contain the text.
  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {
//  update: function(data, element, config, queryResponse) {
    this.container.innerHTML = ''
    // Clear any errors from previous updates
    this.clearErrors();

    // Throw some errors and exit if the shape of the data isn't what this chart needs
    if (queryResponse.fields.dimensions.length == 0) {
      this.addError({title: "No Dimensions", message: "This chart requires dimensions."});
      return;
    }

    const width = element.clientWidth
    const height = element.clientHeight
    var circleWidth =  Math.min(width, height) / 20;

    const links = [];
    const nodes = [];
    const nodeSet = new Set();
    var edgeNum;
    for (edgeNum = 0; edgeNum < data.length; edgeNum++) {
        row = data[edgeNum];
        sourceId = row[queryResponse.fields.dimensions[0].name].value
        targetId = row[queryResponse.fields.dimensions[1].name].value
        wgt = row[queryResponse.fields.measure_like[0].name]
        tmplink = {"source": sourceId, "target": targetId, "value": wgt},
        links.push(tmplink)

        if(!nodeSet.has(sourceId)){
            nodeSet.add(sourceId)
            nodes.push(
            { "id": sourceId, "group": 1}
            )
        }
        if(!nodeSet.has(targetId)){
            nodeSet.add(targetId)
            nodes.push(
            { "id": targetId, "group": 1}
            )
        }
    }
    graph

//    var width = 800;
//var height = 600;
var color = d3.scaleOrdinal(d3.schemeCategory10);

//d3.json("transaction_data.json").then(function(graph) {

var graph = {
    'nodes': nodes,
    'links': links
}
var label = {
    'nodes': [],
    'links': []
};

graph.nodes.forEach(function(d, i) {
    label.nodes.push({node: d});
    label.nodes.push({node: d});
    label.links.push({
        source: i * 2,
        target: i * 2 + 1
    });
});

console.log(label.nodes)
console.log(label.links)

var labelLayout = d3.forceSimulation(label.nodes)
    .force("charge", d3.forceManyBody().strength(-50))
    .force("link", d3.forceLink(label.links).distance(0).strength(2));

var graphLayout = d3.forceSimulation(graph.nodes)
    .force("charge", d3.forceManyBody().strength(-3000))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(1))
    .force("y", d3.forceY(height / 2).strength(1))
    .force("link", d3.forceLink(graph.links).id(function(d) {return d.id; }).distance(50).strength(1))
    .on("tick", ticked);

var adjlist = [];

graph.links.forEach(function(d) {
    adjlist[d.source.index + "-" + d.target.index] = true;
    adjlist[d.target.index + "-" + d.source.index] = true;
});

function neigh(a, b) {
    return a == b || adjlist[a + "-" + b];
}


//var svg = d3.select("#viz").attr("width", width).attr("height", height);
//var svg = d3.select(element).append("svg").attr("width", width).attr("height", height);
svg = d3.select(".d3-aster-plot").append("svg").attr("width", width).attr("height", height);
var container = svg.append("g");

svg.call(
    d3.zoom()
        .scaleExtent([.1, 4])
        .on("zoom", function() { container.attr("transform", d3.event.transform); })
);

var link = container.append("g").attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter()
    .append("line")
    .attr("stroke", "#aaa")
    .attr("stroke-width", "2px");

var node = container.append("g").attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes)
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("fill", function(d) { return color(d.group); })

node.on("mouseover", focus).on("mouseout", unfocus);

node.call(
    d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
);

var labelNode = container.append("g").attr("class", "labelNodes")
    .selectAll("text")
    .data(label.nodes)
    .enter()
    .append("text")
    .text(function(d, i) { return i % 2 == 0 ? "" : '...'.concat(d.node.id.substr(d.node.id.length - 5)); })
    .style("fill", "#555")
    .style("font-family", "Arial")
    .style("font-size", 12)
    .style("pointer-events", "none"); // to prevent mouseover/drag capture

node.on("mouseover", focus).on("mouseout", unfocus);

function ticked() {

    node.call(updateNode);
    link.call(updateLink);

    labelLayout.alphaTarget(0.3).restart();
    labelNode.each(function(d, i) {
        if(i % 2 == 0) {
            d.x = d.node.x;
            d.y = d.node.y;
        } else {
            var b = this.getBBox();

            var diffX = d.x - d.node.x;
            var diffY = d.y - d.node.y;

            var dist = Math.sqrt(diffX * diffX + diffY * diffY);

            var shiftX = b.width * (diffX - dist) / (dist * 2);
            shiftX = Math.max(-b.width, Math.min(0, shiftX));
            var shiftY = 16;
            this.setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
        }
    });
    labelNode.call(updateNode);

}

function fixna(x) {
    if (isFinite(x)) return x;
    return 0;
}

function focus(d) {
    var index = d3.select(d3.event.target).datum().index;
    node.style("opacity", function(o) {
        return neigh(index, o.index) ? 1 : 0.1;
    });
    labelNode.attr("display", function(o) {
      return neigh(index, o.node.index) ? "block": "none";
    });
    link.style("opacity", function(o) {
        return o.source.index == index || o.target.index == index ? 1 : 0.1;
    });
}

function unfocus() {
   labelNode.attr("display", "block");
   node.style("opacity", 1);
   link.style("opacity", 1);
}

function updateLink(link) {
    link.attr("x1", function(d) { return fixna(d.source.x); })
        .attr("y1", function(d) { return fixna(d.source.y); })
        .attr("x2", function(d) { return fixna(d.target.x); })
        .attr("y2", function(d) { return fixna(d.target.y); });
}

function updateNode(node) {
    node.attr("transform", function(d) {
        return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
    });
}

function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
    if (!d3.event.active) graphLayout.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) graphLayout.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}


}
});
