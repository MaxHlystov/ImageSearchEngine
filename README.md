# ImageSearchEngine  

####User Stories  
> * I can get the image URLs, alt text and page urls for a set of images relating to a given search string.  
> * I can paginate through the responses by adding a ?offset=2 parameter to the URL.  
> * I can get a list of the most recently submitted search strings.  

####Format of the search URL:  
    https://img-finder.herokuapp.com/img/text to search in url encoding
    	[?offset=number of page with result]
    	[&size=number of search results per page]

####Format of recent requests:  
	`https://img-finder.herokuapp.com/recent`
		
####Expamle of app with it:  
    Some cats: [http://codepen.io/max1c/full/JKvkQq/](http://codepen.io/max1c/full/JKvkQq/)
	
####Examples of links:  
* Find "cats": [https://img-finder.herokuapp.com/img/cats](https://img-finder.herokuapp.com/img/cats)
* Next page with found "cats": [https://img-finder.herokuapp.com/img/cats?offset=2](https://img-finder.herokuapp.com/img/cats?offset=2)
* Browse recent search queries: [https://img-finder.herokuapp.com/recent](https://img-finder.herokuapp.com/recent)

Example output for cearch results:  
```
  [{
	"url" : "https://i.ytimg.com/vi/tRzXptpC3_U/hqdefault.jpg",
	"snippet" : "funny lolcats and loldogs",
	"thumbnail" : "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcS_dKvb6pMA0bod00g0v1Bk3YakSY7H4HYwpu268AqUK8pPiSdlUh9pEnYh",
	"context" : "https://www.youtube.com/watch?v=tRzXptpC3_U"
   }, {
	"url" : "https://i.ytimg.com/vi/dWpGC6Fg0io/hqdefault.jpg",
	"snippet" : "... LOLCats Funny Cats",
	"thumbnail" : "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRNMCLSl2dHm87xTU6uMFZD0Jym2E-4lAaSdJzfc_6OkeB_CdF1vjgZZsR2",
	"context" : "https://www.youtube.com/watch?v=dWpGC6Fg0io"
  }]
```  

Example output for recent searches:  
```
  [{
	"term" : "lolcats funny",
	"when" : "2016-07-23T12:25:03.580Z"
   }, {
	"term" : "lolcats funny",
	"when" : "2016-07-23T11:43:45.083Z"
 }]
```  
