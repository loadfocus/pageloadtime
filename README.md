Performance testing and measuring of page load time
===================================================

Performance testing and measuring  the page load time of web aplications using PhantomJS and Google charts


What can these scripts measure:
    - page load time testing
    - size and number of resources retrieved for URL call
    - load time for each resource

Steps for using the script:

    -mkdir phantomjs_script
    -cd phantomjs_script
    -git init
    -git clone https://github.com/vazzolla/pageloadtime.git
    -run script: sh load.sh url_to_be_measured number_of_requests_to_be_made path_to_phantomjs http://www.google.com 30 /home/vazzolla/phantomjs_script/phantomjs_performance/phantomjs
    -after the test finishes in the same directory there will be :
        results.html which contains the chart with the results
        reports directory which contains the json file with the actual results
    -open results.html in the browser of your choice

