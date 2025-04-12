/**
 * @license
 * Iterable Google Sheets Integration
 * Copyright (c) 2025 Iterable Google Sheets Integration Contributors
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('Iterable')
      .addItem('Upload Content to Iterable', 'main')
      .addSeparator()
      .addItem('Sheet Setup', 'sheetSetup')
      .addItem('Configure API Key', 'configureApiKey')
      .addItem('Set Catalog to populate', 'setProductionCatalog')
      .addItem('Select Data Center', 'selectDataCenter')
      .addToUi();
  }
  
  function configureApiKey() {
    const ui = SpreadsheetApp.getUi();
    const response = ui.prompt('Configure API Key', 'Please enter your Iterable API Key:', ui.ButtonSet.OK_CANCEL);
  
    if (response.getSelectedButton() == ui.Button.OK) {
      const apiKey = response.getResponseText();
      PropertiesService.getDocumentProperties().setProperty('ITERABLE_API_KEY', apiKey);
      ui.alert('API Key has been saved.');
    } else {
      ui.alert('API Key configuration was canceled.');
    }
  }
  
  function setProductionCatalog() {
    const ui = SpreadsheetApp.getUi();
    const response = ui.prompt('Set Production Catalog', 'Please enter the Production Catalog name:', ui.ButtonSet.OK_CANCEL);
  
    if (response.getSelectedButton() == ui.Button.OK) {
      const productionCatalog = response.getResponseText();
      PropertiesService.getDocumentProperties().setProperty('PRODUCTION_CATALOG', productionCatalog);
      ui.alert('Production Catalog has been saved.');
    } else {
      ui.alert('Production Catalog configuration was canceled.');
    }
  }
  
  function selectDataCenter() {
    const ui = SpreadsheetApp.getUi();
    const response = ui.prompt(
      'Select Data Center',
      'Please select your Iterable Data Center:\n\nUS (api.iterable.com)\nEU (api.eu.iterable.com)\n\nEnter "US" or "EU":',
      ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() == ui.Button.OK) {
      const dataCenter = response.getResponseText().toUpperCase();
      if (dataCenter === 'US' || dataCenter === 'EU') {
        PropertiesService.getDocumentProperties().setProperty('ITERABLE_DATA_CENTER', dataCenter);
        ui.alert('Data center has been saved.');
      } else {
        ui.alert('Invalid selection. Please enter either "US" or "EU".');
      }
    } else {
      ui.alert('Data center selection was canceled.');
    }
  }
  
  function getApiBaseUrl() {
    const dataCenter = PropertiesService.getDocumentProperties().getProperty('ITERABLE_DATA_CENTER') || 'US';
    return dataCenter === 'EU' ? 'https://api.eu.iterable.com' : 'https://api.iterable.com';
  }
  
  function main() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheetName = 'config-campaignContent';
    const campaignContentSheetName = 'campaignContent';
  
    const apiKey = PropertiesService.getDocumentProperties().getProperty('ITERABLE_API_KEY');
    const productionCatalog = PropertiesService.getDocumentProperties().getProperty('PRODUCTION_CATALOG');
    const apiBaseUrl = getApiBaseUrl();
  
    if (!apiKey || !productionCatalog) {
      SpreadsheetApp.getUi().alert('Please configure the API key and production catalog first.');
      return;
    }
  
    const apiUrl = `${apiBaseUrl}/api/catalogs/${productionCatalog}/items`;
  
    const configSheet = ss.getSheetByName(configSheetName);
    if (!configSheet) {
      SpreadsheetApp.getUi().alert(`Please create a sheet named "${configSheetName}"`);
      return;
    }
  
    // Get all data and skip the header row
    const configData = configSheet.getDataRange().getValues();
    const configMap = configData.slice(1).reduce((map, row) => {
      if (row[0] && row[0].toLowerCase() !== 'key') {
        map[row[0]] = { dataType: row[1], source: row[2] };
      }
      return map;
    }, {});
  
    if (!setCatalogFieldMappings(configSheet, apiKey, productionCatalog)) {
      SpreadsheetApp.getUi().alert('Error mapping fields to the catalog. Please check the logs.');
      return;
    }
  
    const campaignContentSheet = ss.getSheetByName(campaignContentSheetName);
    if (!campaignContentSheet) {
      SpreadsheetApp.getUi().alert(`Please create a sheet named "${campaignContentSheetName}"`);
      return;
    }
  
    const campaignContentData = campaignContentSheet.getDataRange().getValues();
    const headers = campaignContentData[0];
  
    const campaignContentColIndex = headers.reduce((map, header, index) => {
      map[header] = index;
      return map;
    }, {});
  
    for (const header of headers) {
      if (!configMap[header] && header.toLowerCase() !== 'key') {
        SpreadsheetApp.getUi().alert(`Please ensure all fields are defined in "${configSheetName}"`);
        return;
      }
    }
  
    let batch = [];
    let batchSize = 1000;
    let allDocuments = [];
  
    for (let i = 1; i < campaignContentData.length; i++) {
      const row = campaignContentData[i];
      const key = row[0];  // Use this as the unique identifier, but don't include it as part of the document data.
      let document = {};
  
      for (const [field, config] of Object.entries(configMap)) {
        if (field.toLowerCase() === 'key') continue;  // Skip the 'key' field to avoid adding it to the payload
        const colIndex = campaignContentColIndex[field];
        const value = row[colIndex];
  
        if (config.dataType === 'object' && config.source) {
          document[field] = fetchSourceData(config.source, row, campaignContentColIndex);
        } else {
          switch (config.dataType.toLowerCase()) {
            case 'boolean':
              // Convert various true/false representations to actual boolean values
              if (typeof value === 'boolean') {
                document[field] = value;
              } else if (value && typeof value === 'string') {
                const lowercaseValue = value.toLowerCase().trim();
                if (lowercaseValue === 'true' || lowercaseValue === 'yes' || lowercaseValue === '1') {
                  document[field] = true;
                } else if (lowercaseValue === 'false' || lowercaseValue === 'no' || lowercaseValue === '0') {
                  document[field] = false;
                } else {
                  SpreadsheetApp.getUi().alert(`Invalid boolean value for field "${field}": ${value}`);
                  return;
                }
              } else if (typeof value === 'number') {
                document[field] = value !== 0;
              } else {
                SpreadsheetApp.getUi().alert(`Invalid boolean value for field "${field}": ${value}`);
                return;
              }
              break;
            case 'date':
              try {
                if (value instanceof Date) {
                  document[field] = value.toISOString();
                } else if (typeof value === 'string') {
                  const date = new Date(value);
                  if (isNaN(date.getTime())) {
                    throw new Error('Invalid date');
                  }
                  document[field] = date.toISOString();
                } else {
                  throw new Error('Invalid date format');
                }
              } catch (e) {
                SpreadsheetApp.getUi().alert(`Invalid date value for field "${field}": ${value}`);
                return;
              }
              break;
            case 'geo_location':
              try {
                if (typeof value === 'string') {
                  const geoData = JSON.parse(value);
                  if (!geoData.latitude || !geoData.longitude) {
                    throw new Error('Missing latitude or longitude');
                  }
                  document[field] = geoData;
                } else {
                  throw new Error('Invalid geo_location format');
                }
              } catch (e) {
                SpreadsheetApp.getUi().alert(`Invalid geo_location value for field "${field}": ${value}`);
                return;
              }
              break;
            case 'long':
              try {
                const longValue = parseInt(value);
                if (isNaN(longValue)) {
                  throw new Error('Invalid long value');
                }
                document[field] = longValue;
              } catch (e) {
                SpreadsheetApp.getUi().alert(`Invalid long value for field "${field}": ${value}`);
                return;
              }
              break;
            case 'double':
              try {
                const doubleValue = parseFloat(value);
                if (isNaN(doubleValue)) {
                  throw new Error('Invalid double value');
                }
                document[field] = doubleValue;
              } catch (e) {
                SpreadsheetApp.getUi().alert(`Invalid double value for field "${field}": ${value}`);
                return;
              }
              break;
            case 'string':
              document[field] = String(value);
              break;
            case 'array':
              try {
                if (Array.isArray(value)) {
                  document[field] = value;
                } else if (typeof value === 'string') {
                  document[field] = JSON.parse(value);
                  if (!Array.isArray(document[field])) {
                    throw new Error('Not an array');
                  }
                } else {
                  throw new Error('Invalid array format');
                }
              } catch (e) {
                SpreadsheetApp.getUi().alert(`Invalid array value for field "${field}": ${value}`);
                return;
              }
              break;
            case 'object':
              try {
                if (typeof value === 'object' && value !== null) {
                  document[field] = value;
                } else if (typeof value === 'string') {
                  document[field] = JSON.parse(value);
                  if (typeof document[field] !== 'object' || document[field] === null) {
                    throw new Error('Not an object');
                  }
                } else {
                  throw new Error('Invalid object format');
                }
              } catch (e) {
                SpreadsheetApp.getUi().alert(`Invalid object value for field "${field}": ${value}`);
                return;
              }
              break;
            default:
              SpreadsheetApp.getUi().alert(`Unsupported data type for field "${field}": ${config.dataType}`);
              return;
          }
        }
      }
  
      // Add the key separately, but do not include it in the document data sent to Iterable
      batch.push({ key, ...document });
  
      if (batch.length === batchSize || i === campaignContentData.length - 1) {
        allDocuments.push([...batch]);
        batch = [];
      }
    }
  
    for (const documentBatch of allDocuments) {
      // Prepare the payload, where the key is used only for identification
      const payload = { 
        documents: Object.fromEntries(documentBatch.map(doc => {
          const { key, ...documentData } = doc;  // Deconstruct to remove the 'key' from the data
          return [key, documentData];  // Send only the key and document data
        }))
      };
      const options = {
        method: 'post',
        contentType: 'application/json',
        headers: { 'Api-Key': apiKey },
        payload: JSON.stringify(payload)
      };
  
      let success = false;
      while (!success) {
        try {
          const response = UrlFetchApp.fetch(apiUrl, options);
          console.log(response.getContentText());
          success = true;
        } catch (e) {
          if (e.message.includes('400')) {
            console.warn('400 error encountered. Retrying with smaller batches...');
            batchSize = Math.max(1, Math.floor(batchSize / 2));
            break;
          } else if (e.message.includes('404')) {
            console.error('Catalog not found. Creating catalog...');
            createCatalog(apiKey, productionCatalog);
            main();
            return;
          } else {
            console.error('Error making API request', e);
            return;
          }
        }
      }
    }
  }
  
  function setCatalogFieldMappings(sheet, apiKey, catalogName) {
    const apiBaseUrl = getApiBaseUrl();
    const apiUrl = `${apiBaseUrl}/api/catalogs/${catalogName}/fieldMappings`;
  
    const lastRow = sheet.getLastRow();
    if (lastRow <= 2) {
      Logger.log("No data rows available for field mappings.");
      return false;
    }
  
    // Get data starting from row 2 (skipping header row)
    const fieldData = sheet.getRange(2, 1, lastRow - 2, 2).getValues();
  
    // Validate data types before creating mappings
    const validDataTypes = ['boolean', 'date', 'geo_location', 'long', 'double', 'string', 'array', 'object'];
    const invalidRows = fieldData.filter(row => !validDataTypes.includes(row[1].toLowerCase()));
    
    if (invalidRows.length > 0) {
      const invalidFields = invalidRows.map(row => row[0]).join(', ');
      SpreadsheetApp.getUi().alert(`Invalid data types found for fields: ${invalidFields}\n\nValid data types are: ${validDataTypes.join(', ')}`);
      return false;
    }
  
    // Create the mappingsUpdates array in the correct format
    const mappingsUpdates = fieldData
      .filter(row => row[0] && row[0].toLowerCase() !== 'key')
      .map(row => ({
        fieldName: row[0].trim(),
        fieldType: mapToIterableType(row[1])
      }));

    if (mappingsUpdates.length === 0) {
      SpreadsheetApp.getUi().alert('No valid field mappings found. Please check your configuration.');
      return false;
    }

    // Log the request payload for debugging
    Logger.log('Request URL: ' + apiUrl);
    Logger.log('Request Headers: ' + JSON.stringify({ "Api-Key": apiKey }));
    Logger.log('Request Body: ' + JSON.stringify({ mappingsUpdates }));
  
    const requestBody = { mappingsUpdates };
  
    const options = {
      method: "put",
      contentType: "application/json",
      headers: { 
        "Api-Key": apiKey,
        "Accept": "application/json"
      },
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true,
    };
  
    try {
      const response = UrlFetchApp.fetch(apiUrl, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();
      const responseHeaders = response.getAllHeaders();
      
      Logger.log(`Response Code: ${responseCode}`);
      Logger.log(`Response Headers: ${JSON.stringify(responseHeaders)}`);
      Logger.log(`Response Body: ${responseText}`);
      
      if (responseCode !== 200) {
        let errorMessage = `Error setting field mappings (HTTP ${responseCode}): ${responseText}`;
        if (responseCode === 401) {
          errorMessage = 'Authentication failed. Please check your API key.';
        } else if (responseCode === 403) {
          errorMessage = 'Access denied. Please check your API key permissions.';
        } else if (responseCode === 404) {
          errorMessage = 'Catalog not found. Please check the catalog name.';
        } else if (responseCode === 500) {
          errorMessage = 'Server error. Please try again in a few minutes. If the problem persists, contact Iterable support.';
        }
        SpreadsheetApp.getUi().alert(errorMessage);
        return false;
      }
      
      return true;
    } catch (error) {
      Logger.log(`Error setting field mappings: ${error.message}`);
      Logger.log(`Error stack: ${error.stack}`);
      SpreadsheetApp.getUi().alert(`Error setting field mappings: ${error.message}`);
      return false;
    }
  }
  
  function mapToIterableType(dataType) {
    switch (dataType.toLowerCase()) {
      case 'boolean':
        return 'boolean';
      case 'date':
        return 'date';
      case 'geo_location':
        return 'geo_location';
      case 'long':
        return 'long';
      case 'double':
        return 'double';
      case 'string':
        return 'string';
      case 'array':
        return 'array';
      case 'object':
        return 'object';
      default:
        return 'string';
    }
  }
  
  function createCatalog(apiKey, catalogName) {
    const apiUrl = `https://api.iterable.com/api/catalogs/${catalogName}`;
    const payload = { name: catalogName, description: `Catalog created automatically for ${catalogName}` };
  
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Api-Key': apiKey },
      payload: JSON.stringify(payload)
    };
  
    try {
      const response = UrlFetchApp.fetch(apiUrl, options);
      console.log(`Catalog created: ${response.getContentText()}`);
    } catch (e) {
      console.error('Error creating catalog', e);
    }
  }
  
  function fetchSourceData(sourceConfig, campaignRow, campaignContentColIndex) {
    // First split by pipe to get the sheet name
    const [sheetName] = sourceConfig.split('|');
    
    // Then check if there's a comma for field mappings
    let fieldMappings;
    if (sheetName.includes(',')) {
      const [actualSheetName, mappings] = sheetName.split(',');
      sheetName = actualSheetName;
      fieldMappings = mappings;
    } else {
      fieldMappings = 'key'; // Default to using 'key' if no field mappings specified
    }

    const fieldNames = fieldMappings.split('|');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
  
    const sourceColIndex = headers.reduce((map, header, index) => {
      map[header] = index;
      return map;
    }, {});
  
    const campaignKey = fieldNames.map(field => campaignRow[campaignContentColIndex[field]]).join('');
  
    return data.slice(1)
      .filter(row => fieldNames.map(field => row[sourceColIndex[field]]).join('') === campaignKey)
      .map(row => headers.reduce((obj, header, index) => {
        if (!fieldNames.includes(header)) obj[header] = row[index];
        return obj;
      }, {}));
  }
  
  function sheetSetup() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheetName = 'config-campaignContent';
    const campaignContentSheetName = 'campaignContent';
    let actionTaken = false;
    let message = '';

    // Check and create campaignContent sheet if needed
    let campaignContentSheet = ss.getSheetByName(campaignContentSheetName);
    if (!campaignContentSheet) {
      campaignContentSheet = ss.insertSheet(campaignContentSheetName);
      campaignContentSheet.getRange('A1').setValue('key');
      actionTaken = true;
      message += 'Created campaignContent sheet with key column.\n';
    }

    // Check and create config-campaignContent sheet if needed
    let configSheet = ss.getSheetByName(configSheetName);
    if (!configSheet) {
      configSheet = ss.insertSheet(configSheetName);
      configSheet.getRange('A1:C1').setValues([['Field', 'DataType', 'Source']]);
      
      // Create data validation rule for DataType column
      const dataTypeRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['string', 'date', 'double', 'long', 'boolean', 'object'], true)
        .build();
      
      // Apply the validation rule to column B starting from row 2
      configSheet.getRange('B2:B').setDataValidation(dataTypeRule);
      
      actionTaken = true;
      message += 'Created config-campaignContent sheet with headers and data type dropdowns.\n';
    }

    if (!actionTaken) {
      message = 'Both sheets already exist. No changes were made.';
    }

    SpreadsheetApp.getUi().alert(message);
  }
  