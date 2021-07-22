import { LightningElement, api, track, wire } from 'lwc';
import CONTACT_OBJECT from '@salesforce/schema/Contact';
import { getFieldValue, getFieldDisplayValue } from 'lightning/uiRecordApi';
import FIELD_Email from '@salesforce/schema/Contact.Email';


const NEW_CONTACT_VALUE = '7';

export default class EmailRecipient extends LightningElement {
    expand = false;
    contactOpen = false;
    detail = false;

    innerId;

    @api
    newContactPerson = false;

    @api
    _recipient = {
        email:'xxx@yy.zz',
        lob:'lob',
        purpose:'Purpose',
        name:'Test',
        id: Math.floor(Math.random()*1000)+''
    };

    
    selectedRecipient = {}; 

    get emailReadonly(){
        return !this.newContactPerson;
    }
    
    set recipient(value){
        this.selectedRecipient = JSON.parse(JSON.stringify(value));
        this.innerId = this.selectedRecipient.id;
    }

    @api
    get recipient(){
        return this.selectedRecipient;;
    }

    constructor(){
        super();
    }

    handleContact(event){
        if(event.detail.contact){
            this.selectedRecipient = event.detail.contact;
        }
        this.newContactPerson = !!event.detail.new;

        this.dispatchEvent(new CustomEvent('changecontact', {
            bubbles: true,
            composed: true,
            detail:{
                contact:this.selectedRecipient,
                id:this.innerId
            }
        }));
    }

    changeExpand(){
        this.expand =!this.expand;
    }

    /**
     * change email will change recipient's email, and update to address.
     * 
     * @param {detail:{value:String}} event 
     */
    handleChangeEmail(event){
        //this.selectedRecipient.Email = event.detail.value;
        this.updateRecordField(this.selectedRecipient, FIELD_Email, event.detail.value);
        this.dispatchEvent(new CustomEvent('changecontact', {
            bubbles: true,
            composed: true,
            detail:{
                contact:this.selectedRecipient,
                id:this.innerId
            }
        }));
    }

    /**
     * do something code when new contact
     */
    createNewPersonPoint(){
        
    }

    addContact(){
        this.contactOpen = true;
    }

    /**
     * do something code when new contact info is submit or cancel
     * @param {*} event 
     */
    handleNewContact(event){
        if (event.detail.submit) {
            console.log(JSON.stringify(event.detail.contact));
        }
        this.newContactPerson = false;
       
    }

    /**
     * remove Recipient
     */
    closeAddRecipient(){
        this.dispatchEvent(new CustomEvent('cancelrepient', {
            bubbles: true,
            composed: true,
            detail:{
                recipient:this.recipient,
                id:this.innerId
            }
        }))
    }
    get email() {
        return this._getDisplayValue(this.selectedRecipient, FIELD_Email);
    }

    updateRecordField(data, field, value){
        if (data) {
            data.fields[field.fieldApiName].value = value;
        }
    }

    _getDisplayValue(data, field) {
		return getFieldDisplayValue(data, field) ? getFieldDisplayValue(data, field) : getFieldValue(data, field);
	}
}