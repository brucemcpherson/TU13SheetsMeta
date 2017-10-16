var SAM = (function (ns) {

  /**
   * get datafilters for the latest result
   * @param {object} searchResult
   * @return {object[]} dataFilters
   */
  ns.getLatestDataFilters = function (searchResult) {
  
    var dm = searchResult.matchedDeveloperMetadata;
    
    //use the last search result
    return dm && dm.length && 
        dm[dm.length-1].dataFilters && dm[dm.length-1].dataFilters.length && 
        dm[dm.length-1].dataFilters;
  
  }; 
  /**
   * return the data defined by the key
   * return the Last
   * @param {string} ssId the ssid
   * @param {string} key the key
   * @return {replies || null}
   */
  ns.getByDataFilters = function  (ssId, key) {

    // get the metadata for the key
    var meta = ns.searchByKey (ssId , key);
  
    // tidy that up and use latest
    var dataFilters = ns.getLatestDataFilters (meta);
      
    return dataFilters ? Sheets.Spreadsheets.Values.batchGetByDataFilter({
      dataFilters:dataFilters
    } , ssId) :  null;
    
  };
  
  /**
   * return the search results
   * @param {string} ssid the ssid
   * @param {string} key the key
   * @return {replies || null}
   */
  ns.searchByKey = function (ssId, key) {
  
    return Sheets.Spreadsheets.DeveloperMetadata.search({
      dataFilters:[{
        developerMetadataLookup: {
          metadataKey: key
        }}]
    }, ssId);

  }
  
  /**
   * tidy the get Values result - just the first one.
   * @param {object} sheetValues result from a get values
   * @return {[][]} tidied values
   */
  ns.tidyValues = function (sheetValues) {
    return sheetValues ? sheetValues.valueRanges[0].valueRange.values : null;
  };

  /**
   * tidy matched
   * @param {object} matched results returned by search
   * @return {object[]} tidied up version
   */
   ns.tidyMatched = function (matched) {
     if (!matched || !matched.matchedDeveloperMetadata  ) return [];
     
     return matched.matchedDeveloperMetadata.map(function (d) {
       var v, dm = d.developerMetadata;
       // assume value is object, but if not then return it plain
       try {
         v=JSON.parse(dm.metadataValue);
       }
       catch (err) {
         v = dm.metadataValue;
       }
       
       return {
         id:dm.metadataId,
         key:dm.metadataKey,
         visibility:dm.visibility,
         value:v,
         location:dm.location,
         locationType:dm.locationType
       };
     });
     
   };
    
   /**
    * get intersecting range
    * of two items by key
    * @param {string} ssId  we'll need the ss for this
    * @param {string} rowKey
    * @param {string} colKey
    * @return {function} a function that creates a range given an ss .. function (ss) { return ..Range}
    */
    ns.getIntersection = function (ssId, rowKey , colKey) {
      
      // do the searches and use the latest keys
      var rowMeta = ns.searchByKey (ssId , rowKey);
      var colMeta = ns.searchByKey (ssId , colKey);
      
      // tidy that up
      var rowTidy = rowMeta && ns.tidyMatched (rowMeta);
      var colTidy = colMeta && ns.tidyMatched (colMeta);
      
      // now we show have dimension ranges, just use the latest
      if (!rowTidy || !colTidy || !rowTidy.length || !colTidy.length) return function (ss) {
        return null;
      };
      
      
      var dimRow = rowTidy[rowTidy.length-1].location && 
        rowTidy[rowTidy.length-1].location.dimensionRange;
      var dimCol = colTidy[colTidy.length-1].location && 
        colTidy[rowTidy.length-1].location.dimensionRange;
      
      // do a few checks
      if (!dimRow || !dimCol || dimCol.sheetId !== dimRow.sheetId) {
            throw 'row and column sheetIds dont match';
      }
      
      if (dimRow.dimension !== "ROWS") {
        throw 'row key ' + rowKey + ' must refer to rows metadata';
      }
      
      if (dimCol.dimension !== "COLUMNS") {
        throw 'column key ' + colKey + ' must refer to columns metadata';
      }
      
      // now construct a function that can make a range
      return function (ss) {
        
        
        // first find the sheet
        var sheet = ss.getSheets().filter (function (d) {
          return d.getSheetId() === dimRow.sheetId;
        })[0];
        if (!sheet) throw 'sheet ' + dimRow.sheetId + ' was not found';
        
        // now work out the range
        return sheet.getRange (
          dimRow.startIndex +1 , 
          dimCol.startIndex +1 , 
          dimRow.endIndex - dimRow.startIndex , 
          dimCol.endIndex - dimCol.startIndex
        );
        
      };
      
      
    }
    
   
/**
[{visibility=DOCUMENT, locationType=null, location={dimensionRange={startIndex=1, endIndex=2, sheetId=2042449394, dimension=ROWS}, locationType=ROW}, id=1995368976, value={createdAt=1.50808059073E12, writtenBy=bruce@mcpher.com, name=Port Moresby Jacksons International Airport}, key=originalFirstAirport}]
[{visibility=DOCUMENT, locationType=null, location={dimensionRange={startIndex=6, endIndex=7, sheetId=2042449394, dimension=COLUMNS}, locationType=COLUMN}, id=532025850, value={createdAt=1.50808059098E12, writtenBy=bruce@mcpher.com}, key=municipalityColumn}]
*/  
  return ns;
})(SAM|| {});
