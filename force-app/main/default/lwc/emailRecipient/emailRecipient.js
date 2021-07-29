import { LightningElement, api, track, wire } from 'lwc';
import { getFieldValue, getFieldDisplayValue } from 'lightning/uiRecordApi';
import FIELD_Email from '@salesforce/schema/Contact.Email';
import FIELD_Name from '@salesforce/schema/Contact.Name';

export default class EmailRecipient extends LightningElement {

    
    expand = false;
    contactOpen = false;
    detail = false;

    innerId;

    @api
    newContactPerson = false;

    @track
    contactSubmited = false;
    
    selectedRecipient = {
        fields:{

        }
    }; 

    _email = '';

    
    set recipient(value){
        this.selectedRecipient = JSON.parse(JSON.stringify(value));
        this.innerId = this.selectedRecipient.id;
    }

    @api
    get recipient(){
        return this.selectedRecipient;
    }

    
    handleContact(event){
        if(event.detail.contact){
            this.selectedRecipient = event.detail.contact;
        }else{
            this.selectedRecipient = {
                fields:{}
            }; 
            this.selectedRecipient.fields[FIELD_Email.fieldApiName] = this._email;
            this.selectedRecipient.fields[FIELD_Name.fieldApiName] = '';
            this.selectedRecipient.fields.Id = this.innerId;
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
     * do something code when new contact info is submit or cancel
     * @param {*} event 
     */
    handleChangeContactInfo(event){
        if (event.detail.submit) {
            console.log('a new contact is :' + JSON.stringify(event.detail.contact));
            if (event.detail.new){
                this.selectedRecipient = event.detail.contact;
            }
            this.contactSubmited = true;
        }else{
            this.contactOpen = false;
            this.newContactPerson = false;
            this.selectedRecipient = {
                fields:{}
            }; 
            this.selectedRecipient.fields[FIELD_Email.fieldApiName] = this._email;
            this.selectedRecipient.fields[FIELD_Name.fieldApiName] = '';
            this.selectedRecipient.fields.Id = this.innerId;
        }
    }

    /**
     * change email will change recipient's email, and update to address.
     * 
     * @param {detail:{value:String}} event 
     */
    handleChangeEmail(event){
        this._email = event.detail.value;
        this.updateRecordField(this.selectedRecipient, FIELD_Email, event.detail.value);
        //this.selectedRecipient.Email = event.detail.value;
        //this.updateRecordField(this.selectedRecipient, FIELD_Email, event.detail.value);
        this.dispatchEvent(new CustomEvent('changecontact', {
            bubbles: true,
            composed: true,
            detail:{
                contact:this.selectedRecipient,
                id:this.innerId
            }
        }));
    }

    addContact(){
        this.contactOpen = true;
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

    @api
    get email() {
        return this._email;
    }

    set email(value){
        this._email = value;
        this.updateRecordField(this.selectedRecipient, FIELD_Email, value);
    }

    @api
    get name(){
        if (!this.selectedRecipient.fields){
            return '';
        }
        return this._getDisplayValue(this.selectedRecipient, FIELD_Name);
    }
 
    updateRecordField(data, field, value){
        if (data && data.fields && data.fields[field.fieldApiName]) {
            data.fields[field.fieldApiName].value = value;
        }
    }

    _getDisplayValue(data, field) {
		return getFieldDisplayValue(data, field) ? getFieldDisplayValue(data, field) : getFieldValue(data, field);
	}
}