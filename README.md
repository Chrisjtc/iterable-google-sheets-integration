# 🧩 Iterable + Google Sheets Integration

This open-source Google Apps Script enables seamless synchronization of data from Google Sheets to Iterable Catalogs. Perfect for marketing teams managing product catalogs, content libraries, or any structured data that needs to be available in Iterable for personalized messaging. The integration provides an easy-to-use interface for updating catalog items directly from your spreadsheets, supporting various data types and automated field mapping.

## 🎯 Using Catalog Data in Messages

Once your data is synchronized to an Iterable catalog, you can use it in your messages in two powerful ways:

### 1. Direct Catalog Lookups
- Perfect for campaign-specific content or single item lookups
- Use the `catalogLookup` Handlebars helper in your templates
- Example for campaign content:
  ```handlebars
  {{catalogLookup "campaign_content" campaignId}}
  ```
- Access specific fields:
  ```handlebars
  {{catalogLookup "campaign_content" campaignId "headline"}}
  ```

### 2. Collections for Multiple Items
- Ideal for displaying multiple products, articles, or offers
- Create collections in Iterable to filter and sort catalog items
- Use collections to show personalized recommendations
- Example in templates:
  ```handlebars
  {{#each (catalogLookup "my_collection")}}
    <div class="item">
      <h3>{{this.title}}</h3>
      <p>{{this.description}}</p>
      <a href="{{this.url}}">Learn More</a>
    </div>
  {{/each}}
  ```

Common Use Cases:
- Campaign content management
- Product recommendations
- Article/blog post feeds
- Personalized offers
- Dynamic event listings

