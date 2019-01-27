# S3EventsToSnowflake

This AWS Lambda function allows you to process S3 notification events corresponding to [Cribl](https://cribl.io) file deliveries. The events are 
forwarded to Snowpipe, where the files can then be loaded into Snowflake tables.


# REQUIREMENTS
1. Snowpipe configured with an external stage (ie the S3 bucket where [Cribl](https://cribl.io) is writing) [follow steps 1-3 here](https://docs.snowflake.net/manuals/user-guide/data-load-snowpipe-rest-gs.html#step-1-create-a-stage-if-needed)
2. IAM Role with read permissions on S3 bucket where the Snowflake private key is located

# CONFIGURATION
To configure this Lambda function you need to:
1. Assign it an IAM role that has read access on the S3 bucket where the Snowflake private key is located
2. Provide the following environment variables:
```
  ACCOUNT         - Snowflake account, https://<account>.snowflakecomputing.com/
  USER            - username to use when authenticating with Snowpipe
  FQ_PIPE         - fully qualified pipe, e.g. mydb.myschema.pipe420
  KEY_FINGERPRINT - public key fingerprint, `desc user <username>` e.g. SHA256:+SWPnk... >
  PRIVATE_KEY     - S3 location of private key (corresponding to public key above) e.g. s3://bucket/key.priv >
```
3. Trigger this Lambda function on Put events on the stage S3 bucket
4. Check the status of the pipe, `pendingFileCount` should increase a few seconds after this function triggers.
```
# check the snowpipe status 
select SYSTEM$PIPE_STATUS('mydb.myschema.mypipe');

# check the load history, for any potential errors 
select * from table(information_schema.copy_history(TABLE_NAME=>'MyTable', START_TIME=> DATEADD(hours, -1, CURRENT_TIMESTAMP())));
```


## License

MIT License (MIT)