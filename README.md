# StripePaymentsPCF
This is a simple PCF control with a combination of Power Automate that allows customers to make credit card payments in Canvas Power Apps using Stripe.

## What is Stripe?
Stripe is a 3rd party payment services provider that facilitate secure credit card payments. It provides a suite of APIs that can be used to integrate it in various e-commerce applications for powering online payment processing.
## Integration with PowerApps
In order to integrate Stripe with a PowerApps application, we need to use PCF (PowerApps Component Framework) along with a Power Automate.
We will see usage of this PCF control in a canvas app.
## Install and Use
As a first step, create a Stripe account here: https://dashboard.stripe.com/register
Initially your account would be in test mode and provide test keys to test the integration out. Once you achieve this successfully, activate your account to convert it into production mode and start the real time transactions.
It's free to sign up for Stripe, i.e. there are no subscription or license charges. Stripe charges a credit card processing fee for each transaction based on the countries. This can be checked on their website.

### A.Directly use Solution Package:
#### 1. Import as a solution package
Download and import the unmanaged solution package: [StripePaymentComponent_1_0_0_2.zip](./StripePaymentComponent_1_0_0_2.zip).

As a result, you should get the solution StripePaymentComponent containing:
* Power Automate:  Stripe_GetPaymentIntent
* Code PCF component:  damco_PCFStripeIntegrationNamespace.PCFStripeIntegration
* Demo canvas Power App StripePCFDemo using the above two
* There are other some other supporting components in the solution listed below:
  - Connection Reference: CR_Outlook365_Damco --> This Connection Reference is for setting up Office 365 outlook connector, used in Power Automate for sending mails to Admins in case there is some issue with the flow. Set this up while importing the solution in your environment.
  - Environment Variable: EV_StripePublishedKey --> Environment variable for storing Stripe published key. You can get this value from Stripe Dashboard.
  - Environment Variable: EV_StripeSecretKey --> Environment variable for storing Stripe secret key. You can get this value from Stripe Dashboard.
#### 2. Set up Environment variables
Set Stripe published and secret keys in default value section of environment variables EV_StripePublishedKey and EV_StripeSecretKey respectively.
#### 3. Set up the Power Automate “Stripe_GetPaymentIntent”
The Power Automate will interact with Payment Intent API of Stripe through HTTP request and returns the Payment Intent object including the client_secret value, which is then used by the PCF payment control. The flow requires the API secret key to be provided as part of the establishing a connection. 
Follow below steps to configure the flow:
* In Http action, in **Headers**, specify below parameters:
**Key**: Authorization
**Value**: Bearer **EV_StripeSecretKey** (Select the Stripe key environment variable from dynamic content section)
<img width="800" alt="Get stripe secret key" src="https://user-images.githubusercontent.com/104307363/206860009-e75fde90-ac1e-4925-ae0b-a1815a3016d6.png">

