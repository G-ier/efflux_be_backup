import json

# Parse the JSON schema
schema = json.loads("""
[
  {
    "Name": "clientip",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "timestamp",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "from-mobile",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "from-tablet",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "from-desktop",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "from-ios",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "from-android",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "country",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "region",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "city",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "timezone",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "src",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "dst",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "dsturl",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "funnel_id",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "ad_name",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "adset_name",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "campaign_name",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "atxt",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "campaign_id",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "adset_id",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "ad_id",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "utm_medium",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "utm_source",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "utm_id",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "utm_content",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "utm_term",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "utm_campaign",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "referer",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "sec-ch-ua",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "sec-ch-ua-platform",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "fbclid",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "x-requested-with",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "querystring",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "dnt",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "sec-ch-ua-mobile",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "vid",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "tg2",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "tg6",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "tg1",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "tg3",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "tg4",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "tg5",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "uri",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "cfn_distribution",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "event_type",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "step",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "click_id",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "adtxt",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "cloudfront-viewer-time-zone",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "path",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "act",
    "Type": "string",
    "Comment": ""
  },
  {
    "Name": "name",
    "Type": "string",
    "Comment": ""
  }
]
""")

# Map AWS Glue types to Clickhouse types
type_mapping = {
    "string": "String",
    # Add more mappings as needed
}

# Construct the CREATE TABLE statement
table_definition = "CREATE TABLE my_table (\n"
partition_keys = []

for item in schema:
    column_name = item["Name"]
    column_type = type_mapping[item["Type"]]
    table_definition += f"    {column_name} {column_type},\n"
    if "PartitionKey" in item:
        partition_keys.append(column_name)

table_definition = table_definition.rstrip(",\n") + "\n)"

if partition_keys:
    table_definition += " PARTITION BY (" + ", ".join(partition_keys) + ")"

print(table_definition)
