# Cognito-Tester

The cognito-tester is a simple, small, single file, web application that allows its user to test their Cognito setup. 

We often found ourselves needing an “application” that we can easily deploy to S3/CloudFront/EC2/Fargate/etc. for a quick Cognito “sanity check” before having a real application in place. Our aim is to make using the application so simple it can easily be deployed anywhere, without dependencies: just upload the file and you're done.

Once the file is deployed and opened in a web browser, users are prompted to enter information about their Cognito User Pool (Authenticated Domain, Redirect URI, User Pool ID, Client ID, and Scope) and the application will test whether their installation is working with various settings. For now, the application only follows the “Authorization code grant” flow detailed here: https://aws.amazon.com/blogs/mobile/understanding-amazon-cognito-user-pool-oauth-2-0-grants/


## Building and Running

* npm install
* npm run build
* npm run bundle
* npm run start
