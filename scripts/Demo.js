var SSID = "1HRPS7jy2CBr6-8sJJdKDztCECDSAlh27UExezewtakM";
var ORIGINAL = "Airports";
var DUPNAME = ORIGINAL + "-play";


/**
 * -- get all the data associated with a given metadata
 */
function getData () {

  // get sheet level data
  Logger.log ( getTidyValues ( "sheetDetails"));
 
  // get column level data
  Logger.log ( getTidyValues ( "municipalityColumn"));
  
  // get row level data
  Logger.log ( getTidyValues ( "originalFirstAirport"));
  
}

/**
 * -- get all the data associated with a given metadata
 * -- tidy up the return resource from the values spreadsheets API
 * @param {string} key the key
 * @return {[][]} the tidied data
 */
function getTidyValues ( key ) {
  
  // get the sheet values 
  var sheetValues = cSAM.SAM.getByDataFilters (SSID, key);
  
  // tidy them up
  return cSAM.SAM.tidyValues(sheetValues);

}

/**
 * get the data at given intersection
 */
function getCellData() {
  var ss = SpreadsheetApp.openById(SSID);
  var range = cSAM.SAM.getIntersection ( ss.getId()  , "originalFirstAirport", "municipalityColumn")(ss);
  var values;
  if (range) {
    values = range.getValues();
  }
  Logger.log (values);
  

  return ;
 
}

 /**
  * search by a given key
  */
function search () {

  // get various
  var sLevel = cSAM.SAM.searchByKey (SSID , "spreadsheetDetails");
  var shLevel = cSAM.SAM.searchByKey (SSID , "sheetDetails");
  var rowLevel = cSAM.SAM.searchByKey (SSID , "originalFirstAirport");
  var colLevel = cSAM.SAM.searchByKey (SSID , "municipalityColumn");

  Logger.log (JSON.stringify(colLevel));
  Logger.log (JSON.stringify(cSAM.SAM.tidyMatched(colLevel)));

}

function cleanUp () {
  
  // get all the things and delete them in one go
  var requests = ["spreadsheetDetails","sheetDetails","originalFirstAirport","municipalityColumn"]
   .map (function (d) {
     return {
       deleteDeveloperMetadata: {
         dataFilter:{
           developerMetadataLookup: {
           metadataKey: d
         }}
       }};
      });

  Logger.log (JSON.stringify(requests));
  if (requests.length) {
    var result = Sheets.Spreadsheets.batchUpdate({requests:requests}, SSID);
    Logger.log (JSON.stringify(result));
  }

  
}
function cleanUpUsingIds () {

  // get all the things and delete them in one go
  var requests = ["spreadsheetDetails","sheetDetails","originalFirstAirport","municipalityColumn"]
    .map (function (d) {
      return searchByKey (SSID, d);
    })
    .map (function (d) {
      return (d.matchedDeveloperMetadata || []).map (function (e) {
        return e.developerMetadata.metadataId;
      });
    })
    .reduce (function (p,c) {
      c.forEach (function (d) {
        p.push( {
          deleteDeveloperMetadata: {
            dataFilter:{
              developerMetadataLookup: {
                // we'll use the id
                metadataId: d
            }}
          }
        });
      });
      return p;
    },[]);
  Logger.log (JSON.stringify(requests));
  if (requests.length) {
    var result = Sheets.Spreadsheets.batchUpdate({requests:requests}, SSID);
    Logger.log (JSON.stringify(result));
  }

  
}

/**
 * setup some pieces of metadata
 */
