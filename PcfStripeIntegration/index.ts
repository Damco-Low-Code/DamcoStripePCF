import {IInputs, IOutputs} from "./generated/ManifestTypes";
import {Stripe, StripeElements,loadStripe, StripeCardElement, StripePaymentElement, Appearance, StripeCardNumberElement} from '@stripe/stripe-js';

// Define payment status variables
const STATUS_NEW: string 		= "new";
const STATUS_ERROR: string 		= "error";
const STATUS_PROCESSING: string = "processing";
const STATUS_COMPLETED: string 	= "completed";

// Main class
export class PcfStripeIntegration implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  
  //#region Variables initialization 

  //Main Variables
  private _container:HTMLDivElement;
  private has_been_reset: boolean;
  private stripe_client_key: string;
  private payment_intent_client_secret: string;
  private payment_status: string;
  private payment_amount: string;
  private _stripe?: Stripe;
  private _elements?: StripeElements;
  private _paymentelement?: StripePaymentElement;

  // Variable to notify that there is a new value, used for updating output properties
  private _notifyOutputChanged: () => void; 

  //Variables for payment form styling
  private _appearance?: Appearance;
  private card_font_size: number;
  private button_font_size: number;
  private error_font_size: number;

  //#endregion Variables initialization

    /**
     * Empty constructor.
     */
    constructor()
    {

    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement): void
    {   
        // Set the reset property of control to false while initializing the control
        this.has_been_reset = false;
        // Set the status as new on control load
        this.payment_status = STATUS_NEW;
        this._notifyOutputChanged = notifyOutputChanged;

        // Define the html for designing payment control
       const html = `   
        <div class="sr-main">
        <div id = "sr-header">Make a payment</div>
        <div id = "sr-instructions">Fill the credit card details</div>
           <form id="payment-form" class="sr-payment-form">
               <div class="sr-input sr-card-element" id="card-number"></div>
               <div class="sr-field-error" id="card-errors" role="alert"></div>
               <button id="submit" class = "form-button">
                <span id="spinner" class='fas fa-circle-notch fa-spin hidden'></span> 
                <span id="button-text">Pay</span>
                <span id="order-amount" class = "spanClass"></span>
               </button>
               <div class="sr-field-success" id="card-success" role="alert"></div>
           </form>   
        </div>
       `;

       //Append the html to main div control on page
        this._container = document.createElement("div");
        this._container.innerHTML = html;
        container.appendChild(this._container);
      
        // Adding event listner to pay button to call the method responsible for payment processing using stripe
            const form = document.getElementById('payment-form')!;
            form.addEventListener('submit', (event)=>{
                event.preventDefault();              
                this.pay();                        
    });			
	}

      /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
       public updateView(context: ComponentFramework.Context<IInputs>): void
       {
           // Add code to update control view    
           if(this.stripe_client_key != context.parameters.StripeClientKey.raw)
           {
             this.stripe_client_key = context.parameters.StripeClientKey.raw || "";
             this.cleanupStripeClient();
       
             if(!this._stripe && this.stripe_client_key)
               this.initStripeClient();    
           }
           
           if(this.payment_intent_client_secret != context.parameters.PaymentIntentClientSecret.raw)
           {
             this.payment_intent_client_secret = context.parameters.PaymentIntentClientSecret.raw || "";
             
             // Call method to initialize payment element
             this.initStripeClient();
           }
            // Code for showing payment amount on Pay button. This amount comes from property bag
            if(this.payment_amount != context.parameters.PaymentAmount.raw)
            {
              this.payment_amount = context.parameters.PaymentAmount.raw || "";
              document.getElementById("order-amount")!.textContent = this.payment_amount;
            }
           // Code for resetting the payment control
           if(context.parameters.Reset.raw && !this.has_been_reset){
             this.payment_status = STATUS_NEW;
             this._notifyOutputChanged();
             this.has_been_reset = true;
             if(this._paymentelement)
               this._paymentelement.clear();
             this.reset();
           }
           else
             this.has_been_reset = false;             
       }
   
       /**
        * It is called by the framework prior to a control receiving new data.
        * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
        */
       public getOutputs(): IOutputs
       {
         // Return value of payment status to canvas app
         return { PaymentStatus: this.payment_status };
       }
   
       /**
        * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
        * i.e. cancelling any pending remote calls, removing listeners, etc.
        */
       public destroy(): void
       {
           // Add code to cleanup control if necessary
           this.cleanupStripeClient();
       }
  
 /* ------- Payment helper methods ------- */   

  // Method responsible for generating and initializing payment element UI
	private initStripeClient()
	{
       var stripePromise = loadStripe(this.stripe_client_key); 
       stripePromise.then( (stripe)=> {
       if(stripe){
               this._stripe = stripe;
               const clientSecret  =   this.payment_intent_client_secret;
               const appearance =  this._appearance = {
                   theme: 'stripe',
                 };
            
              this._elements = stripe.elements({clientSecret,appearance});

              this._paymentelement = this._elements.create('payment');
              this._paymentelement.mount("#card-number");

              //LoadError event triggers when the Element fails to load.
              this._paymentelement.on('loaderror', (event)=>{
              const displayError = document.getElementById('card-errors');
				      if(displayError)
						     displayError.innerText = (event.error) ? event.error.message! : "";	
              });
        }
       });
			document.querySelector("#payment-form")!.classList.remove("hidden");
	}

  // Destroy the payment element
  private cleanupStripeClient()
	{
		document.querySelector("#payment-form")!.classList.add("hidden");
		if(this._paymentelement)
			this._paymentelement.destroy;

		this._elements = undefined;
		this._stripe = undefined;
	}

   // Method resposible for processing payment using Stripe
   private pay()
   { 
     //Disable the Pay button while payment is processing
     this.changeLoadingState(true);

     // Set the payment status as processing
     this.payment_status = STATUS_PROCESSING;
     this._notifyOutputChanged();

     // Logic for payment processing
     try
     {
      if(!this._stripe)
				if(this.stripe_client_key)
					this.initStripeClient();
				else
          this.showError("ERROR: No PaymentIntentClientSecret specified.Please refresh the app and try again. If the error persists,contact your technical team.");

       if(this._stripe && this._elements && this.payment_intent_client_secret)
       {
           const elements = this._elements;
           this._stripe.confirmPayment({elements,
               confirmParams: {
               },
               redirect: "if_required"
             })
             .then((result) => {
               if (result.error) {
                 // Inform the customer that there was an error.
                 this.payment_status = STATUS_ERROR;
                 this._notifyOutputChanged();
                 this.showError(result.error.message!);
               
               }
               else {
                 // The payment has been processed successfully.
                 this.orderComplete("Payment has been successfully processed. Please wait while we place your order..");
                 this.payment_status = STATUS_COMPLETED;
                 this._notifyOutputChanged();             
               }
             });
           }else
           this.showError("ERROR: Not initialised Stripe client or empty PaymentIntentClientSecret. Please contact your technical team");
           
       }
       catch(err) {
         this.payment_status = STATUS_ERROR;
         this._notifyOutputChanged();
         console.log(err);
         this.showError("The payment component has not been initialised properly.");
       }     
   }

    /* ------- Post-payment helpers ------- */
   
  //This method displays an error message when there is some issue while processing payment.
  private showError(errorMsgText: string) {
    this.changeLoadingState(false);
    document.querySelector(".sr-field-success")!.classList.add("hidden");
    document.querySelector(".sr-field-error")!.classList.remove("hidden");
    var errorMsg = document.querySelector(".sr-field-error");
    errorMsg!.textContent = errorMsgText;

    // Timeout function to hide the error message after some time
    setTimeout(() => {
      errorMsg!.textContent = "";
      }, 10000);
   }
 
 //This method displays a success message when the payment is complete
   private orderComplete(successMsgText: string) {
    // document.querySelector(".sr-payment-form")!.classList.add("hidden");
    document.querySelector(".sr-field-success")!.classList.remove("hidden");
    document.querySelector(".sr-field-error")!.classList.add("hidden");
    var successMsg = document.querySelector(".sr-field-success");
    successMsg!.textContent = successMsgText;
    this.changeLoadingState(false);
   }
 
   // Resets the form status to new. Use with the "Reset" property of the component to handle the behavior in the app
   private reset() {
     document.querySelector(".sr-payment-form")!.classList.remove("hidden");
     document.querySelector(".sr-field-success")!.classList.add("hidden");
     document.querySelector(".sr-field-error")!.classList.add("hidden");
     this.changeLoadingState(false);
   }

   // Show a spinner on payment submission and disable the payment button
   private changeLoadingState(isLoading: boolean) {
		if (isLoading) {
      document.getElementById('submit')!.setAttribute("disabled","disabled");
			document.querySelector("#spinner")!.classList.remove("hidden");
      document.querySelector("#order-amount")!.classList.add("hidden");
      //document.getElementById("sr-input sr-card-element")!.setAttribute("disabled","disabled");       
		} 
    else {
      document.getElementById('submit')!.removeAttribute("disabled");
			document.querySelector("#spinner")!.classList.add("hidden");
      document.querySelector("#order-amount")!.classList.remove("hidden");
      //document.getElementById("sr-input sr-card-element")!.removeAttribute("disabled");
		}
	}
}
