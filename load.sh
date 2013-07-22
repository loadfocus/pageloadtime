#!/bin/bash

# Builds the RESULT_HTML chart file

RESULT_HTML=results.html
rm -f $RESULT_HTML
rm -rf results*
rm -rf reports*

echo $1
echo $3

phantomprocess=$3" --local-to-remote-url-access=true --load-images=true --ignore-ssl-errors=true --web-security=false loadreport.js $1 performance json wip &"

for ((i = 0; i<$2; i++))
do
 echo "Start test"
 $phantomprocess & echo $!
 for ((j=0; j< 60;j++ ))
 do
   if ps -p $!;then
	sleep 1
   	echo "sleep 1 second" 
   fi	
 done
 if ps -p $!;then
	kill $!
 fi

done

    # Add cols
    echo "<html>
                <head>
                  <script src=\"http://code.jquery.com/jquery-1.10.0.min.js\"></script>
                  <script type=\"text/javascript\" src=\"https://www.google.com/jsapi\"></script>
                  <script type=\"text/javascript\">
                    google.load(\"visualization\", \"1\", {packages:[\"corechart\"]});
                    google.setOnLoadCallback(drawChart);

                    function drawChart() {
                        var rows = new Array();
                        var columns = new Array();

                        $.getJSON(\"reports/loadreport-wip.json\", function(data) {
                            console.log(data);

                            for (var i = 0; i < data.length; i++){
                                var singleRow = {\"c\":[ {\"v\": i },
                                    { \"node\" : \"Elapsed Load Time\", \"v\" : data[i].elapsedLoadTime },
                                    { \"nodeid\" : \"Total resources time\", \"v\" : data[i].totalResourcesTime },
                                    { \"nodeid1\" : \"Number of resources\", \"v\" : data[i].numberOfResources },
                                    { \"nodeid1\" : \"Total resources size\", \"v\" : data[i].totalResourcesSize },
                                    { \"nodeid1\" : \"DOM ready state interactive\", \"v\" : data[i].domReadystateInteractive },
                                    { \"nodeid1\" : \"DOM ready state loading\", \"v\" : data[i].domReadystateLoading },
                                    { \"nodeid1\" : \"Non reporting resources\", \"v\" : data[i].nonReportingResources }

                                ]};
	 			
                                rows.push(singleRow);
				\$('#slowest').append('<li>Run'+i + \" URL: \" +data[i].slowestResource+'</li>');
				\$('#largest').append('<li>Run'+i + \" URL: \" +data[i].largestResource+'</li>');
				for (var j = 0; j < data[i].resource.length; j++){
					\$('#resource').append('<li>Run '+i + \" URL: \" +data[i].resource[j].url+' Size: '+data[i].resource[j].size+' bytes</li>');				
				}
				\$('#resource').append('<li>**********************************************************************************************************</li>');					

                            }

                           var jsonData = {\"cols\": [
                               {\"id\":\"\",\"label\":\"commitNumber\",\"type\":\"string\"},
                               {\"id\":\"\",\"label\":\"Elapsed Load Time\",\"type\":\"number\"},
                               {\"id\":\"\",\"label\":\"Total resources time\",\"type\":\"number\"},
                               {\"id\":\"\",\"label\":\"Number of resources\",\"type\":\"number\"},
			       {\"id\":\"\",\"label\":\"Total resources size\",\"type\":\"number\"},
			       {\"id\":\"\",\"label\":\"DOM ready state interactive\",\"type\":\"number\"},
                               {\"id\":\"\",\"label\":\"DOM ready state loading\",\"type\":\"number\"},
			       {\"id\":\"\",\"label\":\"Non reporting resources\",\"type\":\"number\"}
                           ], \"rows\": rows};

                           var newData = new google.visualization.DataTable(jsonData);
                           var options = {
                                title: 'Load test results ' + data[0].url,
                                curveType: \"function\"
                              };
                           var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
                           chart.draw(newData, options);
                        });
                    }

                  </script>
              </head>
              <body>
              <div id=\"chart_div\" style=\"width: 1600px; height: 800px;\"></div>
	      Slowest resource
	      <ul id=\"slowest\"></ul>
              Largest resource
	      <ul id=\"largest\"></ul>		
	      Resource
	      <ul id=\"resource\"></ul>
              </body>
          </html>
" >> $RESULT_HTML



