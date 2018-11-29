# Service Account Setup

Get a service account JSON file from Google Cloud Console (https://console.cloud.google.com) -> IAM & Admin -> Service Accounts -> keys.

Download .json key and rename to service-account.json.  Place in /tests.  Finally, visit the client_x509_cert_url
url from the service-account.json file and paste the public cert into a file service-account.pub (replace newline 
characters with real newlines).