* In HTTP action, in **URI**, specify below 3 parameters which would be sent from PowerApps as inputs of this flow: 
              amount: From PowerApps (stored in a variable)
              currency: "inr",   (Specify as per requirement. Check the supported currencies here: https://stripe.com/docs/currencies )
              description: "test payment" (optional parameter) 
              
  <img width="700" alt="Power automate flow configuration" src="https://user-images.githubusercontent.com/104307363/206860265-a68ca4c0-9e68-4130-8b3a-f665db245ee2.png">

***NOTE**: All API requests expect amounts to be provided in a currency’s smallest unit. For example, to charge 10 USD, provide an amount value of 1000 (that is, 1000 cents). Same is the case with Euro. One euro is made up of 100 cents.
#### 4.Setup the code component “PCF_StripeIntegration”
** Test the integration using app present in the solution first and then proceed with below steps to integrate it in your app.

1. Open you canvas app in edit mode
2. Go to the screen where you want to add this payment control.
3. Import the PCF control:
    - Select Insert icon from left menu and click on ‘Get more components’
    <img width="300" height = "400" alt="Get more components" src="https://user-images.githubusercontent.com/104307363/206860319-e1952a07-2944-40dc-8e46-1972846388cb.png">

    - A side panel ‘Import Components’ will open, select ‘Code’ tab from there and select the PCF_StripeIntegration component and import it.
    <img width="299" alt="Import components" src="https://user-images.githubusercontent.com/104307363/206860397-c1583539-f8cd-4d98-97fa-bc62b3116ab9.png">

    - Again select Insert icon from left menu, go to ‘Code Components’, find the component and add it to the screen
    <img width="300" height = "400" alt="Code Components" src="https://user-images.githubusercontent.com/104307363/206860399-a29d2eb8-81bf-450a-88bd-1d11a74ae123.png">

4. Set up the StripeClientKey property of the component with the Publishable key from your Stripe account.
<img width="800" alt="Get Stripe client key" src="https://user-images.githubusercontent.com/104307363/206860407-16908840-a9fe-4696-841c-9a45a0527c3b.png">

5. Get the PaymentIntent object when the payment amount is known. Run the “Stripe_GetPaymentIntent” flow from the powerapps once you click on the Send Order button.
`Set(var_PaymentintentClientSecret,Stripe_GetPaymentIntent.Run(ctxvar_cartSparePartsTotal).paymentintentsecret)`
6. Set the property PaymentIntentClientSecret property of Stripe component to client secret returned by flow and saved in variable - var_PaymentintentClientSecret.
<img width="417" alt="Set paymentintent client secret property" src="https://user-images.githubusercontent.com/104307363/206860462-0ecef15b-2966-40d7-98fe-91f8a0cc1a23.png">

7. Handle the payment events – success and errors – with OnChange property of the component by verifying the PaymentStatus attribute, e.g.
<img width="480" alt="Onchange event" src="https://user-images.githubusercontent.com/104307363/206860465-6792d475-992c-43cc-b0d5-cb7a53c6fce3.png">

8. If the configuration is done successfully, below payment UI will open once you click on Send Order button
<img width="378" alt="Payment form" src="https://user-images.githubusercontent.com/104307363/206860473-5ccf8206-a95b-4f4e-b167-f0eeb7ab1917.png">

9. For test integration, you can use the card number "**4242424242424242**" with any future expiry date and any 3 digit CVV code. See here for more test cards: https://stripe.com/docs/testing 

### B.Download the source code and customize:
If you want to start from scratch and deploy your own version of this control, then you can download the source code instead of package, make the changes and deploy to required environments.
**Prerequisites:**
Install below tools to setup your system for PowerApps component framework development and customization.
* Node.js -- Install LTS version of Node js - https://nodejs.org/en/download/  
* Windows OS
* VS Code -- https://code.visualstudio.com/download 
* PowerApps CLI -- Refer this article for installation instructions: https://docs.microsoft.com/en-us/powerapps/developer/common-data-service/powerapps-cli 

**STEPS:**

1. Clone the repository https://github.com/Damco-Low-Code/DamcoStripePCF into a local folder.
2. Run the below command in the same folder to install npm packages used in the solution:

   `npm install`
   
3. Run below command to build the solution:

   `npm run build`
   
4. For deployment:
* a. Run below command to create an authentication profile that will link you to the target power platform environment:

  ` pac auth create --url <Instance URL>`
  
  ![image](https://user-images.githubusercontent.com/104307363/206860924-46650149-e653-4b33-9e0d-8a7fc9ea1f4f.png)

* b. Deploy the control with an unmanaged solution to the given environment using below command:  (Navigate to your control's directory and then run this command)
  
  `pac pcf push --publisher-prefix <prefix name>`
  
  *prefix name will be the publisher prefix that would be attached to this control
  
**Follow below links for more detailed instructions on how to:**
  * Build and test the component: https://docs.microsoft.com/en-us/powerapps/developer/component-framework/implementing-controls-using-typescript
  * Package and deploy the component: https://docs.microsoft.com/en-us/powerapps/developer/component-framework/import-custom-controls