function setup() {
  
  // get a sheet to play with
  var ss = SpreadsheetApp.openById(SSID);
  var original = ss.getSheetByName(ORIGINAL);
  
  // make a copy and we'll play with that
  var sheet =  copySheet();

    
  // create some meta data && take a look at the responses
  var created = createSomeMetaData();
  Logger.log (JSON.stringify (created));
  
  // actually we'll just  bother looking at the ids & key & value
  var tidy = created.replies.map(function (d) {
    return {
      id:d.createDeveloperMetadata.developerMetadata.metadataId,
      key:d.createDeveloperMetadata.developerMetadata.metadataKey,
      value:JSON.parse(d.createDeveloperMetadata.developerMetadata.metadataValue)
    };
  });
  
  Logger.log (JSON.stringify(tidy));
  
  
  // you can get by id
  var gotById = Sheets.Spreadsheets.DeveloperMetadata.get (SSID , tidy[0].id);
  Logger.log (JSON.stringify(gotById));
  
  // but mainly we'll be using search
  
  function createSomeMetaData(){

    // create some developer data 
    var requests = [{
    
      // stuff at spreadsheet level-----
      // CreateDeveloperMetadataRequest
      createDeveloperMetadata:{
        // DeveloperMetaData
        developerMetadata:{
          // DeveloperMetaDataLocation with spreadsheet scope  
          metadataKey:"spreadsheetDetails",
          metadataValue:JSON.stringify({
            writtenBy:Session.getActiveUser().getEmail(),
            createdAt:new Date().getTime()
          }),
          location:{                
            spreadsheet:true
          },
          visibility:"DOCUMENT"      
        }
      }},{
      
      // stuff at sheet level-----
      // CreateDeveloperMetadataRequest
      createDeveloperMetadata:{
        // DeveloperMetaData
        developerMetadata:{
          // DeveloperMetaDataLocation with sheet scope  
          metadataKey:"sheetDetails",
          metadataValue:JSON.stringify({
            writtenBy:Session.getActiveUser().getEmail(),
            createdAt:new Date().getTime(),
            name:sheet.getName()
          }),
          location:{                
            sheetId:sheet.getSheetId()
          },
          visibility:"DOCUMENT"      
        }
      }}, {
      
      // stuff for a row level-----
      // CreateDeveloperMetadataRequest
      createDeveloperMetadata:{
        // DeveloperMetaData
        developerMetadata:{
          // DeveloperMetaDataLocation with row scope  
          metadataKey:"originalFirstAirport",
          metadataValue:JSON.stringify({
            writtenBy:Session.getActiveUser().getEmail(),
            createdAt:new Date().getTime(),
            name:sheet.getRange("A2").getValue()
          }),
          location:{  
            dimensionRange: {
              sheetId:sheet.getSheetId(),
              dimension:"ROWS",
              startIndex:1,             //(row2)
              endIndex:2                // actually only 1 row (works like .slice)
            }
          },
          visibility:"DOCUMENT"      
        }
      }}, {
      
      // stuff for a column level-----
      // CreateDeveloperMetadataRequest
      createDeveloperMetadata:{
        // DeveloperMetaData
        developerMetadata:{
          // DeveloperMetaDataLocation with column scope  
          metadataKey:"municipalityColumn",
          metadataValue:JSON.stringify({
            writtenBy:Session.getActiveUser().getEmail(),
            createdAt:new Date().getTime()
          }),
          location:{  
            dimensionRange: {
              sheetId:sheet.getSheetId(),
              dimension:"COLUMNS",
              startIndex:6,             //(column 7)
              endIndex:7                // actually only 1 row (works like .slice)
            }
          },
          visibility:"DOCUMENT"      
        }
      }}
      
      
    ];
    
    return Sheets.Spreadsheets.batchUpdate({requests:requests},SSID);
    
  }

  
  function copySheet () {
    var sheet = ss.getSheetByName(DUPNAME);
    if (sheet) ss.deleteSheet(sheet);
    ss.setActiveSheet(original);
    sheet = ss.duplicateActiveSheet().setName(DUPNAME);
    ss.setActiveSheet(sheet);
    return sheet;
  }

  
  
}
/*-------------------CreateDeveloperMetadataRequest
{
  "developerMetadata": {
    object(DeveloperMetadata)
  },
}
*/
/*-------------------DeveloperMetaDataLocation
{
  "locationType": enum(DeveloperMetadataLocationType),

  // Union field location can be only one of the following:
  "spreadsheet": boolean,
  "sheetId": number,
  "dimensionRange": {
    object(DimensionRange)
  },
  // End of list of possible types for union field location.
}
/*-------------------DeveloperMetaData
{
  "metadataId": number,
  "metadataKey": string,
  "metadataValue": string,
  "location": {
    object(DeveloperMetadataLocation)
  },
  "visibility": enum(DeveloperMetadataVisibility),
}

/*-------------------Data Filter
{

  // Union field filter can be only one of the following:
  "developerMetadataLookup": {
    object(DeveloperMetadataLookup)
  },
  "a1Range": string,
  "gridRange": {
    object(GridRange)
  },
  // End of list of possible types for union field filter.
}
*/

/*---------------------DeveloperMetaDataLookup
{
  "locationType": enum(DeveloperMetadataLocationType),
  "metadataLocation": {
    object(DeveloperMetadataLocation)
  },
  "locationMatchingStrategy": enum(DeveloperMetadataLocationMatchingStrategy),
  "metadataId": number,
  "metadataKey": string,
  "metadataValue": string,
  "visibility": enum(DeveloperMetadataVisibility),
}
*/

/*------------------------DeveloperMetadataLocationType
DEVELOPER_METADATA_LOCATION_TYPE_UNSPECIFIED	Default value.
ROW	Developer metadata associated on an entire row dimension.
COLUMN	Developer metadata associated on an entire column dimension.
SHEET	Developer metadata associated on an entire sheet.
SPREADSHEET	Developer metadata associated on the entire spreadsheet.
*/

/*---------------------DeveloperMetaDataLookup
{
  "locationType": enum(DeveloperMetadataLocationType),

  // Union field location can be only one of the following:
  "spreadsheet": boolean,
  "sheetId": number,
  "dimensionRange": {
    object(DimensionRange)
  },
  // End of list of possible types for union field location.
}
/*---------------------DimensionRange
{
  "sheetId": number,
  "dimension": enum(Dimension),
  "startIndex": number,
  "endIndex": number,
}
*/
/*---------------------Dimension
DIMENSION_UNSPECIFIED	The default value, do not use.
ROWS	Operates on the rows of a sheet.
COLUMNS	Operates on the columns of a sheet.
*/
/*---------------------GridRange
{
  "sheetId": number,
  "startRowIndex": number,
  "endRowIndex": number,
  "startColumnIndex": number,
  "endColumnIndex": number,
}
*/
/*------------------------DeveloperMetadataLocationMatchingStrategy
DEVELOPER_METADATA_LOCATION_MATCHING_STRATEGY_UNSPECIFIED	Default value. This value must not be used.
EXACT_LOCATION	Indicates that a specified location should be matched exactly. For example, if row three were specified as a 
location this matching strategy would only match developer metadata also associated on row three. 
Metadata associated on other locations would not be considered.
INTERSECTING_LOCATION	Indicates that a specified location should match that exact location as well as any intersecting locations. For example, 
if row three were specified as a location this matching strategy would match developer metadata associated on row three as well as 
metadata associated on locations that intersect row three. 
If, for instance, there was developer metadata associated on column B, 
this matching strategy would also match that location because column B intersects row three.
*/

/*------------------------DeveloperMetadataVisibility
DEVELOPER_METADATA_VISIBILITY_UNSPECIFIED	Default value.
DOCUMENT	Document-visible metadata is accessible from any developer project with access to the document.
PROJECT	Project-visible metadata is only visible to and accessible by the developer project that created the metadata.
*/