For more details on using catalogs in messages, see [Iterable's documentation on Catalogs and Collections](https://support.iterable.com/hc/en-us/articles/360033215032-Using-Catalogs-Collections-in-Messages).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Iterable Google Sheets Integration Contributors

---

## 🚀 Features

- Send user data from Google Sheets to Iterable
- Custom menu added to Sheets UI for easy use
- API key configuration and basic error handling
- Built with Google Apps Script, simple to extend
- Automatic sheet setup with proper configuration
- Support for multiple data types (string, date, double, long, boolean, object)
- Data validation for proper field configuration

---

## 📥 Installation

You can install this integration using one of two methods:

### Method 1: Direct Google Sheets Setup (Recommended for Non-Developers)

1. **Create a New Google Sheet**
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new blank spreadsheet

2. **Install the Script**
   - Go to `Extensions > Apps Script`
   - Delete any default code in the editor
   - Copy and paste the code from `src/main.gs` into the editor
   - Save the project (give it a name like "Iterable Integration")
   - Close the Apps Script editor

### Method 2: Using CLASP (Recommended for Developers)

1. **Install CLASP**
   - Follow the [official Google CLASP documentation](https://developers.google.com/apps-script/guides/clasp)
   - Install Node.js (version 4.7.4 or later)
   ```bash
   npm install -g @google/clasp
   clasp login
   ```

2. **Clone this Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/iterable-google-sheets-integration.git
   cd iterable-google-sheets-integration
   ```

3. **Create a New Google Sheet**
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new blank spreadsheet
   - Copy the spreadsheet ID from the URL (the long string between /d/ and /edit)

4. **Create and Link the Apps Script Project**
   ```bash
   clasp create --type sheets --title "Iterable Integration" --parentId "YOUR_SPREADSHEET_ID"
   clasp push
   ```

5. **Enable the Apps Script API**
   - Visit [Google Apps Script API](https://script.google.com/home/usersettings)
   - Enable the Google Apps Script API

6. **Deploy the Script**
   ```bash
   clasp deploy
   ```

### Post-Installation Setup (Required for Both Methods)

1. **Configure Iterable API Key**
   - Return to your Google Sheet
   - Click `Iterable > Configure API Key`
   - Paste your Iterable API key when prompted

2. **Select Data Center**
   - Click `Iterable > Select Data Center`
   - Choose your Iterable data center (US or EU) - US is the default if not specified
   - If you're unsure, leave as US

3. **Set Catalog Name**
   - Click `Iterable > Set Catalog to populate`
   - Enter your catalog name
   - Note: The catalog must exist in Iterable. If it doesn't:
     1. Log into your Iterable account
     2. Navigate to Content > Catalogs
     3. Click "Create Catalog"
     4. Enter the same name you plan to use in the integration
     5. Save the catalog (it can be empty)

4. **Initialize Sheets**
   - Click `Iterable > Sheet Setup`
   - This will create the required sheets with proper configuration

> **Note for Developers**: When using CLASP, you can make local changes and push them to the sheet using `clasp push`. Use `clasp pull` to get the latest version from Google Sheets.

---

## 🧪 Sheet Configuration

### campaignContent Sheet
- Contains your actual data
- First column must be named "key" (automatically created)
- Add additional columns as needed for your data

### config-campaignContent Sheet
- Contains field configuration that defines how your data will be structured in Iterable
- Three columns: Field, DataType, Source
- DataType column has a dropdown with options:
  - string
  - date
  - double
  - long
  - boolean
  - object

#### Adding New Fields
1. **Add Field Configuration**
   - Add a new row in the config-campaignContent sheet
   - In the "Field" column, enter the exact name of your field (case-sensitive)
   - Select the appropriate data type from the dropdown in the "DataType" column
   - (Optional) If the field requires data from another sheet, specify the source in the "Source" column

2. **Update campaignContent Sheet**
   - Add a new column in the campaignContent sheet
   - Use the exact same field name as specified in config-campaignContent
   - Ensure the data you enter matches the specified data type

3. **Catalog Updates**
   - When you run "Upload Content to Iterable", the script will:
     - First update your Iterable catalog with the new field definitions
     - Then upload your data with the new fields
   - The catalog in Iterable will automatically reflect any new fields you add
   - Existing fields cannot be deleted from the catalog once created

Example configuration:
| Field     | DataType | Source |
|-----------|----------|--------|
| productId | string   |        |
| price     | double   |        |
| inStock   | boolean  |        |
| createdAt | date     |        |
| variants  | object   |        |

> **Important**: Field names in both sheets must match exactly. The script will validate this before uploading to Iterable.

> **Note**: Once a field is added to the catalog in Iterable, it cannot be removed. You can only add new fields or modify existing ones.

---

## 📤 Using the Script to upload content

1. **Prepare Your Data**
   - Add your data to the `campaignContent` sheet
   - Ensure the first column contains unique keys
   - Fill in other columns according to your configuration

2. **Validate Your Configuration**
   - Before uploading, verify that all fields in campaignContent are properly defined:
     1. Open the campaignContent sheet and note all column headers (except "key")
     2. Open the config-campaignContent sheet
     3. Check that each column header from campaignContent exists in the "Field" column of config-campaignContent
     4. Verify that the data type for each field is correctly set
     5. If any fields are missing, add them to config-campaignContent following the instructions in the "Adding New Fields" section
   - The script will check this validation before uploading, but it's best to verify manually first

3. **Upload to Iterable**
   - Click `Iterable > Upload Content to Iterable`
   - The script will:
     1. Validate that all fields are properly configured
     2. Update the Iterable catalog with any new fields
     3. Upload your data to Iterable
   - Check the execution log for any errors or success messages

> **Tip**: If you get an error about missing field definitions, check the config-campaignContent sheet and make sure all your campaignContent columns are properly defined there.

---

## 🌱 Example Use Cases

- Sync product catalogs to Iterable
- Update inventory status in real-time
- Manage promotional content across platforms
- Automate content updates for campaigns

---

## ⚠️ Troubleshooting

If you encounter issues:

1. **API Key Issues**
   - Verify your API key is correct
   - Check if the key has proper permissions
   - Ensure you've selected the correct data center

2. **Sheet Configuration**
   - Use the Sheet Setup option to recreate sheets if needed
   - Verify all required columns exist
   - Check data types match your configuration

3. **Data Upload Issues**
   - Ensure all required fields are filled
   - Check data format matches the configured type
   - Verify the catalog name is correct

---

## 🙌 Contributing

We welcome your ideas, fixes, and enhancements!

1. Fork this repo
2. Clone it locally
3. Create a feature branch
4. Make your changes and test them
5. Submit a Pull Request 🎉

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 💬 Questions or Suggestions?

Open an [Issue](https://github.com/YOUR_USERNAME/iterable-google-sheets-integration/issues) or start a Discussion on GitHub. We'd love to hear from you!
