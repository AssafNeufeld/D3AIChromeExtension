
/*var iFrame  = document.createElement ("iframe");
iFrame.src  = chrome.runtime.getURL ("frame.html");
document.body.insertBefore (iFrame, document.body.firstChild);

$("#exampleModal").modal()*/

function injectModal() {
    function getTemplates() {
        return new Promise(function (resolve) {
            $.ajax({
                url: chrome.runtime.getURL('/templates.html'),
                success: function (data) {
                    var $templates = $('<div></div>').append($.parseHTML(data)).find('script'),
                        templates = {};
                    $templates.each(function () {
                        templates[this.id] = this.innerHTML;
                    });
                    return resolve(templates);
                }
            });
        });
    }

    getTemplates().then(function (templates) {
        console.log(templates.template1); //<div class="template1">template1</div>
        var div = document.createElement("div");
        div.innerHTML = templates.template1;
        document.body.insertBefore(div, document.body.firstChild);
    });

    var link = document.createElement('link')
    link.href = chrome.runtime.getURL("css/bootstrap.min.css");
    link.rel = "stylesheet"
    link.type = "text/css"
    document.head.appendChild(link, document.head);

    var link = document.createElement('link')
    link.href = chrome.runtime.getURL("css/mystyle.css");
    link.rel = "stylesheet"
    link.type = "text/css"
    document.head.appendChild(link, document.head);

}

function correctFrame() {
    return ($("tr[role='row']") != null)
}

Array.prototype.clean = function (deleteValue) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == deleteValue) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
};

Array.prototype.inArray = function (element) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === element) return true;
    }
    return false;
};

// adds an element to the array if it does not already exist using a comparer 
// function
Array.prototype.pushIfNotExist = function (element) {
    if (!this.inArray(element)) {
        this.push(element);
    }
};

function getData() {

    if (!correctFrame()) {
        return;
    }

    var array = [];
    $("tr[role='row']").each(function () {
        $(this).children('td').each(function () {
            array.push($(this).text());
        })
    })

    if (array.length == 0) {
        return;
    }

    array = array.clean("");

    console.log(array);

    var json = []

    var i = 0;
    for (i = 0; i < array.length; i = i + 3) {
        json.push({ "day": array[i], "hour": array[i + 1], "value": Number(array[i + 2].replace(",", "")) });
    }

    console.log(json);

    return json;

}

function injectChart() {
    if (!correctFrame()) {
        return false;
    }
    var data = getData();
    if (data === undefined) {
        return false;
    }

    var margin = { top: 50, right: 0, bottom: 100, left: 30 },
    width = 960 - margin.left - margin.right,
    height = 430 - margin.top - margin.bottom,
    gridSize = Math.floor(width / 24),
    legendElementWidth = gridSize*2,
    buckets = 9,
    colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"], // alternatively colorbrewer.YlGnBu[9]
    days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12p"];
    

    $( "#myg" ).remove();

var svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("id", "myg");

var dayLabels = svg.selectAll(".dayLabel")
    .data(days)
    .enter().append("text")
      .text(function (d) { return d; })
      .attr("x", 0)
      .attr("y", function (d, i) { return i * gridSize; })
      .style("text-anchor", "end")
      .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
      .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

var timeLabels = svg.selectAll(".timeLabel")
    .data(times)
    .enter().append("text")
      .text(function(d) { return d; })
      .attr("x", function(d, i) { return i * gridSize; })
      .attr("y", 0)
      .style("text-anchor", "middle")
      .attr("transform", "translate(" + gridSize / 2 + ", -6)")
      .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

     
    var colorScale = d3.scale.quantile()
        .domain([0, buckets - 1, d3.max(data, function (d) { return d.value; })])
        .range(colors);

    var cards = svg.selectAll(".hour")
        .data(data, function(d) {return d.day+':'+d.hour;});

    cards.append("title");

    cards.enter().append("rect")
        .attr("x", function(d) { return (d.hour) * gridSize; })
        .attr("y", function(d) { return (d.day) * gridSize; })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("class", "hour bordered")
        .attr("width", gridSize)
        .attr("height", gridSize)
        .style("fill", colors[0]);

    cards.transition().duration(1000)
        .style("fill", function(d) { return colorScale(d.value); });

    cards.select("title").text(function(d) { return d.value; });
    
    cards.exit().remove();

    var legend = svg.selectAll(".legend")
        .data([0].concat(colorScale.quantiles()), function(d) { return d; });

    legend.enter().append("g")
        .attr("class", "legend");

    legend.append("rect")
      .attr("x", function(d, i) { return legendElementWidth * i; })
      .attr("y", height)
      .attr("width", legendElementWidth)
      .attr("height", gridSize / 2)
      .style("fill", function(d, i) { return colors[i]; });

    legend.append("text")
      .attr("class", "mono")
      .text(function(d) { return "≥ " + Math.round(d); })
      .attr("x", function(d, i) { return legendElementWidth * i; })
      .attr("y", height + gridSize);

    legend.exit().remove();

    

      return true;
    }




function openModal() {
    $("#exampleModal").modal()
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message === "inject") {
            
        }

        if (request.message === "show") {
            injectModal();
            var open = injectChart();

            if (open)
            {
                openModal();
            }
        }
    }
);