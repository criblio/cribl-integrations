# S3LogsToCribl

This AWS Lambda function allows you to process S3 notification events corresponding to log file deliveries. The files are read and parsed 
by this function and delivered to your Cribl instance, where you can do further processing, cloning, filtering etc and finally route these
events to their final destination.

# REQUIREMENTS
1. Cribl instance with HTTP input enabled 
2. IAM Role with read permissions on S3 Buckets from which this Lambda function will receive events 

# CONFIGURATION
To configure your Lambda function you need to:
1. Assign it an IAM role that has read access on the S3 buckets where logs are being stored 
2. Provide the following two environment variables:
```
CRIBL_URL - URL where to send events, eg https://cribl.example.com:8000/cribl/_bulk
CRIBL_AUTH - the authToken set when you configured the HTTP input in your Cribl instance
```


## License

MIT License (MIT)